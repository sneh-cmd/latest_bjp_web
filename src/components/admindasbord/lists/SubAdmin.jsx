import React, { useState, useEffect } from 'react'
import logoImage from '../../../assets/image/BJP-Logo.png'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import CreateSubAdminModal from '../modals/CreateSubAdminModal'
import SubAdminDetailModal from '../modals/SubAdminDetailModal'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal'
import LastLoginModal from '../modals/LastLoginModal'

const SubAdmin = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list', 'grid'
  const [subAdminData, setSubAdminData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [subAdminToDelete, setSubAdminToDelete] = useState(null)
  const [subAdminToEdit, setSubAdminToEdit] = useState(null)
  const [showLastLoginModal, setShowLastLoginModal] = useState(false)
  const [selectedUserForLastLogin, setSelectedUserForLastLogin] = useState(null)


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch sub-admin data from API
  useEffect(() => {
    const fetchSubAdminData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        
        console.log('Fetching sub-admin data from:', panelApiUrl)
        
        const subAdmins = await apiService.displaySubAdmin(panelApiUrl)
        console.log('Fetched sub-admin data:', subAdmins)
        
        // Transform API data to match component structure
        const transformedSubAdmins = subAdmins.map(subAdmin => ({
          id: subAdmin.adminId,
          name: subAdmin.name,
          phoneNumber: subAdmin.mobileNo,
          status: (subAdmin.lastLogin && subAdmin.lastLogin.trim() !== '') ? 'active' : 'inactive',
          profileImage: subAdmin.photoPath || (subAdmin.name ? subAdmin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SA'),
          isPhoto: !!subAdmin.photoPath,
          adminId: subAdmin.adminId,
          type: subAdmin.type,
          subType: subAdmin.subType,
          mainAdminId: subAdmin.mainAdminId,
          photo: subAdmin.photo,
          idcardNo: subAdmin.idcardNo,
          lastLogin: subAdmin.lastLogin,
          area: `वार्ड ${subAdmin.adminId % 8 + 1}`, // Generate area based on admin ID
          voters: Math.floor(Math.random() * 500) + 1000 // Generate random voter count for demo
        }))
        
        setSubAdminData(transformedSubAdmins)
      } catch (err) {
        console.error('Error fetching sub-admin data:', err)
        setError(err.message || 'Failed to fetch sub-admin data')
      } finally {
        setLoading(false)
      }
    }

    fetchSubAdminData()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleCall = (subAdmin) => {
    window.open(`tel:${subAdmin.phoneNumber}`, '_self')
  }

  const handleSubAdminClick = (subAdmin) => {
    setSelectedSubAdmin(subAdmin)
  }

  const toggleStatus = (subAdminId) => {
    setSubAdminData(prevData => 
      prevData.map(subAdmin => 
        subAdmin.id === subAdminId 
          ? { ...subAdmin, status: subAdmin.status === 'active' ? 'inactive' : 'active' }
          : subAdmin
      )
    )
  }

  const handleCreateSubAdmin = () => {
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
  }

  const handleEditSubAdmin = () => {
    setSubAdminToEdit(selectedSubAdmin)
    setShowEditModal(true)
    setSelectedSubAdmin(null) // Close detail modal
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSubAdminToEdit(null)
  }

  const handleDeleteClick = () => {
    setSubAdminToDelete(selectedSubAdmin)
    setShowDeleteConfirm(true)
    setSelectedSubAdmin(null) // Close detail modal
  }

  const handleDeleteConfirm = async () => {
    if (!subAdminToDelete) return
    
    try {
      setLoading(true)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: subAdminToDelete.adminId || subAdminToDelete.id,
        type: 'D',
        sub_type: 'D',
        name: subAdminToDelete.name || '',
        mobile_no: subAdminToDelete.phoneNumber || subAdminToDelete.mobileNo || '',
        photo: subAdminToDelete.photo || '',
        base64: '',
        idcard_no: subAdminToDelete.idcardNo || '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh sub-admin list from API after successful deletion
      const subAdmins = await apiService.displaySubAdmin(panelApiUrl)
      const transformedSubAdmins = subAdmins.map(subAdmin => ({
        id: subAdmin.adminId,
        name: subAdmin.name,
        phoneNumber: subAdmin.mobileNo,
        status: (subAdmin.lastLogin && subAdmin.lastLogin.trim() !== '') ? 'active' : 'inactive',
        profileImage: subAdmin.photoPath || (subAdmin.name ? subAdmin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SA'),
        isPhoto: !!subAdmin.photoPath,
        adminId: subAdmin.adminId,
        type: subAdmin.type,
        subType: subAdmin.subType,
        mainAdminId: subAdmin.mainAdminId,
        photo: subAdmin.photo,
        idcardNo: subAdmin.idcardNo,
        lastLogin: subAdmin.lastLogin,
        area: `वार्ड ${subAdmin.adminId % 8 + 1}`,
        voters: Math.floor(Math.random() * 500) + 1000
      }))
      setSubAdminData(transformedSubAdmins)
      
      setShowDeleteConfirm(false)
      setSubAdminToDelete(null)
    } catch (err) {
      console.error('Failed to delete sub-admin:', err)
      alert(err.message || 'Failed to delete sub-admin')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setSubAdminToDelete(null)
  }

  const handleSubmitSubAdmin = async (data) => {
    try {
      setLoading(true)
      const payload = {
        type: 'SA',
        sub_type: 'SA',
        name: data.name || '',
        mobile_no: data.mobile || '',
        photo: data.photo || '',
        base64: data.base64 || '',
        idcard_no: '',
        booth_javabdari: (data.booth_javabdari && `${data.booth_javabdari}`) || '0',
        page_javabdari: '',
        add: ''
      }

      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'

      await apiService.insertAdmin(payload, panelApiUrl)

      const subAdmins = await apiService.displaySubAdmin(panelApiUrl)
      const transformedSubAdmins = subAdmins.map(subAdmin => ({
        id: subAdmin.adminId,
        name: subAdmin.name,
        phoneNumber: subAdmin.mobileNo,
        status: (subAdmin.lastLogin && subAdmin.lastLogin.trim() !== '') ? 'active' : 'inactive',
        profileImage: subAdmin.photoPath || (subAdmin.name ? subAdmin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SA'),
        isPhoto: !!subAdmin.photoPath,
        adminId: subAdmin.adminId,
        type: subAdmin.type,
        subType: subAdmin.subType,
        mainAdminId: subAdmin.mainAdminId,
        photo: subAdmin.photo,
        idcardNo: subAdmin.idcardNo,
        lastLogin: subAdmin.lastLogin,
        area: `वार्ड ${subAdmin.adminId % 8 + 1}`,
        voters: Math.floor(Math.random() * 500) + 1000
      }))
      setSubAdminData(transformedSubAdmins)
      handleCloseCreateModal()
    } catch (err) {
      console.error('Failed to create sub-admin:', err)
      alert(err.message || 'Failed to create sub-admin')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSubAdmin = async (data) => {
    try {
      setLoading(true)
      
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Get the sub-admin being edited to preserve existing fields
      const subAdminToUpdate = subAdminToEdit || subAdminData.find(subAdmin => subAdmin.id === data.adminId || subAdmin.adminId === data.admin_id)
      
      // Prepare payload for update_admin API
      // If no new photo is provided, preserve existing photo (empty strings will keep existing photo on server)
      const payload = {
        admin_id: data.admin_id || data.adminId || subAdminToUpdate?.adminId || subAdminToUpdate?.id,
        type: subAdminToUpdate?.type || 'SA',
        sub_type: subAdminToUpdate?.subType || subAdminToUpdate?.sub_type || 'SA',
        name: data.name || '',
        mobile_no: data.mobile || '',
        photo: data.photo || subAdminToUpdate?.photo || '',
        base64: data.base64 || '', // Only send base64 if a new photo was uploaded
        idcard_no: subAdminToUpdate?.idcardNo || '',
        booth_javabdari: data.booth_javabdari || subAdminToUpdate?.booth_javabdari || '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }

      // Call the update API
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh sub-admin list from API
      const subAdmins = await apiService.displaySubAdmin(panelApiUrl)
      const transformedSubAdmins = subAdmins.map(subAdmin => ({
        id: subAdmin.adminId,
        name: subAdmin.name,
        phoneNumber: subAdmin.mobileNo,
        status: (subAdmin.lastLogin && subAdmin.lastLogin.trim() !== '') ? 'active' : 'inactive',
        profileImage: subAdmin.photoPath || (subAdmin.name ? subAdmin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'SA'),
        isPhoto: !!subAdmin.photoPath,
        adminId: subAdmin.adminId,
        type: subAdmin.type,
        subType: subAdmin.subType,
        mainAdminId: subAdmin.mainAdminId,
        photo: subAdmin.photo,
        idcardNo: subAdmin.idcardNo,
        lastLogin: subAdmin.lastLogin,
        area: `वार्ड ${subAdmin.adminId % 8 + 1}`,
        voters: Math.floor(Math.random() * 500) + 1000
      }))
      setSubAdminData(transformedSubAdmins)
      
      handleCloseEditModal()
    } catch (err) {
      console.error('Failed to update sub-admin:', err)
      alert(err.message || 'Failed to update sub-admin')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubAdmins = subAdminData.filter(subAdmin =>
    subAdmin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subAdmin.phoneNumber.includes(searchQuery)
  )

  const renderProfileImage = (subAdmin, size = 'w-12 h-12') => {
    if (subAdmin.isPhoto && subAdmin.profileImage) {
      return (
        <img
          src={subAdmin.profileImage}
          alt={subAdmin.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
        />
      )
    } else {
      // Show initials when no photo is available (same as other roles)
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200`}>
          <span className="text-white text-sm font-bold">
            {subAdmin.profileImage}
          </span>
        </div>
      )
    }
  }

  // List View Render
  const renderListView = () => (
    <div className="space-y-2 sm:space-y-3">
      {filteredSubAdmins.map((subAdmin, index) => (
        <div
          key={subAdmin.id}
          onClick={() => handleSubAdminClick(subAdmin)}
          className="bg-white rounded-lg p-3 sm:p-4 border transition-all cursor-pointer"
          style={{borderColor: '#e6f0ff'}}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#103a94'
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#e6f0ff'
          }}
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex-shrink-0">
              {renderProfileImage(subAdmin, 'w-10 h-10 sm:w-12 sm:h-12')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-xs sm:text-sm font-medium">{index + 1}.</span>
                <h3 className="text-gray-900 font-semibold text-sm sm:text-base truncate">
                  {subAdmin.name}
                </h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 truncate">
                {subAdmin.phoneNumber}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-1 sm:space-y-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCall(subAdmin)
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{backgroundColor: '#103a94'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (subAdmin.status === 'active' && subAdmin.lastLogin) {
                    setSelectedUserForLastLogin({
                      name: subAdmin.name,
                      lastLogin: subAdmin.lastLogin
                    })
                    setShowLastLoginModal(true)
                  } else {
                    toggleStatus(subAdmin.id)
                  }
                }}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  subAdmin.status === 'active'
                    ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {subAdmin.status === 'active' ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Grid View Render
  const renderGridView = () => (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {filteredSubAdmins.map((subAdmin, index) => (
        <div
          key={subAdmin.id}
          onClick={() => handleSubAdminClick(subAdmin)}
          className="bg-white rounded-xl p-3 sm:p-4 border transition-all duration-300 cursor-pointer group"
          style={{borderColor: '#e6f0ff'}}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#103a94'
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#e6f0ff'
          }}
        >
          <div className="flex flex-col items-center space-y-2 sm:space-y-3">
            <div className="flex-shrink-0">
              {renderProfileImage(subAdmin, 'w-12 h-12 sm:w-16 sm:h-16')}
            </div>
            <div className="text-center w-full">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <span className="text-gray-500 text-xs font-medium">{index + 1}.</span>
              </div>
              <h3 className="text-gray-900 font-semibold text-xs sm:text-sm truncate">
                {subAdmin.name}
              </h3>
              <p className="text-gray-600 text-xs mt-1 truncate">
                {subAdmin.phoneNumber}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-1 sm:space-y-2 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCall(subAdmin)
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{backgroundColor: '#103a94'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStatus(subAdmin.id)
                }}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-all duration-300 w-full ${
                  subAdmin.status === 'active'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {subAdmin.status === 'active' ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )


  return (
    <div className={`relative w-screen h-screen overflow-hidden transition-all duration-700 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Background with Emerald Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/20 via-transparent to-teal-100/20"></div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-16 left-16 w-80 h-80 bg-gradient-to-br from-emerald-200/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-16 right-16 w-72 h-72 bg-gradient-to-br from-teal-200/20 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex-shrink-0 shadow-md" style={{backgroundColor: '#103a94'}}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h1 className="text-white text-base sm:text-lg font-semibold">सब ऐडमिन</h1>
            
            {/* View Toggle Switch */}
            <div className="rounded-lg p-1 flex shadow-sm" style={{backgroundColor: 'rgba(255, 255, 255, 0.2)'}}>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all flex items-center ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm' 
                    : 'text-white hover:bg-white/10'
                }`}
                style={viewMode === 'list' ? {color: '#103a94'} : {}}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all flex items-center ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm' 
                    : 'text-white hover:bg-white/10'
                }`}
                style={viewMode === 'grid' ? {color: '#103a94'} : {}}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex justify-center">
            <input
              type="text"
              placeholder="Search sub-admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-3 py-2 sm:py-1.5 rounded-md border focus:outline-none focus:bg-white transition-all text-gray-800 placeholder-gray-500 text-sm"
              style={{backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: 'rgba(255, 255, 255, 0.2)'}}
              onFocus={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
            />
          </div>
        </div>

        {/* SubAdmin List */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-emerald-600 text-sm">Loading sub-admin data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
                </div>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : subAdminData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 max-w-md w-full text-center">
                <svg className="w-12 h-12 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-emerald-800 font-semibold mb-2">No Sub-Admins Found</h3>
                <p className="text-emerald-600 text-sm">No sub-admin data available at the moment.</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'list' && renderListView()}
              {viewMode === 'grid' && renderGridView()}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 shadow-lg space-y-2 sm:space-y-0" style={{backgroundColor: '#103a94'}}>
          <div className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg shadow-sm" style={{backgroundColor: '#0d2f7a'}}>
            <span className="text-white text-xs sm:text-sm font-medium">
              टोटल : {filteredSubAdmins.length}
            </span>
          </div>
          
          <button 
            onClick={handleCreateSubAdmin}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow-md"
            style={{backgroundColor: '#0d2f7a'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2563'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0d2f7a'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-white text-xs sm:text-sm font-medium">सब ऐडमिन बनाएं</span>
          </button>
        </div>

        {/* SubAdmin Detail Modal */}
        <SubAdminDetailModal
          subAdmin={selectedSubAdmin}
          onClose={() => setSelectedSubAdmin(null)}
          onCall={handleCall}
          onToggleStatus={toggleStatus}
          onEdit={handleEditSubAdmin}
          onDelete={handleDeleteClick}
        />

        {/* Create Sub-Admin Modal */}
        <CreateSubAdminModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onSubmit={handleSubmitSubAdmin}
          mode="create"
        />

        {/* Edit Sub-Admin Modal */}
        <CreateSubAdminModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateSubAdmin}
          editData={subAdminToEdit}
          mode="edit"
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          admin={subAdminToDelete}
        />

        {/* Last Login Modal */}
        {showLastLoginModal && selectedUserForLastLogin && (
          <LastLoginModal
            userName={selectedUserForLastLogin.name}
            lastLogin={selectedUserForLastLogin.lastLogin}
            onClose={() => {
              setShowLastLoginModal(false)
              setSelectedUserForLastLogin(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default SubAdmin
