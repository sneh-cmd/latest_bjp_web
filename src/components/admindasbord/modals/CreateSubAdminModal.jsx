import React, { useState, useEffect } from 'react'

const CreateSubAdminModal = ({ isOpen, onClose, onSubmit, editData = null, mode = 'create' }) => {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [photo, setPhoto] = useState(null)

  // Update form when editData changes
  useEffect(() => {
    if (editData && mode === 'edit') {
      setName(editData.name || '')
      setMobile(editData.phoneNumber || editData.mobile || '')
      setPhoto(null) // Reset photo, user can upload new one if needed
    } else {
      // Reset form for create mode
      setName('')
      setMobile('')
      setPhoto(null)
    }
  }, [editData, mode, isOpen])

  if (!isOpen) return null

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setPhoto(file)
    }
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    // Convert photo to base64 if present
    let photoBase64 = ''
    let photoName = ''
    if (photo) {
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

    const payload = { 
      name, 
      mobile, 
      photo: photoName,
      base64: photoBase64,
      ...(mode === 'create' ? { booth_javabdari: '0' } : {}),
      ...(mode === 'edit' && editData ? { adminId: editData.adminId, id: editData.id, admin_id: editData.adminId } : {})
    }
    if (onSubmit) onSubmit(payload)
  }

  return (
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-sm">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                {mode === 'edit' ? 'सब ऐडमिन संपादित करें' : 'नया सब ऐडमिन'}
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm">
                {mode === 'edit' ? 'Edit Sub-Admin' : 'Create New Sub-Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
              नाम
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sub-admin name"
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
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter mobile number"
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
                id="subadmin-photo-upload"
              />
              <label
                htmlFor="subadmin-photo-upload"
                className="w-full h-24 sm:h-32 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all"
                style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e6f0ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f4ff'}
              >
                {photo ? (
                  <div className="text-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-xs sm:text-sm text-gray-600">Photo Selected</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#103a94'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-xs sm:text-sm" style={{color: '#103a94'}}>Click to upload photo</p>
                  </div>
                )}
              </label>
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
              onClick={handleSubmit}
              className="flex-1 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base"
              style={{backgroundColor: '#103a94'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
            >
              {mode === 'edit' ? 'अपडेट करें' : 'सब ऐडमिन बनाएं'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateSubAdminModal


