import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage'

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
        phone: editData.phone || '',
        address: '',
        email: '',
        photo: null,
        designation: editData.role || editData.designation || ''
      })
      setExistingPhotoUrl(editData.profileImage || null)
    } else {
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
    }
  }, [editData, mode, isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }))
    }
  }

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      photo: null
    }))
  }

  const handlePhotoButtonClick = () => {
    document.getElementById('co-incharge-photo-input').click()
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
    if (!formData.designation.trim()) {
      alert('कृपया पद दर्ज करें')
      return
    }
    
    setLoading(true)
    try {
      // Convert photo to base64 if present
      let photoBase64 = ''
      let photoName = ''
      if (formData.photo) {
        photoBase64 = await convertFileToBase64(formData.photo)
        photoName = formData.photo.name
      }

      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl

      if (mode === 'edit' && editData) {
        // Update mode - use updateAdmin API
        const updatePayload = {
          admin_id: editData.id,
          type: 'BP',
          sub_type: 'BS',
          name: formData.name.trim(),
          mobile_no: formData.phone.trim(),
          photo: photoName || '',
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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-t-lg" style={{backgroundColor: '#103a94'}}>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white">
            {mode === 'edit' ? 'बुथ सह इनचार्ज संपादित करें' : 'बुथ सह इनचार्ज'}
          </h2>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Position/Designation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              पद
            </label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleInputChange}
              required
              disabled={loadingDesignations}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              नाम
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              मोबाइल नं.
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter mobile number"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              फोटो
            </label>
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
              ) : existingPhotoUrl ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <img
                      src={existingPhotoUrl}
                      alt="Current"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 font-medium mb-2">वर्तमान फोटो</p>
                    <button
                      type="button"
                      onClick={handlePhotoButtonClick}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      बदलें
                    </button>
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
                id="co-incharge-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{backgroundColor: '#103a94'}}
            >
              {loading ? 'सेव हो रहा है...' : (mode === 'edit' ? 'अपडेट करें' : 'बुथ सह इनचार्ज बनाएं')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCoInchargeModal
