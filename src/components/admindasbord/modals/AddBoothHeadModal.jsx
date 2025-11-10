import React, { useState, useEffect } from 'react'
import apiService, { displayAllBoothForSaktiAllocation } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage'
import RemovePhotoConfirmModal from './RemovePhotoConfirmModal.jsx'
import DuplicateMobileModal from './DuplicateMobileModal.jsx'

const AddBoothHeadModal = ({ isOpen, onClose, boothNumber, onSave, editData = null, mode = 'create', existingMobiles = [], duplicateContextLabel = 'बूथ प्रमुख', duplicateMessage = '' }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    voterCount: '',
    photo: null
  })
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [selectedBoothNumber, setSelectedBoothNumber] = useState(boothNumber || '')
  const [showBoothPicker, setShowBoothPicker] = useState(false)
  const [booths, setBooths] = useState([])
  const [loadingBooths, setLoadingBooths] = useState(false)
  const [duplicateModal, setDuplicateModal] = useState({ isOpen: false, mobile: '', message: '' })

  // Update form when editData changes
  useEffect(() => {
    if (editData && mode === 'edit' && isOpen) {
      setFormData({
        name: editData.name || '',
        phone: editData.phone || editData.phoneNumber || editData.mobile || '',
        address: '',
        email: '',
        voterCount: '',
        photo: null
      })
      // Load existing photo if available
      // Priority: photoPath > profileImage > photo
      const existingPhoto = editData.photoPath || editData.profileImage || editData.photo
      
      if (existingPhoto && existingPhoto.trim() !== '') {
        let photoUrl = existingPhoto.trim()
        
        // If it's not a full URL and not starting with / or data:, try to construct proper URL
        if (!photoUrl.startsWith('http') && !photoUrl.startsWith('/') && !photoUrl.startsWith('data:')) {
          // If it contains image extensions, it's likely a filename/path
          if (photoUrl.includes('.jpg') || photoUrl.includes('.jpeg') || 
              photoUrl.includes('.png') || photoUrl.includes('.gif') ||
              photoUrl.includes('.JPG') || photoUrl.includes('.JPEG') ||
              photoUrl.includes('.PNG') || photoUrl.includes('.GIF')) {
            photoUrl = '/' + photoUrl
          } else {
            if (editData.isPhoto) {
              photoUrl = '/' + photoUrl
            }
          }
        }
        
        setExistingPhotoUrl(photoUrl)
        setPhotoPreview(photoUrl)
      } else {
        setExistingPhotoUrl(null)
        setPhotoPreview(null)
      }
      setPhotoRemoved(false)
      setDuplicateModal({ isOpen: false, mobile: '', message: '' })
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        phone: '',
        address: '',
        email: '',
        voterCount: '',
        photo: null
      })
      setPhotoPreview(null)
      setExistingPhotoUrl(null)
      setPhotoRemoved(false)
      setDuplicateModal({ isOpen: false, mobile: '', message: '' })
    }
  }, [editData, mode, isOpen])

  // Cleanup photo preview URL when component unmounts or photo changes
  useEffect(() => {
    return () => {
      // Only revoke blob URLs (created from file uploads), not server URLs
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  // Update selected booth number when boothNumber prop changes
  useEffect(() => {
    if (boothNumber) {
      setSelectedBoothNumber(boothNumber)
    }
  }, [boothNumber, isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      // Only allow digits and max 10 digits
      const digitsOnly = value.replace(/\D/g, '')
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({
          ...prev,
          [name]: digitsOnly
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const validateMobile = (mobileNumber) => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      return false
    }
    const firstDigit = mobileNumber.charAt(0)
    return firstDigit === '6' || firstDigit === '9'
  }

  const normalizeMobileNumber = (value) => {
    if (!value) return ''
    const digits = value.toString().replace(/\D/g, '')
    if (digits.length > 10) {
      return digits.slice(-10)
    }
    return digits
  }

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Clean up old preview URL if exists (only blob URLs)
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
      setFormData(prev => ({
        ...prev,
        photo: file
      }))
      setPhotoRemoved(false) // Reset photoRemoved when new photo is uploaded
      setExistingPhotoUrl(null) // Clear existing photo URL when new one is uploaded
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreview(previewUrl)
    }
  }

  const handleRemovePhotoClick = () => {
    setShowRemoveConfirm(true)
  }

  const handleRemovePhotoConfirm = () => {
    // Clean up object URL if it was created from file upload
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }
    setFormData(prev => ({
      ...prev,
      photo: null
    }))
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setPhotoRemoved(true)
    // Reset file input
    const fileInput = document.getElementById('booth-head-photo-upload')
    if (fileInput) {
      fileInput.value = ''
    }
    setShowRemoveConfirm(false)
  }

  const handleRemovePhotoCancel = () => {
    setShowRemoveConfirm(false)
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (duplicateModal.isOpen) {
      setDuplicateModal({ isOpen: false, mobile: '', message: '' })
    }
    
    // Validate name first
    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }
    
    // Validate mobile number exists
    if (!formData.phone.trim()) {
      alert('Mobile number is required')
      return
    }
    
    // Validate mobile number format
    if (!validateMobile(formData.phone)) {
      alert('Invalid mobile number')
      return
    }

    const sanitizedExistingMobiles = Array.isArray(existingMobiles)
      ? existingMobiles.map(normalizeMobileNumber).filter(Boolean)
      : []
    const originalMobile = mode === 'edit'
      ? normalizeMobileNumber(
          editData?.phone ||
          editData?.phoneNumber ||
          editData?.mobile ||
          editData?.mobileNo ||
          editData?.mobile_no
        )
      : ''

    const normalizedInputMobile = normalizeMobileNumber(formData.phone)
    const isDuplicateMobile = normalizedInputMobile &&
      sanitizedExistingMobiles.includes(normalizedInputMobile) &&
      !(mode === 'edit' && normalizedInputMobile === originalMobile)

    if (isDuplicateMobile) {
      const messageToShow = duplicateMessage || `यह मोबाइल नंबर पहले से ही ${duplicateContextLabel} में उपयोग किया जा चुका है।`
      setDuplicateModal({
        isOpen: true,
        mobile: normalizedInputMobile,
        message: messageToShow
      })
      return
    }
 
    if (!selectedBoothNumber) {
      alert('कृपया बूथ नंबर चुनें')
      return
    }
    
    setLoading(true)
    try {
      // Convert photo to base64 if present
      let photoBase64 = ''
      let photoName = ''
      
      // If photo was removed in edit mode, send empty strings
      if (photoRemoved && mode === 'edit') {
        photoBase64 = ''
        photoName = ''
      } 
      // If new photo is uploaded, convert it to base64
      else if (formData.photo) {
        try {
          const base64String = await convertFileToBase64(formData.photo)
          // Remove data URL prefix if present (data:image/...;base64,)
          photoBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
          photoName = formData.photo.name
        } catch (error) {
          console.error('Error converting photo to base64:', error)
          alert('Failed to process photo. Please try again.')
          setLoading(false)
          return
        }
      }
      // If in edit mode and no new photo uploaded and photo not removed, keep existing photo
      else if (mode === 'edit' && existingPhotoUrl && !photoRemoved) {
        // Keep existing photo - don't send base64, server will keep existing
        photoName = editData.photo || ''
        photoBase64 = '' // Empty base64 means keep existing photo on server
      }

      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl

      if (mode === 'edit' && editData) {
        // Update mode - use updateAdmin API
        const updatePayload = {
          admin_id: editData.id,
          type: 'BP',
          sub_type: 'BP',
          name: formData.name.trim(),
          mobile_no: formData.phone.trim(),
          photo: photoRemoved ? '' : (photoName || editData.photo || ''),
          base64: photoBase64,
          idcard_no: '',
          booth_javabdari: selectedBoothNumber.toString(),
          page_javabdari: '',
          add: '',
          modify_by: '1'
        }

        console.log('Updating booth head data:', updatePayload)
        const response = await apiService.updateAdmin(updatePayload, panelApiUrl)
        
        if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
          onSave && onSave({ ...formData, boothNumber: selectedBoothNumber, apiResponse: response })
          onClose && onClose()
        } else {
          console.error('Update booth head unexpected response:', response)
          throw new Error('Failed to update booth head')
        }
      } else {
        // Create mode - use insertAdmin API
        const boothHeadData = {
          type: 'BP',
          sub_type: 'BP', // बूथ प्रमुख uses BP sub_type
          name: formData.name.trim(),
          mobile_no: formData.phone.trim(),
          photo: photoName || '',
          base64: photoBase64 || '',
          booth_javabdari: selectedBoothNumber.toString(),
          page_javabdari: '',
          idcard_no: '',
          add: ''
        }

        console.log('Submitting booth head data:', boothHeadData)
        const response = await apiService.insertAdmin(boothHeadData, panelApiUrl)
        
        if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
          // Success - call the provided onSave callback
          onSave && onSave({ ...formData, boothNumber: selectedBoothNumber, apiResponse: response })
          
          // Reset form
          setFormData({
            name: '',
            phone: '',
            address: '',
            email: '',
            voterCount: '',
            photo: null
          })
          
          onClose && onClose()
        } else {
          console.error('Insert booth head unexpected response:', response)
          throw new Error('Failed to save booth head')
        }
      }
    } catch (error) {
      console.error('Error saving booth head:', error)
      alert('बूथ प्रमुख सेव करने में विफल. कृपया पुन: प्रयास करें.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-3 sm:p-5 text-white" style={{backgroundColor: '#103a94'}}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {mode === 'edit' ? 'बूथ प्रमुख संपादित करें' : 'बूथ प्रमुख'}
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm">
                {mode === 'edit' ? 'Edit Booth Head' : 'Create New Booth Head'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4" noValidate>
          {/* Booth Responsibility Section */}
          <div className="bg-gray-100 rounded-lg p-2.5 sm:p-3">
            <p className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>बूथ की जिम्मेदारी</p>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>बूथ नं.</label>
            <input
              type="text"
              value={selectedBoothNumber || ''}
              readOnly
              className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border transition-all text-gray-800 text-sm sm:text-base cursor-not-allowed"
              style={{
                backgroundColor: '#f3f4f6', 
                borderColor: '#d1d5db', 
                color: '#6b7280'
              }}
              placeholder="बूथ नं."
            />
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>
              नाम
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
              placeholder="Enter name"
            />
          </div>

          {/* Mobile Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>
              मोबाइल नं.
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              maxLength={10}
              className="w-full px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
              placeholder="Enter mobile number"
            />
          </div>

          {/* Photo Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{color: '#103a94'}}>
              फोटो
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="booth-head-photo-upload"
              />
              {photoPreview ? (
                <div className="relative">
                  <label
                    htmlFor="booth-head-photo-upload"
                    className="block w-full h-28 sm:h-32 rounded-lg border overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer transition-all hover:bg-gray-100"
                    style={{borderColor: '#103a94'}}
                    onMouseEnter={(e) => e.target.style.borderColor = '#0d2f7a'}
                    onMouseLeave={(e) => e.target.style.borderColor = '#103a94'}
                  >
                    <img
                      src={photoPreview}
                      alt="Photo preview - Click to change"
                      className="max-w-full max-h-full object-contain"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemovePhotoClick}
                    className="mt-1.5 text-red-600 text-xs sm:text-sm hover:text-red-700 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Remove Photo</span>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="booth-head-photo-upload"
                  className="w-full h-20 sm:h-28 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all"
                  style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e6f0ff'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f4ff'}
                >
                  <div className="text-center">
                    <svg className="w-5 h-5 sm:w-7 sm:h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#103a94'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-xs sm:text-sm" style={{color: '#103a94'}}>Click to upload photo</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base disabled:opacity-60"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#0d2f7a')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#103a94')}
            >
              {loading ? 'सेव हो रहा है...' : (mode === 'edit' ? 'बूथ प्रमुख अपडेट करें' : 'बूथ प्रमुख बनाए')}
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Booth Picker Modal */}
    {showBoothPicker && (
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-6 text-white flex items-center justify-between" style={{backgroundColor: '#103a94'}}>
            <button 
              onClick={() => setShowBoothPicker(false)} 
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h3 className="text-lg sm:text-xl font-bold">बूथ</h3>
            <div className="w-8" />
          </div>
          <div className="p-3 max-h-[60vh] overflow-auto grid grid-cols-4 gap-3">
            {(loadingBooths ? Array.from({ length: 8 }, (_, i) => ({ id: `s-${i}`, number: null, isDuplicate: false })) : booths).map(item => {
              const num = item.number
              const isSelected = num !== null && parseInt(selectedBoothNumber) === num
              const isDuplicate = !!item.isDuplicate
              return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (num === null || isDuplicate) return
                  setSelectedBoothNumber(num.toString())
                  setShowBoothPicker(false)
                }}
                className={`rounded-xl border py-4 text-sm font-semibold transition-all ${num===null ? 'animate-pulse opacity-60' : ''} ${isSelected ? 'hover:opacity-80' : ''}`}
                style={
                  isSelected
                    ? { backgroundColor: '#103a94', color: '#ffffff', borderColor: '#103a94', cursor: 'pointer' }
                    : isDuplicate
                      ? { backgroundColor: '#d1d5db', color: '#111827', borderColor: '#d1d5db', cursor: 'not-allowed' }
                      : { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#e5e7eb', cursor: 'pointer' }
                }
              >
                {num===null ? '…' : num}
              </button>
              )
            })}
          </div>
          <div className="p-3 sm:p-4" style={{backgroundColor: '#103a94'}}>
            <button 
              type="button"
              onClick={() => setShowBoothPicker(false)} 
              className="w-full py-3 rounded-lg text-white font-semibold transition-all shadow-sm hover:shadow-md text-sm sm:text-base"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
            >
              बंद करें
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Photo Confirmation Modal */}
    <RemovePhotoConfirmModal
      isOpen={showRemoveConfirm}
      onConfirm={handleRemovePhotoConfirm}
      onCancel={handleRemovePhotoCancel}
      zIndex={70}
    />
    <DuplicateMobileModal
      isOpen={duplicateModal.isOpen}
      mobileNumber={duplicateModal.mobile}
      message={duplicateModal.message}
      onClose={() => setDuplicateModal({ isOpen: false, mobile: '', message: '' })}
    />
  </>
)
}

export default AddBoothHeadModal

