import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage'
import RemovePhotoConfirmModal from './RemovePhotoConfirmModal.jsx'

const AddCoInchargeModal = ({ isOpen, onClose, boothNumber, onSave, editData = null, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    photo: null,
    designation: ''
  })
  const [loading, setLoading] = useState(false)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [designations, setDesignations] = useState([])
  const [loadingDesignations, setLoadingDesignations] = useState(false)

  // Fetch designations from API
  useEffect(() => {
    if (isOpen) {
      const fetchDesignations = async () => {
        setLoadingDesignations(true)
        try {
          const userData = localStorageManager.getUserData()
          const panelApiUrl = userData?.panel?.apiUrl || null
          
          // Fetch designations with type 'BP' (Booth Pramukh)
          const designationsData = await apiService.getDesignations('BP', panelApiUrl)
          
          // Transform API response to match component structure
          // API returns: { ud, type, designation_sort, designation, login_allow, status }
          const transformedDesignations = designationsData.map(item => ({
            id: item.designation_sort || item.type || item.ud?.toString(),
            label: item.designation || ''
          })).filter(item => item.label) // Filter out empty labels
          
          setDesignations(transformedDesignations)
        } catch (error) {
          console.error('Error fetching designations:', error)
          setDesignations([])
        } finally {
          setLoadingDesignations(false)
        }
      }
      
      fetchDesignations()
    }
  }, [isOpen])

  // Update form when editData changes
  useEffect(() => {
    if (editData && mode === 'edit' && isOpen) {
      setFormData({
        name: editData.name || '',
        phone: editData.phone || editData.phoneNumber || editData.mobileNo || editData.mobile || '',
        address: '',
        email: '',
        photo: null,
        designation: editData.role || editData.designation || ''
      })
      
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
        let photoUrl = existingPhoto.trim()
        // If it's not a full URL and not starting with / or data:, try to construct proper URL
        if (!photoUrl.startsWith('http') && !photoUrl.startsWith('/') && !photoUrl.startsWith('data:')) {
          if (photoUrl.includes('.jpg') || photoUrl.includes('.jpeg') || 
              photoUrl.includes('.png') || photoUrl.includes('.gif') ||
              photoUrl.includes('.JPG') || photoUrl.includes('.JPEG') ||
              photoUrl.includes('.PNG') || photoUrl.includes('.GIF')) {
            photoUrl = '/' + photoUrl
          } else if (editData.isPhoto) {
            photoUrl = '/' + photoUrl
          }
        }
        setExistingPhotoUrl(photoUrl)
        setPhotoPreview(photoUrl)
      } else {
        setExistingPhotoUrl(null)
        setPhotoPreview(null)
      }
      setPhotoRemoved(false)
    } else if (mode === 'create' && isOpen) {
      // Reset form for create mode
      setFormData({
        name: '',
        phone: '',
        address: '',
        email: '',
        photo: null,
        designation: ''
      })
      setExistingPhotoUrl(null)
      setPhotoPreview(null)
      setPhotoRemoved(false)
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
    const fileInput = document.getElementById('co-incharge-photo-input')
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
    
    if (!formData.designation.trim()) {
      alert('कृपया पद दर्ज करें')
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

      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl

      if (mode === 'edit' && editData) {
        // Update mode - use updateAdmin API
        const updatePayload = {
          admin_id: editData.id || editData.adminId || editData.admin_id,
          type: 'BP',
          sub_type: 'BS',
          name: formData.name.trim(),
          mobile_no: formData.phone.trim(),
          photo: photoRemoved ? '' : (photoName || editData.photo || ''),
          base64: photoBase64 || '',
          idcard_no: '',
          booth_javabdari: boothNumber.toString(),
          page_javabdari: '',
          add: '',
          modify_by: '1',
          designation: formData.designation.trim()
        }

        console.log('Updating co-incharge data:', updatePayload)
        const response = await apiService.updateAdmin(updatePayload, panelApiUrl)
        
        if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
          onSave && onSave({ ...formData, boothNumber, apiResponse: response })
          onClose && onClose()
        } else {
          console.error('Update co-incharge unexpected response:', response)
          throw new Error('Failed to update co-incharge')
        }
      } else {
        // Create mode - use insertAdmin API
        const coInchargeData = {
          type: 'BP',
          sub_type: 'BS', // बुथ सह इनचार्ज uses BS sub_type
          name: formData.name.trim(),
          mobile_no: formData.phone.trim(),
          photo: photoName || '',
          base64: photoBase64 || '',
          booth_javabdari: boothNumber.toString(),
          page_javabdari: '',
          idcard_no: '',
          add: '',
          designation: formData.designation.trim()
        }

        console.log('Submitting co-incharge data:', coInchargeData)
        const response = await apiService.insertAdmin(coInchargeData, panelApiUrl)
        
        if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
          // Success - call the provided onSave callback
          onSave && onSave({ ...formData, boothNumber, apiResponse: response })
          
          // Reset form
          setFormData({
            name: '',
            phone: '',
            address: '',
            email: '',
            photo: null,
            designation: ''
          })
          
          onClose && onClose()
        } else {
          console.error('Insert co-incharge unexpected response:', response)
          throw new Error('Failed to save co-incharge')
        }
      }
    } catch (error) {
      console.error('Error saving co-incharge:', error)
      alert('बूथ सह इनचार्ज सेव करने में विफल. कृपया पुन: प्रयास करें.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
              <h2 className="text-lg sm:text-xl font-bold">
                {mode === 'edit' ? 'बुथ सह इनचार्ज संपादित करें' : 'बुथ सह इनचार्ज'}
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm">
                {mode === 'edit' ? 'Edit Co-Incharge' : 'Create New Co-Incharge'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6" style={{backgroundColor:'#f4f6ff'}} noValidate>
          {/* Position/Designation */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
              पद
            </label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              required
              disabled={loadingDesignations}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
            >
              <option value="">
                {loadingDesignations ? 'लोड हो रहा है...' : 'पद चुनें'}
              </option>
              {designations.map((designation) => (
                <option key={designation.id} value={designation.label}>
                  {designation.label}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
              नाम
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
              placeholder="Enter name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
              मोबाइल नं.
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              maxLength={10}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
              placeholder="Enter mobile number"
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
                id="co-incharge-photo-input"
              />
              {photoPreview ? (
                <div className="relative">
                  <label
                    htmlFor="co-incharge-photo-input"
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
                  htmlFor="co-incharge-photo-input"
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
              type="button"
              onClick={onClose}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#0d2f7a')}
              onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#103a94')}
            >
              {loading 
                ? (mode === 'edit' ? 'अपडेट हो रहा है...' : 'सेव हो रहा है...') 
                : (mode === 'edit' ? 'अपडेट करें' : 'बुथ सह इनचार्ज बनाएं')}
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Remove Photo Confirmation Modal */}
    <RemovePhotoConfirmModal
      isOpen={showRemoveConfirm}
      onConfirm={handleRemovePhotoConfirm}
      onCancel={handleRemovePhotoCancel}
      zIndex={70}
    />
    </>
  )
}

export default AddCoInchargeModal

