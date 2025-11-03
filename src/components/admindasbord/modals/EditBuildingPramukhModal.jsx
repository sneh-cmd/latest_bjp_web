import React, { useState, useEffect } from 'react'
import { apiService } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const EditBuildingPramukhModal = ({ isOpen, onClose, onSuccess, building }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    photo: null
  })
  
  const [selectedAddresses, setSelectedAddresses] = useState([])
  const [showAddressPicker, setShowAddressPicker] = useState(false)
  const [addressSearch, setAddressSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [addressOptions, setAddressOptions] = useState([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressError, setAddressError] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoBase64, setPhotoBase64] = useState('')

  // Initialize form with building data when modal opens
  useEffect(() => {
    if (isOpen && building) {
      setFormData({
        name: building.name || '',
        phone: building.phoneNumber || building.mobileNo || '',
        photo: null
      })
      // Set addresses from building.addresses array
      setSelectedAddresses(building.addresses || [])
      // Set photo preview if available
      if (building.profileImage || building.photoPath) {
        setPhotoPreview(building.profileImage || building.photoPath)
      } else {
        setPhotoPreview('')
      }
      setPhotoBase64('')
    }
  }, [isOpen, building])

  // Fetch addresses from API when modal opens
  useEffect(() => {
    if (isOpen && addressOptions.length === 0 && !addressLoading) {
      fetchAddresses()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAddressPicker && !e.target.closest('.address-picker-container')) {
        setShowAddressPicker(false)
      }
    }
    if (showAddressPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddressPicker])

  const fetchAddresses = async () => {
    setAddressLoading(true)
    setAddressError(null)
    try {
      const endpoint = import.meta.env.DEV 
        ? '/panel-api/webservice.asmx' 
        : 'http://ntmc2.mhbjplok.com/webservice.asmx'
      const soapBody = '<dis_all_address xmlns="http://tempuri.org/" />'
      
      const response = await apiService.makeRequest(
        endpoint,
        'POST',
        'dis_all_address',
        soapBody,
        true
      )

      if (response && Array.isArray(response)) {
        const addresses = response
          .map(item => item.eng_localityid)
          .filter(addr => addr && addr.trim())
        setAddressOptions(addresses)
      } else if (response && response.result && Array.isArray(response.result)) {
        const addresses = response.result
          .map(item => item.eng_localityid)
          .filter(addr => addr && addr.trim())
        setAddressOptions(addresses)
      } else {
        throw new Error('Invalid response format from API')
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setAddressError('पते लोड करने में त्रुटि: ' + error.message)
      setAddressOptions([])
    } finally {
      setAddressLoading(false)
    }
  }

  if (!isOpen || !building) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }))
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        setPhotoPreview(typeof result === 'string' ? result : '')
        const base64 = typeof result === 'string' ? result.split(',')[1] || '' : ''
        setPhotoBase64(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }))
    setPhotoPreview('')
    setPhotoBase64('')
  }

  const handlePhotoButtonClick = () => {
    document.getElementById('edit-building-photo-input').click()
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
    if (selectedAddresses.length === 0) {
      alert('कृपया कम से कम एक पता चुनें')
      return
    }
    
    setLoading(true)
    try {
      // Prepare address string - join with % and end with %
      const addressString = selectedAddresses.join('%') + '%'
      
      // Get panel API URL
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      // Get login ID for modify_by field
      const loginId = userData?.admin?.adminId || userData?.admin?.id || '1'
      
      // Prepare photo data
      let photoName = ''
      let photoBase64Data = photoBase64
      
      // If new photo is selected, use it
      if (formData.photo) {
        // photoBase64 should already be set from handlePhotoChange
        photoBase64Data = photoBase64 || ''
        photoName = formData.photo.name || ''
      } else if (photoPreview && !photoBase64) {
        // If using existing photo, keep the existing photo path
        photoName = building.photoPath || building.profileImage || ''
        photoBase64Data = ''
      }
      
      // Prepare update data for update_admin API
      const updateData = {
        admin_id: building.id || building.adminId,
        type: 'AP',
        sub_type: 'AP',
        name: formData.name.trim(),
        mobile_no: formData.phone.trim(),
        photo: photoName || '',
        base64: photoBase64Data || '',
        idcard_no: '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: addressString,
        modify_by: loginId
      }

      console.log('📤 Updating building pramukh data:', updateData)

      // Call the update_admin API
      const response = await apiService.updateAdmin(updateData, panelApiUrl)
      
      // Check for successful response
      if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
        // Success
        if (onSuccess) onSuccess()
        onClose()
      } else {
        console.error('Update building pramukh unexpected response:', response)
        throw new Error('Failed to update building pramukh')
      }
    } catch (error) {
      console.error('Error updating building pramukh:', error)
      alert('बिल्डिंग प्रमुख अपडेट करने में विफल. कृपया पुन: प्रयास करें.')
    } finally {
      setLoading(false)
    }
  }

  const toggleAddress = (addr) => {
    setSelectedAddresses(prev => {
      if (prev.includes(addr)) return prev.filter(a => a !== addr)
      return [...prev, addr]
    })
  }

  const removeAddress = (addr) => {
    setSelectedAddresses(prev => prev.filter(a => a !== addr))
  }

  const filteredAddresses = addressOptions.filter(a => {
    if (a == null) return false
    const addressStr = String(a)
    return addressStr.toLowerCase().includes(addressSearch.toLowerCase())
  })

  return (
    <>
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
          <h2 className="text-lg font-semibold text-white">बिल्डिंग प्रमुख संपादित करें</h2>
          <div className="w-6" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Address Multi-select trigger */}
          <div className="relative address-picker-container">
            <label className="mb-1 block text-sm font-semibold text-gray-800">पता</label>
            <button
              type="button"
              onClick={() => setShowAddressPicker(!showAddressPicker)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left"
            >
              <span className="text-gray-800">
                {selectedAddresses.length > 0 ? `${selectedAddresses.length} पता` : 'चुनें'}
              </span>
              <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {showAddressPicker && (
              <div className="absolute left-0 right-0 z-[200] mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="p-2 border-b">
                  <input
                    type="text"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    placeholder="सर्च दर्ज करें"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    disabled={addressLoading}
                  />
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {addressLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-600">पते लोड हो रहे हैं...</div>
                    </div>
                  ) : addressError ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-red-600">{addressError}</div>
                    </div>
                  ) : filteredAddresses.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-600">कोई पता नहीं मिला</div>
                    </div>
                  ) : (
                    filteredAddresses.map((addr, idx) => {
                      const checked = selectedAddresses.includes(addr)
                      return (
                        <label key={`${addr}-${idx}`} className="flex cursor-pointer items-center space-x-3 px-3 py-2 border-b last:border-b-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddress(addr)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm text-gray-800">{addr}</span>
                        </label>
                      )
                    })
                  )}
                </div>
                <div className="p-2" style={{ backgroundColor: '#103a94' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddressPicker(false)}
                    className="w-full rounded-md py-2 text-center text-white font-semibold"
                  >
                    ठीक है
                  </button>
                </div>
              </div>
            )}

            {/* Selected list display */}
            {selectedAddresses.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto divide-y divide-gray-200 rounded-lg border border-gray-200">
                {selectedAddresses.map((addr, i) => (
                  <div key={`${addr}-${i}`} className="flex items-start justify-between p-3">
                    <div className="pr-3 text-sm text-gray-800">{addr}</div>
                    <button type="button" onClick={() => removeAddress(addr)} className="text-gray-500 hover:text-gray-700">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              {photoPreview || formData.photo ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <img
                      src={formData.photo ? URL.createObjectURL(formData.photo) : photoPreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium mb-2">
                      {formData.photo ? formData.photo.name : 'Existing Photo'}
                    </p>
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
                id="edit-building-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Update */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-3 text-white disabled:opacity-50"
              style={{ backgroundColor: '#1976d2' }}
            >
              {loading ? 'अपडेट हो रहा है...' : 'अपडेट करें'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default EditBuildingPramukhModal

