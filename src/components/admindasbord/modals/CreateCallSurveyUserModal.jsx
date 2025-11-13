import React, { useEffect, useState, useMemo } from 'react'
import apiService, { displayAllBoothForSaktiAllocation } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import RemovePhotoConfirmModal from './RemovePhotoConfirmModal.jsx'
import DuplicateMobileModal from './DuplicateMobileModal.jsx'

const CreateCallSurveyUserModal = ({ isOpen, onClose, onSuccess, user, allUsers = [] }) => {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [boothNumbersText, setBoothNumbersText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBoothPicker, setShowBoothPicker] = useState(false)
  const [booths, setBooths] = useState([])
  const [loadingBooths, setLoadingBooths] = useState(false)
  const [selectedBooths, setSelectedBooths] = useState([])
  // Track selections made in the currently open picker session
  const [sessionSelected, setSessionSelected] = useState([])
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [existingPhotoName, setExistingPhotoName] = useState('')
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [photoBase64, setPhotoBase64] = useState('')
  const [boothError, setBoothError] = useState('')
  const [duplicateModal, setDuplicateModal] = useState({ isOpen: false, mobile: '', message: '' })

  // Determine if we're in edit mode
  const isEditMode = !!user

  // Get all booths assigned to other users (excluding current user in edit mode)
  const assignedBooths = useMemo(() => {
    const assignedSet = new Set()
    const currentUserId = user?.id || user?.adminId
    
    allUsers.forEach(u => {
      const userId = u.id || u.adminId
      // Skip current user's booths in edit mode
      if (isEditMode && userId === currentUserId) return
      
      if (u.boothNumbers) {
        u.boothNumbers.forEach(booth => {
          if (booth !== null && booth !== undefined) {
            assignedSet.add(Number(booth))
          }
        })
      }
    })
    
    return assignedSet
  }, [allUsers, user, isEditMode])

  const existingMobileNumbers = useMemo(() => {
    const numbers = allUsers
      .filter(u => !(isEditMode && (u.id === (user?.id) || u.adminId === (user?.adminId))))
      .map(u => u.phoneNumber || u.mobile || u.mobileNo || u.mobile_no || u.phone)
      .filter(Boolean)
      .map(num => num.toString().trim())
    return Array.from(new Set(numbers))
  }, [allUsers, isEditMode, user])

  // Initialize form with user data when modal opens or user changes (edit mode)
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '')
      setMobile(user.phoneNumber || user.mobile || '')
      // Convert booth numbers to numbers if they're strings
      const boothNumbers = user.boothNumbers || []
      const convertedBooths = boothNumbers.map(booth => typeof booth === 'string' ? parseInt(booth.trim(), 10) : booth).filter(booth => !isNaN(booth))
      setSelectedBooths(convertedBooths)
      const boothText = convertedBooths.length > 0 
        ? convertedBooths.join(',') + ',' 
        : ''
      setBoothNumbersText(boothText)
      setPhoto(null) // Reset photo, user can upload new one if needed
      // Load existing photo if available
      // Priority: photo_path > photoPath > profileImage > photo
      const existingPhoto = user.photo_path || user.photoPath || user.profileImage || user.photo
      
      // If photo exists and is not empty, use it
      if (existingPhoto && existingPhoto.trim() !== '') {
        let photoUrl = existingPhoto.trim()
        
        // If it's not a full URL and not starting with / or data:, try to construct proper URL
        if (!photoUrl.startsWith('http') && !photoUrl.startsWith('/') && !photoUrl.startsWith('data:')) {
          // If it contains image extensions, it's likely a filename/path
          if (photoUrl.includes('.jpg') || photoUrl.includes('.jpeg') || 
              photoUrl.includes('.png') || photoUrl.includes('.gif') ||
              photoUrl.includes('.JPG') || photoUrl.includes('.JPEG') ||
              photoUrl.includes('.PNG') || photoUrl.includes('.GIF')) {
            // Prepend / to make it a relative path
            photoUrl = '/' + photoUrl
          } else {
            // Even if no extension, if isPhoto flag is true, it might be a valid photo
            // Try with / prefix
            if (user.isPhoto) {
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
      const originalName = user.photo_path
        || user.photo
        || (user.photoPath ? user.photoPath.split('/').pop() : '')
        || (typeof user.profileImage === 'string' ? user.profileImage.split('/').pop() : '')
      setExistingPhotoName(originalName ? originalName.toString().trim() : '')
      setPhotoRemoved(false)
      setPhotoBase64('')
      setBoothError('')
    } else if (isOpen && !user) {
      // Reset form for create mode
      setName('')
      setMobile('')
      setBoothNumbersText('')
      setSelectedBooths([])
      setPhoto(null)
      setPhotoPreview(null)
      setExistingPhotoUrl(null)
      setExistingPhotoName('')
      setPhotoRemoved(false)
      setPhotoBase64('')
      setBoothError('')
    }
  }, [isOpen, user])

  // Cleanup photo preview URL when component unmounts or photo changes
  useEffect(() => {
    return () => {
      // Only revoke blob URLs (created from file uploads), not server URLs
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  useEffect(() => {
    const loadBooths = async () => {
      try {
        setLoadingBooths(true)
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
        const result = await displayAllBoothForSaktiAllocation('cl', panelApiUrl)
        const numbers = Array.isArray(result)
          ? result.map((b) => Number(b.booth_no || b.boothNo || b.number || b)).filter((n) => !isNaN(n))
          : []
        // Remove duplicates by converting to Set and back to array, then sort
        const uniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b)
        setBooths(uniqueNumbers.map((n, idx) => ({ id: `${idx}-${n}`, number: n })))
        // Only reset selections if not in edit mode
        if (!user) {
          setSelectedBooths([])
          setBoothNumbersText('')
        }
      } catch (e) {
        console.warn('Failed to fetch booths for CL:', e)
      } finally {
        setLoadingBooths(false)
      }
    }
    if (isOpen) loadBooths()
  }, [isOpen, user])

  if (!isOpen) return null
  if (isEditMode && !user) return null

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Remove non-digits
    if (value.length <= 10) {
      setMobile(value)
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

  const handleSubmit = async () => {
    // Reset errors
    setBoothError('')
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
    const sanitizedExistingMobiles = existingMobileNumbers
      .map(normalizeMobileNumber)
      .filter(Boolean)
    const originalMobile = isEditMode
      ? normalizeMobileNumber(
          user?.phoneNumber ||
          user?.mobile ||
          user?.mobileNo ||
          user?.mobile_no ||
          user?.phone
        )
      : ''

    const isDuplicateMobile = normalizedMobile &&
      sanitizedExistingMobiles.includes(normalizedMobile) &&
      !(isEditMode && normalizedMobile === originalMobile)

    if (isDuplicateMobile) {
      setDuplicateModal({
        isOpen: true,
        mobile: normalizedMobile,
        message: 'यह मोबाइल नंबर पहले से ही कॉल सेंटर यूज़र में उपयोग किया जा चुका है।'
      })
      return
    }

    // Validate booth selection
    if (!selectedBooths || selectedBooths.length === 0) {
      setBoothError('कृपया कम से कम एक बूथ चुनें')
      return
    }

    const boothCsv = selectedBooths.join(',')
    
    // Convert photo to base64 if present
    let photoBase64 = ''
    let photoName = ''
    
    // If photo was removed in edit mode, send empty strings
    if (photoRemoved && isEditMode) {
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
        alert('Failed to process photo. Please try again.')
        return
      }
    }
    // If in edit mode and no new photo uploaded and photo not removed, keep existing photo
    else if (isEditMode && !photoRemoved) {
      // Keep existing photo - don't send base64, server will keep existing
      photoName = existingPhotoName || user.photo || user.photo_path || ''
      photoBase64 = '' // Empty base64 means keep existing photo on server
    }

    try {
      setIsSubmitting(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      if (isEditMode) {
        // Update existing user
        await apiService.updateAdmin({
          admin_id: user.id || user.adminId,
          type: 'cl',
          sub_type: 'cl',
          name,
          mobile_no: mobile,
          photo: photoRemoved ? '' : (photoName || existingPhotoName || user.photo || user.photo_path || ''),
          base64: photoBase64,
          idcard_no: '',
          booth_javabdari: boothCsv || '0',
          page_javabdari: '',
          add: '',
          modify_by: '1'
        }, panelApiUrl)
      } else {
        // Create new user
        await apiService.insertAdmin({
          type: 'cl',
          sub_type: 'cl',
          main_admin_id: '0',
          name,
          mobile_no: mobile,
          photo: photoName,
          base64: photoBase64,
          idcard_no: '',
          booth_javabdari: boothCsv || '0',
          page_javabdari: '',
          add: ''
        }, panelApiUrl)
      }
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (e) {
      alert(e.message || (isEditMode ? 'Failed to update Call Survey User' : 'Failed to create Call Survey User'))
    } finally {
      setIsSubmitting(false)
    }
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
      setExistingPhotoName('')
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
    setExistingPhotoName('')
    setPhotoRemoved(true)
    // Reset file input
    const fileInput = document.getElementById(isEditMode ? "edit-callsurvey-photo-upload" : "callsurvey-photo-upload")
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

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xs sm:max-w-lg bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-2.5 sm:p-5 text-white" style={{backgroundColor: '#103a94'}}>
          <button
            onClick={onClose}
            className="absolute top-1.5 right-1.5 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
          >
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div>
              <h2 className="text-sm sm:text-xl font-bold">
                {isEditMode ? 'कॉल सेंटर सर्वे संपादित करें' : 'कॉल सेंटर सर्वे'}
              </h2>
              <p className="text-blue-100 text-[10px] sm:text-sm">
                {isEditMode ? 'Edit Call Survey User' : 'Create New Call Survey User'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-2.5 sm:p-5 space-y-2 sm:space-y-4" style={{backgroundColor:'#f4f6ff'}}>
          {/* Booth Responsibility Field */}
          <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
            <p className="text-[10px] sm:text-sm font-semibold mb-1 sm:mb-2" style={{color: '#103a94'}}>बूथ की जिम्मेदारी</p>
            <label className="block text-[10px] sm:text-sm font-semibold mb-1 sm:mb-2" style={{color: '#103a94'}}>बूथ नं.</label>
            <input
              type="text"
              readOnly
              value={selectedBooths.length > 0 ? selectedBooths.join(', ') : ''}
              className={`w-full px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border transition-all text-gray-800 text-xs sm:text-base cursor-not-allowed ${
                boothError ? 'border-red-500' : ''
              }`}
              style={{
                backgroundColor: '#f3f4f6', 
                borderColor: boothError ? '#ef4444' : '#d1d5db', 
                color: '#6b7280'
              }}
              placeholder="बूथ चुनें बटन से बूथ सेलेक्ट करें"
            />
            {boothError && (
              <p className="mt-1 text-[10px] sm:text-xs text-red-600">{boothError}</p>
            )}
            <button 
              onClick={async () => {
                setShowBoothPicker(true)
                setBoothError('') // Clear error when opening booth picker
                setSessionSelected([])
                try {
                  setLoadingBooths(true)
                  const userData = localStorageManager.getUserData()
                  const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
                  const result = await displayAllBoothForSaktiAllocation('cl', panelApiUrl)
                  const numbers = Array.isArray(result)
                    ? result.map((b) => Number(b.booth_no || b.boothNo || b.number || b)).filter((n) => !isNaN(n))
                    : []
                  // Remove duplicates by converting to Set and back to array, then sort
                  const uniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b)
                  setBooths(uniqueNumbers.map((n, idx) => ({ id: `${idx}-${n}`, number: n })))
                } finally {
                  setLoadingBooths(false)
                }
              }} 
              className="mt-1 sm:mt-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg text-white font-semibold transition-all shadow-sm hover:shadow-md text-[10px] sm:text-sm"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
            >
              बूथ चुनें
            </button>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-[10px] sm:text-sm font-semibold mb-1 sm:mb-2" style={{color: '#103a94'}}>
              नाम
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-xs sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
              placeholder="Enter name"
            />
          </div>

          {/* Mobile Field */}
          <div>
            <label className="block text-[10px] sm:text-sm font-semibold mb-1 sm:mb-2" style={{color: '#103a94'}}>
              मोबाइल नं.
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={handleMobileChange}
              maxLength={10}
              className="w-full px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-xs sm:text-base"
              style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
              onFocus={(e) => e.target.style.borderColor = '#103a94'}
              onBlur={(e) => e.target.style.borderColor = '#103a94'}
              placeholder="Enter mobile number"
            />
          </div>

          {/* Photo Field */}
          <div>
            <label className="block text-[10px] sm:text-sm font-semibold mb-1 sm:mb-2" style={{color: '#103a94'}}>
              फोटो
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id={isEditMode ? "edit-callsurvey-photo-upload" : "callsurvey-photo-upload"}
              />
              {photoPreview ? (
                <div className="relative">
                  <label
                    htmlFor={isEditMode ? "edit-callsurvey-photo-upload" : "callsurvey-photo-upload"}
                    className="block w-full h-20 sm:h-32 rounded-lg border overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer transition-all hover:bg-gray-100"
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
                    className="mt-1 text-red-600 text-[10px] sm:text-sm hover:text-red-700 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Remove Photo</span>
                  </button>
                </div>
              ) : (
                <label
                  htmlFor={isEditMode ? "edit-callsurvey-photo-upload" : "callsurvey-photo-upload"}
                  className="w-full h-16 sm:h-28 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all"
                  style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e6f0ff'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f4ff'}
                >
                  <div className="text-center">
                    <svg className="w-4 h-4 sm:w-7 sm:h-7 mx-auto mb-0.5 sm:mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#103a94'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-[10px] sm:text-sm" style={{color: '#103a94'}}>Click to upload photo</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-1.5 sm:space-y-0 sm:space-x-3 pt-1.5 sm:pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-1.5 sm:py-3 px-2.5 sm:px-4 rounded-lg sm:rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-xs sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 text-white font-semibold py-1.5 sm:py-3 px-2.5 sm:px-4 rounded-lg sm:rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-xs sm:text-base disabled:opacity-60"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#0d2f7a')}
              onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = '#103a94')}
            >
              {isEditMode ? 'अपडेट करें' : 'कॉल सेन्टर यूज़र बनाए'}
            </button>
          </div>
        </div>
      </div>
    </div>

    {showBoothPicker && (
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-1 sm:p-4">
        <div className="w-full max-w-xs sm:max-w-md bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-2.5 sm:p-6 text-white flex items-center justify-between" style={{backgroundColor: '#103a94'}}>
            <button 
              onClick={() => setShowBoothPicker(false)} 
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
            >
              <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h3 className="text-sm sm:text-xl font-bold">बूथ</h3>
            <div className="w-7 sm:w-8" />
          </div>
          <div className="p-2 sm:p-3 max-h-[60vh] overflow-auto grid grid-cols-4 gap-2 sm:gap-3">
              {(loadingBooths ? Array.from({ length: 8 }, (_, i) => ({ id: `s-${i}`, number: null })) : booths).map(item => {
                const num = item.number
                const isSelected = num !== null && selectedBooths.includes(num)
                const isAssignedToOtherUser = num !== null && assignedBooths.has(num)
                // Only disable if assigned to other user (allow unselecting selected booths)
                const isDisabled = isAssignedToOtherUser
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (num === null || isAssignedToOtherUser) return
                      // Toggle selection - if already selected, remove it; otherwise add it
                      setSelectedBooths(prev => {
                        if (prev.includes(num)) {
                          // Unselect the booth
                          const newBooths = prev.filter(n => n !== num).sort((a,b)=>a-b)
                          setBoothNumbersText(newBooths.join(',') + (newBooths.length ? ',' : ''))
                          // Clear error if booths are selected, set error if no booths left
                          if (newBooths.length === 0) {
                            setBoothError('कृपया कम से कम एक बूथ चुनें')
                          } else {
                            setBoothError('')
                          }
                          setSessionSelected(prev => prev.filter(b => b !== num))
                          return newBooths
                        } else {
                          // Select the booth - no limit
                          const newBooths = [...prev, num].sort((a,b)=>a-b)
                          setBoothNumbersText(newBooths.join(',') + (newBooths.length ? ',' : ''))
                          // Clear error when at least one booth is selected
                          setBoothError('')
                          setSessionSelected(prev => prev.includes(num) ? prev : [...prev, num])
                          return newBooths
                        }
                      })
                    }}
                    disabled={isDisabled}
                    className={`rounded-lg sm:rounded-xl border py-2 sm:py-4 text-xs sm:text-sm font-semibold transition-all ${num===null ? 'animate-pulse opacity-60' : ''} ${isSelected ? 'hover:opacity-80' : ''}`}
                    style={
                      isSelected
                        ? { backgroundColor: '#103a94', color: '#ffffff', borderColor: '#103a94', cursor: 'pointer' }
                        : isAssignedToOtherUser
                        ? { backgroundColor: '#d1d5db', color: '#111827', borderColor: '#d1d5db', cursor: 'not-allowed' }
                        : { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#e5e7eb', cursor: 'pointer' }
                    }
                  >
                    {num===null ? '…' : num}
                  </button>
                ) 
              })}
            </div>
          <div className="p-2 sm:p-4" style={{backgroundColor: '#103a94'}}>
            <button 
              onClick={() => setShowBoothPicker(false)} 
              className="w-full py-2 sm:py-3 rounded-lg text-white font-semibold transition-all shadow-sm hover:shadow-md text-xs sm:text-base"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
            >
              बूथ चुनें
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

export default CreateCallSurveyUserModal


