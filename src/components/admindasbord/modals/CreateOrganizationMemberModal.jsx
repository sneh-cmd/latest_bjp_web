import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import RemovePhotoConfirmModal from './RemovePhotoConfirmModal.jsx'
import DuplicateMobileModal from './DuplicateMobileModal.jsx'

const CreateOrganizationMemberModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  mainAdminId, 
  editData = null, 
  mode = 'create',
  existingMobiles = [],
  duplicateContextLabel = 'संगठन सदस्य',
  duplicateMessage = ''
}) => {
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showRoleList, setShowRoleList] = useState(false)
  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [rolesError, setRolesError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [duplicateModal, setDuplicateModal] = useState({ isOpen: false, mobile: '', message: '' })

  // Update form when editData changes
  useEffect(() => {
    if (editData && mode === 'edit' && isOpen) {
      setName(editData.name || '')
      setMobile(editData.phoneNumber || editData.mobileNo || editData.mobile || '')
      setPhoto(null) // Reset photo, user can upload new one if needed
      
      // Set role from editData (assuming editData has designation_sort or similar)
      const roleId = editData.designation_sort || editData.role || editData.roleId || ''
      setRole(roleId)
      
      // Load existing photo if available
      const existingPhoto = editData.photoPath || editData.profileImage || editData.photo
      // Check if it's a valid photo URL
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
    } else if (mode === 'create' && isOpen) {
      // Reset form for create mode
      setRole('')
      setName('')
      setMobile('')
      setPhoto(null)
      setPhotoPreview(null)
      setExistingPhotoUrl(null)
      setPhotoRemoved(false)
    }
  }, [editData, mode, isOpen])

  // Fetch designations from API
  useEffect(() => {
    if (isOpen) {
      const fetchDesignations = async () => {
        setLoadingRoles(true)
        setRolesError(null)
        try {
          const userData = localStorageManager.getUserData()
          const panelApiUrl = userData?.panel?.apiUrl || null
          
          // Fetch designations with type 'SP' (Shakti Kendra Pramukh)
          const designations = await apiService.getDesignations('SP', panelApiUrl)
          
          // Transform API response to match component structure
          // API returns: { ud, type, designation_sort, designation, login_allow, status }
          // We need: { id, label }
          const transformedRoles = designations.map(item => ({
            id: item.designation_sort || item.type || item.ud?.toString(),
            label: item.designation || ''
          })).filter(item => item.label) // Filter out empty labels
          
          setRoles(transformedRoles)
        } catch (error) {
          console.error('Error fetching designations:', error)
          setRolesError('पद लोड करने में त्रुटि')
          // Fallback to empty array or keep previous roles
          setRoles([])
        } finally {
          setLoadingRoles(false)
        }
      }
      
      fetchDesignations()
    }
  }, [isOpen])

  // Cleanup photo preview URL when component unmounts or photo changes
  useEffect(() => {
    return () => {
      // Only revoke blob URLs (created from file uploads), not server URLs
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  if (!isOpen) return null

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Remove non-digits
    if (value.length <= 10) {
      setMobile(value)
    }
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

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Clean up old preview URL if exists (only blob URLs)
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
      setPhoto(file)
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
    setPhoto(null)
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setPhotoRemoved(true)
    // Reset file input
    const fileInput = document.getElementById('org-member-photo-upload')
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
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSave = async () => {
    if (duplicateModal.isOpen) {
      setDuplicateModal({ isOpen: false, mobile: '', message: '' })
    }

    // Validate name first
    if (!name.trim()) {
      alert('Name is required')
      return
    }
    
    // Validate mobile number exists
    if (!mobile.trim()) {
      alert('Mobile number is required')
      return
    }
    
    // Validate mobile number format
    if (!validateMobile(mobile)) {
      alert('Invalid mobile number')
      return
    }
    
    const normalizedMobile = normalizeMobileNumber(mobile)
    const sanitizedExistingMobiles = Array.isArray(existingMobiles)
      ? existingMobiles.map(normalizeMobileNumber).filter(Boolean)
      : []
    const originalMobile = mode === 'edit'
      ? normalizeMobileNumber(
          editData?.mobile ||
          editData?.mobileNo ||
          editData?.mobile_no ||
          editData?.phoneNumber ||
          editData?.phone
        )
      : ''

    const isDuplicateMobile = normalizedMobile &&
      sanitizedExistingMobiles.includes(normalizedMobile) &&
      !(mode === 'edit' && normalizedMobile === originalMobile)

    if (isDuplicateMobile) {
      const messageToShow = duplicateMessage || `यह मोबाइल नंबर पहले से ही ${duplicateContextLabel} में उपयोग किया जा चुका है।`
      setDuplicateModal({
        isOpen: true,
        mobile: normalizedMobile,
        message: messageToShow
      })
      return
    }

    if (!role) {
      alert('कृपया पद चुनें')
      return
    }

    // Get main_admin_id from props or try to get from user data
    let finalMainAdminId = mainAdminId || '0'
    if (!finalMainAdminId || finalMainAdminId === '0') {
      try {
        const userData = localStorageManager.getUserData()
        finalMainAdminId = userData?.adminId || userData?.admin_id || '0'
      } catch (error) {
        console.warn('Could not get main_admin_id from localStorage:', error)
      }
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
      else if (photo) {
        try {
          const base64String = await convertFileToBase64(photo)
          // Remove data URL prefix if present (data:image/...;base64,)
          photoBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
          photoName = photo.name
        } catch (error) {
          console.error('Error converting photo to base64:', error)
          alert('फोटो प्रोसेस करने में त्रुटि. कृपया पुनः प्रयास करें.')
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

      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'

      let response
      let payload

      if (mode === 'edit' && editData) {
        // Prepare payload for update_admin API
        payload = {
          admin_id: editData.id || editData.adminId || editData.admin_id,
          type: editData.type || 'SP',
          sub_type: editData.subType || editData.sub_type || 'SS',
          name: name.trim(),
          mobile_no: mobile.trim(),
          photo: photoName || editData.photo || '',
          base64: photoBase64 || '', // Only send base64 if a new photo was uploaded
          idcard_no: editData.idcardNo || editData.idcard_no || '0',
          booth_javabdari: '0',
          page_javabdari: '0',
          add: '',
          modify_by: '1'
        }

        console.log('Updating organization member with payload:', payload)
        console.log('Using API endpoint:', panelApiUrl)
        
        // Call the updateAdmin API
        response = await apiService.updateAdmin(payload, panelApiUrl)
      } else {
        // Prepare payload for create mode
        payload = {
          type: 'SP',  // Shakti Kendra Pramukh type
          sub_type: 'SS',  // Organization Member sub-type (as per example)
          main_admin_id: String(finalMainAdminId),
          name: name.trim(),
          mobile_no: mobile.trim(),
          photo: photoName || '',
          base64: photoBase64 || '',
          idcard_no: '0',
          booth_javabdari: '0',
          page_javabdari: '0',
          add: '',  // Address field - empty for organization members
          create_by: '1'
        }

        console.log('Creating organization member with payload:', payload)
        console.log('Using API endpoint:', panelApiUrl)
        
        // Call the insertAdmin API
        response = await apiService.insertAdmin(payload, panelApiUrl)
      }
      
      console.log('API Response:', response)
      
      // Check if response indicates success
      let isSuccess = false
      let errorMessage = null
      
      if (response) {
        // Check for success object format
        if (typeof response === 'object' && response.success === true) {
          isSuccess = true
        }
        // Check if it's an array with success indicator
        else if (Array.isArray(response)) {
          const firstItem = response[0]
          if (firstItem && firstItem.Column1 && firstItem.Column1.toLowerCase() === 'ok') {
            isSuccess = true
          } else if (firstItem && (firstItem.error || firstItem.Error)) {
            errorMessage = firstItem.error || firstItem.Error
          } else if (response.length > 0) {
            isSuccess = true
          }
        }
        // Check for other success indicators
        else if (typeof response === 'object') {
          if (response.Success === "2") {
            isSuccess = true
          } else if (response.error || response.Error) {
            errorMessage = response.error || response.Error
          } else if (response.message && (response.message.toLowerCase().includes('success') || response.message.toLowerCase().includes('created'))) {
            isSuccess = true
          }
        }
      }
      
      if (!isSuccess) {
        const msg = errorMessage || 'Unknown error occurred - API response did not indicate success'
        console.error('API call did not succeed. Full response:', response)
        throw new Error(msg)
      }
      
      console.log(`✅ Organization member ${mode === 'edit' ? 'updated' : 'created'} successfully!`)
      
      // Clear form
      setRole('')
      setName('')
      setMobile('')
      setPhoto(null)
      setPhotoPreview(null)
      setExistingPhotoUrl(null)
      setPhotoRemoved(false)
      
      // Call onSubmit callback if provided (for parent component to refresh list)
      if (onSubmit) {
        onSubmit(payload)
      }
      
      // Close modal
      onClose()
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} organization member:`, error)
      alert(`त्रुटि: ${error.message || `संगठन के सदस्य ${mode === 'edit' ? 'अपडेट' : 'बनाने'} में असफल`}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 text-white" style={{backgroundColor: '#103a94'}}>
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
              <h2 className="text-lg sm:text-xl font-bold">संगठन के सदस्य</h2>
              <p className="text-blue-100 text-xs sm:text-sm">
                {mode === 'edit' ? 'Edit संगठन के सदस्य' : 'Create New'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Role Field */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
              पद
            </label>
            <div className="relative">
              <button 
                onClick={() => setShowRoleList(prev=>!prev)} 
                disabled={loadingRoles}
                className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg border flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-800 text-sm sm:text-base"
                style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
                onFocus={(e) => e.target.style.borderColor = '#103a94'}
                onBlur={(e) => e.target.style.borderColor = '#103a94'}
              >
                <span>
                  {loadingRoles ? 'लोड हो रहा है...' : 
                   rolesError ? rolesError :
                   role ? (roles.find(r=>r.id===role)?.label || '') : 'पद चुनें'}
                </span>
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
              </button>
              {showRoleList && !loadingRoles && !rolesError && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                  {roles.length > 0 ? (
                    roles.map(r => (
                      <button key={r.id} onClick={()=>{setRole(r.id); setShowRoleList(false)}} className="w-full text-left px-3 py-2 hover:bg-gray-100">
                        {r.label}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">कोई पद उपलब्ध नहीं</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
              नाम
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e)=>setName(e.target.value)} 
              placeholder="Enter name"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
            />
          </div>

          {/* Mobile Field */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
              मोबाइल नं.
            </label>
            <input 
              type="tel" 
              value={mobile} 
              onChange={handleMobileChange} 
              placeholder="Enter mobile number"
              maxLength={10} 
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
            />
          </div>

          {/* Photo Field */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
              फोटो
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="org-member-photo-upload"
              />
              {photoPreview ? (
                <div className="relative">
                  <label
                    htmlFor="org-member-photo-upload"
                    className="block w-full h-32 sm:h-40 rounded-lg border overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer transition-all hover:bg-gray-100"
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
                    className="mt-2 text-red-600 text-xs sm:text-sm hover:text-red-700 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Remove Photo</span>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="org-member-photo-upload"
                  className="w-full h-24 sm:h-32 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all"
                  style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e6f0ff'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f4ff'}
                >
                  <div className="text-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#103a94'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-xs sm:text-sm" style={{color: '#103a94'}}>Click to upload photo</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#0d2f7a')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#103a94')}
            >
              {loading 
                ? (mode === 'edit' ? 'अपडेट हो रहा है...' : 'सेव हो रहा है...') 
                : (mode === 'edit' ? 'अपडेट करें' : 'सेव करें')}
            </button>
          </div>
        </div>

        {/* Remove Photo Confirmation Modal */}
        <RemovePhotoConfirmModal
          isOpen={showRemoveConfirm}
          onConfirm={handleRemovePhotoConfirm}
          onCancel={handleRemovePhotoCancel}
        />
      </div>
    </div>
    <DuplicateMobileModal
      isOpen={duplicateModal.isOpen}
      mobileNumber={duplicateModal.mobile}
      message={duplicateModal.message}
      onClose={() => setDuplicateModal({ isOpen: false, mobile: '', message: '' })}
    />
    </>
  )
}

export default CreateOrganizationMemberModal


