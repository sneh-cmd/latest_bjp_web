import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const CreateOrganizationMemberModal = ({ isOpen, onClose, onSubmit, mainAdminId }) => {
  const [role, setRole] = useState('')
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [photo, setPhoto] = useState(null)
  const [showRoleList, setShowRoleList] = useState(false)
  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [rolesError, setRolesError] = useState(null)
  const [loading, setLoading] = useState(false)

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

  const handleSave = async () => {
    // Validate required fields
    if (!name.trim()) {
      alert('कृपया नाम दर्ज करें')
      return
    }
    if (!mobile.trim()) {
      alert('कृपया मोबाइल नंबर दर्ज करें')
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
      if (photo) {
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

      // Prepare payload according to API requirements
      const payload = {
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

      // Use the specified API endpoint
      const apiEndpoint = 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      console.log('Creating organization member with payload:', payload)
      console.log('Using API endpoint:', apiEndpoint)
      
      // Call the insertAdmin API
      const response = await apiService.insertAdmin(payload, apiEndpoint)
      
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
      
      console.log('✅ Organization member created successfully!')
      
      // Clear form
      setRole('')
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
      console.error('Error creating organization member:', error)
      alert(`त्रुटि: ${error.message || 'संगठन के सदस्य बनाने में असफल'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-800 px-4 py-4 text-white flex items-center justify-between">
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <h2 className="text-lg font-bold">संगठन के सदस्य</h2>
          <div className="w-8" />
        </div>

        {/* Form */}
        <div className="p-4 space-y-4" style={{backgroundColor:'#eef1ff'}}>
          <div>
            <label className="block text-sm font-semibold mb-2">पद</label>
            <div className="relative">
              <button 
                onClick={() => setShowRoleList(prev=>!prev)} 
                disabled={loadingRoles}
                className="w-full text-left px-3 py-3 rounded-lg border bg-white flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div>
            <label className="block text-sm font-semibold mb-2">नाम</label>
            <input type="text" value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-3 py-3 rounded-lg border bg-white" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">मोबाइल नं.</label>
            <input type="tel" value={mobile} onChange={(e)=>setMobile(e.target.value)} className="w-full px-3 py-3 rounded-lg border bg-white" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">फोटो</label>
            <div className="flex items-center space-x-3">
              <div className="w-20 h-20 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden">
                {photo ? (
                  <img src={URL.createObjectURL(photo)} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                )}
              </div>
              <label className="px-3 py-2 rounded-md text-white cursor-pointer" style={{backgroundColor:'#103a94'}}>
                Upload
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden"/>
              </label>
            </div>
          </div>

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

export default CreateOrganizationMemberModal


