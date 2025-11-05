import React, { useState } from 'react'
import apiService from '../../../apidata.jsx'

const CreateKaryakartaModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) setPhoto(file)
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

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Name is required')
      return
    }
    if (!mobile.trim()) {
      alert('Mobile number is required')
      return
    }
    // Validate mobile number
    if (!validateMobile(mobile)) {
      alert('Invalid mobile number')
      return
    }

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
      type: 'K',  // Changed from 'V' to 'K' to match API format
      sub_type: 'K',  // Changed from 'V' to 'K' to match API format
      name: name.trim(),
      mobile_no: mobile.trim(),
      photo: photoName || '',
      base64: photoBase64 || '',
      main_admin_id: '0',
      booth_javabdari: '0',
      page_javabdari: '0',  // Use '0' instead of empty string to match API format
      add: '',
      idcard_no: '0',  // Use '0' instead of empty string to match API format
      create_by: '1'
    }

    try {
      setLoading(true)
      
      // Use the specified API endpoint
      const apiEndpoint = 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      console.log('Creating karyakarta with payload:', payload)
      console.log('Using API endpoint:', apiEndpoint)
      
      // Call the insertAdmin API
      const response = await apiService.insertAdmin(payload, apiEndpoint)
      
      console.log('=== API Response Details ===')
      console.log('API Response received:', response)
      console.log('Response type:', typeof response)
      console.log('Response is array:', Array.isArray(response))
      console.log('Response stringified:', JSON.stringify(response, null, 2))
      
      // Check if response indicates success
      // The insertAdmin function returns { success: true, message: '...' } when Success="2"
      // Or it might return the result array directly
      let isSuccess = false
      let errorMessage = null
      
      if (response) {
        // Check for success object format (from parseSoapResponse when Success="2")
        if (typeof response === 'object' && response.success === true) {
          isSuccess = true
          console.log('Success detected: response.success === true')
        }
        // Check if it's an array (which might indicate success with data)
        else if (Array.isArray(response)) {
          // Array response could be success, but check for error indicators
          const firstItem = response[0]
          if (firstItem && firstItem.Column1 && firstItem.Column1.toLowerCase() === 'ok') {
            isSuccess = true
            console.log('Success detected: Array with Column1="ok"')
          } else if (firstItem && (firstItem.error || firstItem.Error)) {
            errorMessage = firstItem.error || firstItem.Error
            console.log('Error detected in array response:', errorMessage)
          } else if (response.length > 0) {
            // Non-empty array might be success
            isSuccess = true
            console.log('Success assumed: Non-empty array response')
          } else {
            // Empty array - might be success or failure, check message
            console.warn('Empty array response - checking for success indicators')
            isSuccess = true  // Assume success for empty array
          }
        }
        // Check for other success indicators
        else if (typeof response === 'object') {
          // Check for Success="2" format
          if (response.Success === "2") {
            isSuccess = true
            console.log('Success detected: response.Success === "2"')
          }
          // Check for error indicators
          else if (response.error || response.Error || (response.message && response.message.toLowerCase().includes('error'))) {
            errorMessage = response.error || response.Error || response.message
            console.log('Error detected in response:', errorMessage)
          }
          // Check for success message
          else if (response.message && (response.message.toLowerCase().includes('success') || response.message.toLowerCase().includes('created'))) {
            isSuccess = true
            console.log('Success detected: Positive message in response')
          }
          // If response object exists but no clear indicators, log warning
          else {
            console.warn('Response object exists but no clear success/error indicators:', response)
            // Don't assume success - require explicit success indicator
            errorMessage = 'Response received but success status unclear'
          }
        }
      } else {
        console.error('No response received from API')
        errorMessage = 'No response received from API'
      }
      
      if (!isSuccess) {
        const msg = errorMessage || 'Unknown error occurred - API response did not indicate success'
        console.error('API call did not succeed. Full response:', response)
        throw new Error(msg)
      }
      
      console.log('✅ Karyakarta created successfully!')
      
      // Show success message
      alert('कार्यकर्ता सफलतापूर्वक बनाया गया')
      
      // Clear form
      setName('')
      setMobile('')
      setPhoto(null)
      
      // Call onSubmit callback if provided (for parent component to refresh list)
      if (onSubmit) {
        onSubmit(payload)
      }
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('Error creating karyakarta:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      alert(`त्रुटि: ${error.message || 'कार्यकर्ता बनाने में असफल'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-800 px-4 py-4 text-white flex items-center justify-between rounded-t-2xl">
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h2 className="text-lg font-bold">कार्यकर्ता बनाएं</h2>
          <div className="w-8" />
        </div>

        {/* Form */}
        <div className="p-4 space-y-4" style={{backgroundColor:'#eef1ff'}}>
          {/* Name Field */}
          <div>
            <label className="block text-sm font-semibold mb-2">नाम</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full px-3 py-3 rounded-lg border bg-white focus:outline-none focus:border-blue-500 transition-colors" 
              placeholder="नाम दर्ज करें"
            />
          </div>

          {/* Mobile Field */}
          <div>
            <label className="block text-sm font-semibold mb-2">मोबाइल नं.</label>
            <input 
              type="tel" 
              value={mobile} 
              onChange={handleMobileChange}
              maxLength={10}
              className="w-full px-3 py-3 rounded-lg border bg-white focus:outline-none focus:border-blue-500 transition-colors" 
              placeholder="मोबाइल नंबर दर्ज करें"
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
                id="karyakarta-photo-upload"
              />
              <label
                htmlFor="karyakarta-photo-upload"
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

          {/* Save Button */}
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" 
            style={{backgroundColor:'#0a67c2'}}
          >
            {loading ? 'सेव हो रहा है...' : 'सेव करें'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateKaryakartaModal

