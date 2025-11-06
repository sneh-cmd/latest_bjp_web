import React, { useState, useEffect } from 'react'
import apiService, { displayAllBoothForSaktiAllocation } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import RemovePhotoConfirmModal from './RemovePhotoConfirmModal.jsx'

const CreateShaktiKendraPramukhModal = ({ isOpen, onClose, onSuccess, editData = null, mode = 'create', alreadyAssignedBooths = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBooths, setSelectedBooths] = useState([])
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showBoothPicker, setShowBoothPicker] = useState(false)
  const [booths, setBooths] = useState([])
  const [loadingBooths, setLoadingBooths] = useState(false)

  // Update form when editData changes
  useEffect(() => {
    if (editData && mode === 'edit') {
      setName(editData.name || '')
      setMobile(editData.phoneNumber || editData.mobile || '')
      // Convert booth numbers to numbers if they're strings
      const boothNumbers = editData.boothNumbers || []
      setSelectedBooths(boothNumbers.map(booth => typeof booth === 'string' ? parseInt(booth.trim(), 10) : booth).filter(booth => !isNaN(booth)))
      setPhoto(null) // Reset photo, user can upload new one if needed
      // Load existing photo if available
      // Priority: photoPath > profileImage > photo (same as list view)
      const existingPhoto = editData.photoPath || editData.profileImage || editData.photo
      
      console.log('Edit mode - Photo data:', {
        photoPath: editData.photoPath,
        profileImage: editData.profileImage,
        photo: editData.photo,
        isPhoto: editData.isPhoto,
        existingPhoto: existingPhoto
      })
      
      // If photo exists and is not empty, use it
      // Don't be too strict with validation - let the browser handle invalid URLs
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
            if (editData.isPhoto) {
              photoUrl = '/' + photoUrl
            }
          }
        }
        
        console.log('Setting photo preview URL:', photoUrl)
        setExistingPhotoUrl(photoUrl)
        setPhotoPreview(photoUrl)
      } else {
        console.log('No photo found or photo is empty')
        setExistingPhotoUrl(null)
        setPhotoPreview(null)
      }
      setPhotoRemoved(false)
    } else {
      // Reset form for create mode
      setName('')
      setMobile('')
      setSelectedBooths([])
      setPhoto(null)
      setPhotoPreview(null)
      setExistingPhotoUrl(null)
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

  if (!isOpen) return null

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
    const fileInput = document.getElementById('shakti-pramukh-photo-upload')
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

  const handleSubmit = async () => {
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

    const booth_javabdari = selectedBooths.join(',')
    
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
        alert('Failed to process photo. Please try again.')
        return
      }
    }
    // If in edit mode and no new photo uploaded and photo not removed, keep existing photo
    else if (mode === 'edit' && existingPhotoUrl && !photoRemoved) {
      // Keep existing photo - don't send base64, server will keep existing
      photoName = editData.photo || ''
      photoBase64 = '' // Empty base64 means keep existing photo on server
    }

    try {
      setIsSubmitting(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      if (mode === 'edit' && editData) {
        // Update existing pramukh
        await apiService.updateAdmin({
          admin_id: editData.id || editData.adminId,
          type: 'SP',
          sub_type: 'SP',
          name: name,
          mobile_no: mobile,
          photo: photoRemoved ? '' : (photoName || editData.photo || ''),
          base64: photoBase64,
          idcard_no: '',
          booth_javabdari: booth_javabdari || '0',
          page_javabdari: '',
          add: '',
          modify_by: '1'
        }, panelApiUrl)
      } else {
        // Create new pramukh
        await apiService.insertAdmin({
          type: 'SP',
          sub_type: 'SP',
          main_admin_id: '0',
          name: name,
          mobile_no: mobile,
          photo: photoName,
          base64: photoBase64,
          idcard_no: '',
          booth_javabdari: booth_javabdari || '0',
          page_javabdari: '',
          add: ''
        }, panelApiUrl)
      }
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (e) {
      alert(e.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} Shakti Kendra Pramukh`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-800 p-4 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <h2 className="text-lg font-bold">
            {mode === 'edit' ? 'शक्ति केन्द्र प्रमुख संपादित करें' : 'शक्ति केन्द्र प्रमुख'}
          </h2>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm font-semibold mb-2">बूथ की जिम्मेदारी</p>
            <label className="block text-sm mb-1">बूथ नं.</label>
            <input
              type="text"
              value={(selectedBooths.map(n => `${n},`).join(' ')).trim()}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\s/g, '')
                const parts = cleaned.split(',').filter(Boolean)
                const nums = []
                parts.forEach(p => {
                  const n = parseInt(p, 10)
                  if (!isNaN(n)) nums.push(n)
                })
                setSelectedBooths(Array.from(new Set(nums)))
              }}
              className="w-full px-3 py-2 rounded-md border bg-white"
              placeholder="बूथ नं."
            />
          <button onClick={async () => {
            setShowBoothPicker(true)
            try {
              setLoadingBooths(true)
              const userData = localStorageManager.getUserData()
              const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
              const result = await displayAllBoothForSaktiAllocation('SP', panelApiUrl)
              const raw = Array.isArray(result) ? result.map((b, idx) => {
                const n = Number(b.booth_no || b.boothNo || b.number || b)
                return { id: `${idx}-${n}`, number: n }
              }).filter(x => !isNaN(x.number)) : []
              // compute duplicates by frequency and mark them
              const freq = raw.reduce((m, it) => { const k = it.number; m[k] = (m[k]||0)+1; return m }, {})
              const mapped = raw.map(it => ({ ...it, isDuplicate: (freq[it.number]||0) > 1 }))
              setBooths(mapped)
            } finally {
              setLoadingBooths(false)
            }
          }} className="mt-2 px-3 py-2 rounded-md text-white" style={{backgroundColor:'#103a94'}}>
            बूथ चुनें
          </button>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">नाम</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-white"
              placeholder="नाम"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">मोबाइल नं.</label>
            <input
              type="tel"
              value={mobile}
              onChange={handleMobileChange}
              maxLength={10}
              className="w-full px-3 py-2 rounded-md border bg-white"
              placeholder="मोबाइल नं."
            />
          </div>

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
                id="shakti-pramukh-photo-upload"
              />
              {photoPreview ? (
                <div className="relative">
                  <label
                    htmlFor="shakti-pramukh-photo-upload"
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
                  htmlFor="shakti-pramukh-photo-upload"
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

          <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-60" style={{backgroundColor:'#0a67c2'}}>
            {mode === 'edit' ? 'शक्ति केन्द्र प्रमुख अपडेट करें' : 'शक्ति केन्द्र प्रमुख बनाए'}
          </button>
        </div>
      </div>
    </div>
    {showBoothPicker && (
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
        <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-blue-800 text-white flex items-center justify-between px-4 py-3">
            <button onClick={() => setShowBoothPicker(false)} className="w-8 h-8 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <h3 className="font-bold">बूथ</h3>
            <div className="w-8" />
          </div>
          <div className="p-3 max-h-[60vh] overflow-auto grid grid-cols-4 gap-3">
            {(loadingBooths ? Array.from({ length: 8 }, (_, i) => ({ id: `s-${i}`, number: null, isDuplicate: false })) : booths).map(item => {
              const num = item.number
              const isSelected = num !== null && selectedBooths.includes(num)
              const isDuplicate = !!item.isDuplicate
              const isAlreadyAssigned = num !== null && alreadyAssignedBooths.includes(num)
              const isDisabled = isSelected || isDuplicate || isAlreadyAssigned || num === null
              return (
              <button
                key={item.id}
                disabled={isDisabled}
                onClick={() => {
                  if (num === null || isDuplicate || isSelected || isAlreadyAssigned) return
                  setSelectedBooths(prev => {
                    if (prev.includes(num)) {
                      return prev.filter(n => n !== num)
                    }
                      return [...prev, num].sort((a,b)=>a-b)
                  })
                }}
                className={`rounded-xl border py-4 text-sm font-semibold ${num===null ? 'animate-pulse opacity-60' : ''}`}
                style={
                  isSelected
                    ? { backgroundColor: '#103a94', color: '#ffffff', borderColor: '#103a94', cursor: 'not-allowed' }
                    : isDuplicate || isAlreadyAssigned
                      ? { backgroundColor: '#d1d5db', color: '#111827', borderColor: '#d1d5db', cursor: 'not-allowed' }
                      : { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#e5e7eb' }
                }
              >
                {num===null ? '…' : num}
              </button>
              )
            })}
          </div>
          <div className="bg-blue-800 p-3">
            <button onClick={() => setShowBoothPicker(false)} className="w-full py-3 rounded-lg text-white font-semibold">
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
    </>
  )
}

export default CreateShaktiKendraPramukhModal


