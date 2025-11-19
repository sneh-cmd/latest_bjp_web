import React, { useState, useEffect } from 'react'
import localStorageManager from '../../../utils/localStorage.js'
import apiService from '../../../apidata.jsx'
import RemovePhotoConfirmModal from './RemovePhotoConfirmModal.jsx'

const ProfileModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Load current user data
  useEffect(() => {
    if (isOpen) {
      const userData = localStorageManager.getUserData()
      if (userData?.admin) {
        setName(userData.admin.name || '')
        setMobile(userData.admin.mobileNo || userData.admin.mobile || userData.phoneNumber || '')
        
        // Load existing photo
        const existingPhoto = userData.admin.photoPath || userData.admin.photo
        const isValidPhotoUrl = existingPhoto && 
                                existingPhoto.trim() !== '' && 
                                (existingPhoto.startsWith('http') || 
                                 existingPhoto.startsWith('/') || 
                                 existingPhoto.includes('.jpg') || 
                                 existingPhoto.includes('.jpeg') || 
                                 existingPhoto.includes('.png') ||
                                 existingPhoto.includes('.gif'))
        
        if (isValidPhotoUrl) {
          setExistingPhotoUrl(existingPhoto)
          setPhotoPreview(existingPhoto)
        } else {
          setExistingPhotoUrl(null)
          setPhotoPreview(null)
        }
        setPhotoRemoved(false)
        setIsEditMode(false)
      }
    }
  }, [isOpen])

  // Cleanup photo preview URL
  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  if (!isOpen) return null

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Clean up old preview URL if exists
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
      setPhoto(file)
      setPhotoRemoved(false)
      setExistingPhotoUrl(null)
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreview(previewUrl)
      setIsEditMode(true)
    }
  }

  const handleRemovePhotoClick = () => {
    setShowRemoveConfirm(true)
  }

  const handleConfirmRemovePhoto = () => {
    // Clean up preview URL
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }
    setPhoto(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setPhotoRemoved(true)
    setShowRemoveConfirm(false)
    setIsEditMode(true)
  }

  const handleCancelRemovePhoto = () => {
    setShowRemoveConfirm(false)
  }

  const normalizeMobileNumber = (value) => {
    if (!value) return ''
    const digits = value.toString().replace(/\D/g, '')
    if (digits.length > 10) {
      return digits.slice(-10)
    }
    return digits
  }

  const validateMobile = (mobileNumber) => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      return false
    }
    const firstDigit = mobileNumber.charAt(0)
    return firstDigit === '6' || firstDigit === '9'
  }

  const handleUpdateProfile = async () => {
    try {
      setLoading(true)

      // Validate name
      if (!name.trim()) {
        alert('नाम आवश्यक है')
        return
      }

      // Validate mobile
      if (!mobile.trim()) {
        alert('मोबाइल नंबर आवश्यक है')
        return
      }

      const normalizedMobile = normalizeMobileNumber(mobile)
      if (!validateMobile(normalizedMobile)) {
        alert('अमान्य मोबाइल नंबर')
        return
      }

      const userData = localStorageManager.getUserData()
      const currentSession = localStorageManager.getSession()
      const panelApiUrl = userData?.panel?.apiUrl || userData?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'

      // Convert photo to base64 if new photo is uploaded
      let photoBase64 = ''
      if (photo) {
        const reader = new FileReader()
        photoBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64String = reader.result.split(',')[1]
            resolve(base64String)
          }
          reader.onerror = reject
          reader.readAsDataURL(photo)
        })
      }

      // Prepare payload
      // If photo was explicitly removed, send empty strings
      // If no new photo is provided and photo wasn't removed, preserve existing photo
      const photoValue = photoRemoved 
        ? '' // Photo was removed, send empty string
        : (photo ? photo.name : (currentSession?.admin?.photo || '')) // Keep existing or use new photo name
      
      const base64Value = photoRemoved 
        ? '' // Photo was removed, send empty base64
        : (photoBase64 || '') // Use new base64 if provided, otherwise empty (keeps existing)

      const payload = {
        admin_id: currentSession?.admin?.adminId || currentSession?.admin?.admin_id || currentSession?.admin?.id,
        type: currentSession?.admin?.type || 'A',
        sub_type: currentSession?.admin?.subType || currentSession?.admin?.sub_type || 'A',
        name: name.trim(),
        mobile_no: normalizedMobile,
        photo: photoValue,
        base64: base64Value,
        idcard_no: currentSession?.admin?.idcardNo || currentSession?.admin?.idcard_no || '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }

      // Call update API
      await apiService.updateAdmin(payload, panelApiUrl)

      // Refresh admin data from API
      const admins = await apiService.displayAdmin(panelApiUrl)
      const updatedAdmin = admins.find(a => 
        (a.adminId || a.admin_id) === payload.admin_id
      )

      if (updatedAdmin) {
        // Update session with new data
        const updatedSession = {
          ...currentSession,
          admin: {
            ...currentSession.admin,
            name: updatedAdmin.name,
            mobileNo: updatedAdmin.mobileNo,
            mobile: updatedAdmin.mobileNo,
            phoneNumber: updatedAdmin.mobileNo,
            photoPath: updatedAdmin.photoPath,
            photo: updatedAdmin.photo
          }
        }
        localStorageManager.updateSession({ admin: updatedSession.admin })
        
        // Update local state to reflect changes immediately
        setName(updatedAdmin.name)
        setMobile(updatedAdmin.mobileNo)
        if (updatedAdmin.photoPath) {
          setExistingPhotoUrl(updatedAdmin.photoPath)
          setPhotoPreview(updatedAdmin.photoPath)
        } else {
          setExistingPhotoUrl(null)
          setPhotoPreview(null)
        }
        setPhoto(null)
        setPhotoRemoved(false)
      }

     
      setIsEditMode(false)
      // Don't close modal, just exit edit mode so user can see updated profile
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert(error.message || 'प्रोफ़ाइल अपडेट करने में विफल')
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (e) => {
    setName(e.target.value)
    setIsEditMode(true)
  }

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 10) {
      setMobile(value)
      setIsEditMode(true)
    }
  }

  return (
    <>
      <div className={`fixed inset-0 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#102463] px-4 py-3 flex items-center justify-between z-10">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-white">प्रोफ़ाइल</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Profile Picture Section */}
            <div className="relative flex flex-col items-center mb-6 pt-8">
              {/* Update Profile Button - Only show when NOT in edit mode */}
              {!isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="absolute top-0 right-0 bg-white text-[#102463] text-sm font-semibold px-4 py-1.5 rounded-full shadow-md border border-[#102463]/10 hover:bg-[#f0f4ff] transition-colors"
                >
                  अपडेट प्रोफ़ाइल
                </button>
              )}
              <div className="relative">
                {/* Profile Picture */}
                <div className="w-32 h-32 bg-yellow-200 rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-yellow-700">
                      {name.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                
                {/* Camera Icon Overlay - Only show in edit mode */}
                {isEditMode && (
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#102463] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-[#0a1a4a] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                )}
              </div>

              {/* Remove Photo Link - Only show in edit mode */}
              {isEditMode && (photoPreview || existingPhotoUrl) && (
                <button
                  onClick={handleRemovePhotoClick}
                  className="mt-3 text-red-600 text-sm font-medium hover:underline"
                >
                  X Remove Photo
                </button>
              )}
            </div>

            {/* Name Field */}
            <div className="mb-4">
              <label className="block text-gray-900 text-sm font-medium mb-2">
                नाम
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                disabled={!isEditMode}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102463] focus:border-transparent text-gray-900 ${
                  !isEditMode ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
                placeholder="नाम दर्ज करें"
              />
            </div>

            {/* Mobile Field */}
            <div className="mb-6">
              <label className="block text-gray-900 text-sm font-medium mb-2">
                मोबाइल
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={handleMobileChange}
                maxLength={10}
                disabled={!isEditMode}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#102463] focus:border-transparent text-gray-900 ${
                  !isEditMode ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
                placeholder="मोबाइल नंबर दर्ज करें"
              />
            </div>

            {/* Update Button - Always visible when in edit mode */}
            {isEditMode && (
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="w-full bg-[#102463] hover:bg-[#0a1a4a] text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>अपडेट हो रहा है...</span>
                  </div>
                ) : (
                  'प्रोफ़ाइल अपडेट'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Remove Photo Confirmation Modal */}
      <RemovePhotoConfirmModal
        isOpen={showRemoveConfirm}
        onConfirm={handleConfirmRemovePhoto}
        onCancel={handleCancelRemovePhoto}
        zIndex={70}
      />
    </>
  )
}

export default ProfileModal

