import React, { useState, useEffect } from 'react'
import { apiService } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const AddBuildingCoInchargeModal = ({ isOpen, onClose, onSave, buildingId }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    photo: null
  })
  const [loading, setLoading] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        phone: '',
        photo: null
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }))
    }
  }

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }))
  }

  const handlePhotoButtonClick = () => {
    document.getElementById('building-coincharge-photo-input').click()
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
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('कृपया नाम दर्ज करें')
      return
    }
    if (!formData.phone.trim()) {
      alert('कृपया मोबाइल नंबर दर्ज करें')
      return
    }
    
    setLoading(true)
    try {
      // Convert photo to base64 if present
      let photoBase64 = ''
      let photoName = ''
      if (formData.photo) {
        photoBase64 = await convertFileToBase64(formData.photo)
        // Remove data URL prefix if present (data:image/...;base64,)
        photoBase64 = photoBase64.replace(/^data:image\/[a-z]+;base64,/, '')
        photoName = formData.photo.name
      }

      // Prepare data for API - Building Co Incharge
      // Same structure as Building Pramukh but with sub_type='AS' and empty add
      // main_admin_id should be the building ID to link co-incharge to the building
      // Convert buildingId to string and validate it's a real ID (not 0, '0', 1, or '1')
      let buildingMainAdminId = '0'
      
      if (buildingId) {
        const idStr = String(buildingId).trim()
        // Only use if it's a valid number and not 0, 1, or their string equivalents
        if (idStr && idStr !== '0' && idStr !== '1' && idStr !== 'undefined' && idStr !== 'null') {
          buildingMainAdminId = idStr
        }
      }
      
      // Warn if we're about to save with invalid ID
      if (buildingMainAdminId === '0') {
        console.warn('⚠️ WARNING: Building ID is invalid or not provided!', {
          buildingId,
          type: typeof buildingId,
          buildingMainAdminId
        })
        const userConfirm = confirm('⚠️ Building ID नहीं मिला!\n\nCo-incharge बिल्डिंग से link नहीं होगा.\n\nफिर भी save करें?')
        if (!userConfirm) {
          setLoading(false)
          return // User cancelled
        }
      }
      
      // Get or fallback to default API URL
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      // Get login ID (admin ID) from user data for create_by field
      const loginId = userData?.admin?.adminId || userData?.admin?.id || '1'
      
      console.log('🔍 Debug Info:', {
        userData: userData,
        admin: userData?.admin,
        loginId: loginId,
        buildingId: buildingId,
        buildingMainAdminId: buildingMainAdminId
      })
      
      const adminData = {
        type: 'AP', // Building Pramukh type (NOT BP - that's for Booth Head)
        sub_type: 'AS', // Building Co Incharge sub_type (NOT BS - that's for Booth Co-incharge)
        main_admin_id: buildingMainAdminId, // Link to building
        name: formData.name.trim(),
        mobile_no: formData.phone.trim(),
        photo: photoName || '',
        base64: photoBase64 || '',
        idcard_no: '0',
        booth_javabdari: '0',
        page_javabdari: '0',
        add: '', // Empty address for building co-incharge
        create_by: loginId // Use login ID instead of hardcoded '1'
      }
      
      console.log('🏗️ Building Co-incharge submission:', {
        '📥 Received buildingId prop': buildingId,
        '🔗 Using main_admin_id': buildingMainAdminId,
        '📋 Full adminData': adminData
      })

      console.log('✅ Submitting building co-incharge data:', adminData)

      // Call the insert_admin API
      const response = await apiService.insertAdmin(adminData, panelApiUrl)
      
      // Check for successful response
      if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
        // Success - call the provided onSave callback with the building ID used
        onSave && onSave({ 
          ...formData, 
          buildingId: buildingId || buildingMainAdminId, 
          main_admin_id: buildingMainAdminId,
          apiResponse: response 
        })
        
        // Reset form
        setFormData({ name: '', phone: '', photo: null })
        onClose && onClose()
      } else {
        console.error('Insert building co-incharge unexpected response:', response)
        throw new Error('Failed to save building co-incharge')
      }
    } catch (error) {
      console.error('Error saving building co-incharge:', error)
      alert('बिल्डिंग सह इनचार्ज सेव करने में विफल. कृपया पुन: प्रयास करें.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-80 p-4" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    }}>
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#103a94' }}>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white">बिल्डिंग सह इनचार्ज</h2>
          <div className="w-6" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">नाम</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="नाम दर्ज करें"
              required
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">मोबाइल नं.</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="मोबाइल नंबर"
              required
            />
          </div>

          {/* Photo */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-800">फोटो</label>
            <div className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4">
              {formData.photo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(formData.photo)}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium mb-2">{formData.photo.name}</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={handlePhotoButtonClick}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        बदलें
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        हटाएं
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <p className="text-sm text-gray-500 mb-3">फोटो अपलोड करने के लिए बटन पर क्लिक करें</p>
                  <button
                    type="button"
                    onClick={handlePhotoButtonClick}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    फोटो चुनें
                  </button>
                </div>
              )}
              <input
                id="building-coincharge-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Save */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-3 text-white disabled:opacity-50"
              style={{ backgroundColor: '#103a94' }}
            >
              {loading ? 'सेव हो रहा है...' : 'सेव करें'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBuildingCoInchargeModal

