import React, { useState, useEffect } from 'react'
import logoImage from '../../../assets/image/BJP-Logo.png'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import KaryakartaDetailModal from '../modals/KaryakartaDetailModal.jsx'
import CreateAdminModal from '../modals/CreateAdminModal'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal'
import CreateKaryakartaModal from '../modals/CreateKaryakartaModal.jsx'
import LastLoginModal from '../modals/LastLoginModal'

const Karyakarta = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKaryakarta, setSelectedKaryakarta] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list', 'grid'
  const [karyakartaData, setKaryakartaData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [karyakartaToDelete, setKaryakartaToDelete] = useState(null)
  const [karyakartaToEdit, setKaryakartaToEdit] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLastLoginModal, setShowLastLoginModal] = useState(false)
  const [selectedUserForLastLogin, setSelectedUserForLastLogin] = useState(null)


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch karyakarta data from API
  useEffect(() => {
    const fetchKaryakartaData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        
        console.log('Fetching karyakarta data from:', panelApiUrl)
        
        const volunteers = await apiService.displayVolunteer(panelApiUrl)
        console.log('Fetched karyakarta data:', volunteers)
        
        // Transform API data to match component structure
        const transformedKaryakartas = volunteers.map(volunteer => ({
          id: volunteer.adminId,
          name: volunteer.name,
          phoneNumber: volunteer.mobileNo,
          status: (volunteer.lastLogin && volunteer.lastLogin.trim() !== '') ? 'active' : 'inactive',
          profileImage: volunteer.photoPath || (volunteer.name ? volunteer.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'K'),
          isPhoto: !!volunteer.photoPath,
          karyakartaId: volunteer.adminId,
          type: volunteer.type,
          subType: volunteer.subType,
          mainAdminId: volunteer.mainAdminId,
          photo: volunteer.photo,
          idcardNo: volunteer.idcardNo,
          lastLogin: volunteer.lastLogin,
          booth: `बूथ ${volunteer.adminId % 20 + 1}`, // Generate booth based on admin ID
          voters: Math.floor(Math.random() * 100) + 150, // Generate random voter count for demo
          area: `वार्ड ${Math.floor(volunteer.adminId / 10) + 1}` // Generate area based on admin ID
        }))
        
        setKaryakartaData(transformedKaryakartas)
      } catch (err) {
        console.error('Error fetching karyakarta data:', err)
        setError(err.message || 'Failed to fetch karyakarta data')
      } finally {
        setLoading(false)
      }
    }

    fetchKaryakartaData()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleCall = (karyakarta) => {
    window.open(`tel:${karyakarta.phoneNumber}`, '_self')
  }

  const handleKaryakartaClick = (karyakarta) => {
    setSelectedKaryakarta(karyakarta)
  }

  const toggleStatus = (karyakartaId) => {
    setKaryakartaData(prevData => 
      prevData.map(karyakarta => 
        karyakarta.id === karyakartaId 
          ? { ...karyakarta, status: karyakarta.status === 'active' ? 'inactive' : 'active' }
          : karyakarta
      )
    )
  }

  const handleEditKaryakarta = () => {
    setKaryakartaToEdit(selectedKaryakarta)
    setShowEditModal(true)
    setSelectedKaryakarta(null) // Close detail modal
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setKaryakartaToEdit(null)
  }

  const handleDeleteClick = () => {
    setKaryakartaToDelete(selectedKaryakarta)
    setShowDeleteConfirm(true)
    setSelectedKaryakarta(null) // Close detail modal
  }

  const handleDeleteConfirm = async () => {
    if (!karyakartaToDelete) return
    
    try {
      setLoading(true)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: karyakartaToDelete.karyakartaId || karyakartaToDelete.id,
        type: 'D',
        sub_type: 'D',
        name: karyakartaToDelete.name || '',
        mobile_no: karyakartaToDelete.phoneNumber || '',
        photo: karyakartaToDelete.photo || '',
        base64: '',
        idcard_no: karyakartaToDelete.idcardNo || '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh karyakarta list from API after successful deletion
      const volunteers = await apiService.displayVolunteer(panelApiUrl)
      const transformedKaryakartas = volunteers.map(volunteer => ({
        id: volunteer.adminId,
        name: volunteer.name,
        phoneNumber: volunteer.mobileNo,
        status: (volunteer.lastLogin && volunteer.lastLogin.trim() !== '') ? 'active' : 'inactive',
        profileImage: volunteer.photoPath || (volunteer.name ? volunteer.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'K'),
        isPhoto: !!volunteer.photoPath,
        karyakartaId: volunteer.adminId,
        type: volunteer.type,
        subType: volunteer.subType,
        mainAdminId: volunteer.mainAdminId,
        photo: volunteer.photo,
        idcardNo: volunteer.idcardNo,
        lastLogin: volunteer.lastLogin,
        booth: `बूथ ${volunteer.adminId % 20 + 1}`,
        voters: Math.floor(Math.random() * 100) + 150,
        area: `वार्ड ${Math.floor(volunteer.adminId / 10) + 1}`
      }))
      setKaryakartaData(transformedKaryakartas)
      
      setShowDeleteConfirm(false)
      setKaryakartaToDelete(null)
    } catch (err) {
      console.error('Failed to delete karyakarta:', err)
      alert(err.message || 'Failed to delete karyakarta')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setKaryakartaToDelete(null)
  }

  const handleCreateKaryakarta = async (data) => {
    try {
      setLoading(true)
      
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Call the insertAdmin API to create new karyakarta
      await apiService.insertAdmin(data, panelApiUrl)
      
      // Refresh karyakarta list from API
      const volunteers = await apiService.displayVolunteer(panelApiUrl)
      const transformedKaryakartas = volunteers.map(volunteer => ({
        id: volunteer.adminId,
        name: volunteer.name,
        phoneNumber: volunteer.mobileNo,
        status: (volunteer.lastLogin && volunteer.lastLogin.trim() !== '') ? 'active' : 'inactive',
        profileImage: volunteer.photoPath || (volunteer.name ? volunteer.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'K'),
        isPhoto: !!volunteer.photoPath,
        karyakartaId: volunteer.adminId,
        type: volunteer.type,
        subType: volunteer.subType,
        mainAdminId: volunteer.mainAdminId,
        photo: volunteer.photo,
        idcardNo: volunteer.idcardNo,
        lastLogin: volunteer.lastLogin,
        booth: `बूथ ${volunteer.adminId % 20 + 1}`,
        voters: Math.floor(Math.random() * 100) + 150,
        area: `वार्ड ${Math.floor(volunteer.adminId / 10) + 1}`
      }))
      setKaryakartaData(transformedKaryakartas)
      
      setShowCreateModal(false)
    } catch (err) {
      console.error('Failed to create karyakarta:', err)
      alert(err.message || 'Failed to create karyakarta')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateKaryakarta = async (data) => {
    try {
      setLoading(true)
      
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Get the karyakarta being edited to preserve existing fields
      const karyakartaToUpdate = karyakartaToEdit || karyakartaData.find(k => k.id === data.adminId || k.karyakartaId === data.admin_id)
      
      // Prepare payload for update_admin API
      const payload = {
        admin_id: data.admin_id || data.adminId || karyakartaToUpdate?.karyakartaId || karyakartaToUpdate?.id,
        type: karyakartaToUpdate?.type || 'V',
        sub_type: karyakartaToUpdate?.subType || karyakartaToUpdate?.sub_type || 'V',
        name: data.name || '',
        mobile_no: data.mobile || '',
        photo: data.photo || karyakartaToUpdate?.photo || '',
        base64: data.base64 || '',
        idcard_no: karyakartaToUpdate?.idcardNo || '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }

      // Call the update API
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh karyakarta list from API
      const volunteers = await apiService.displayVolunteer(panelApiUrl)
      const transformedKaryakartas = volunteers.map(volunteer => ({
        id: volunteer.adminId,
        name: volunteer.name,
        phoneNumber: volunteer.mobileNo,
        status: (volunteer.lastLogin && volunteer.lastLogin.trim() !== '') ? 'active' : 'inactive',
        profileImage: volunteer.photoPath || (volunteer.name ? volunteer.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'K'),
        isPhoto: !!volunteer.photoPath,
        karyakartaId: volunteer.adminId,
        type: volunteer.type,
        subType: volunteer.subType,
        mainAdminId: volunteer.mainAdminId,
        photo: volunteer.photo,
        idcardNo: volunteer.idcardNo,
        lastLogin: volunteer.lastLogin,
        booth: `बूथ ${volunteer.adminId % 20 + 1}`,
        voters: Math.floor(Math.random() * 100) + 150,
        area: `वार्ड ${Math.floor(volunteer.adminId / 10) + 1}`
      }))
      setKaryakartaData(transformedKaryakartas)
      
      handleCloseEditModal()
    } catch (err) {
      console.error('Failed to update karyakarta:', err)
      alert(err.message || 'Failed to update karyakarta')
    } finally {
      setLoading(false)
    }
  }

  const filteredKaryakartas = karyakartaData.filter(karyakarta =>
    karyakarta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    karyakarta.phoneNumber.includes(searchQuery) ||
    karyakarta.booth.toLowerCase().includes(searchQuery.toLowerCase()) ||
    karyakarta.area.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderProfileImage = (karyakarta, size = 'w-12 h-12') => {
    if (karyakarta.isPhoto && karyakarta.profileImage) {
      return (
        <img
          src={karyakarta.profileImage}
          alt={karyakarta.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
        />
      )
    } else if (karyakarta.profileImage && !karyakarta.isPhoto) {
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200`}>
          <span className="text-white text-xs font-bold text-center leading-tight">
            {karyakarta.profileImage}
          </span>
        </div>
      )
    } else {
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center border-2 border-gray-200`}>
          <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      )
    }
  }

  // List View Render
  const renderListView = () => (
    <div className="space-y-2 sm:space-y-3">
      {filteredKaryakartas.map((karyakarta, index) => (
        <div
          key={karyakarta.id}
          onClick={() => handleKaryakartaClick(karyakarta)}
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
              {renderProfileImage(karyakarta, 'w-10 h-10 sm:w-12 sm:h-12')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-xs sm:text-sm font-medium">{index + 1}.</span>
                <h3 className="text-gray-900 font-semibold text-sm sm:text-base truncate">
                  {karyakarta.name}
                </h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 truncate">
                {karyakarta.phoneNumber}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-1 sm:space-y-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCall(karyakarta)
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
                  if (karyakarta.status === 'active' && karyakarta.lastLogin) {
                    setSelectedUserForLastLogin({
                      name: karyakarta.name,
                      lastLogin: karyakarta.lastLogin
                    })
                    setShowLastLoginModal(true)
                  } else {
                    toggleStatus(karyakarta.id)
                  }
                }}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  karyakarta.status === 'active'
                    ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {karyakarta.status === 'active' ? 'Active' : 'Inactive'}
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
      {filteredKaryakartas.map((karyakarta, index) => (
        <div
          key={karyakarta.id}
          onClick={() => handleKaryakartaClick(karyakarta)}
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
            {/* Profile Image with Number Badge */}
            <div className="relative">
              {renderProfileImage(karyakarta, 'w-12 h-12 sm:w-16 sm:h-16')}
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center" style={{backgroundColor: '#0d2f7a'}}>
                {index + 1}
              </div>
            </div>
            
            {/* Karyakarta Info */}
            <div className="text-center w-full">
              <h3 className="font-bold text-xs sm:text-sm truncate transition-colors mb-1" style={{color: '#1a1a1a'}} onMouseEnter={(e) => e.target.style.color = '#103a94'} onMouseLeave={(e) => e.target.style.color = '#1a1a1a'}>
                {karyakarta.name}
              </h3>
              <p className="text-xs mb-2 sm:mb-3 flex items-center justify-center" style={{color: '#4a5568'}}>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#718096'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="truncate">{karyakarta.phoneNumber}</span>
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col items-center space-y-1 sm:space-y-2 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCall(karyakarta)
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
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
                  toggleStatus(karyakarta.id)
                }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all w-full text-white"
                style={{
                  backgroundColor: karyakarta.status === 'active' ? '#059669' : '#dc2626'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = karyakarta.status === 'active' ? '#047857' : '#b91c1c'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = karyakarta.status === 'active' ? '#059669' : '#dc2626'
                }}
              >
                {karyakarta.status === 'active' ? 'Active' : 'Inactive'}
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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
      
      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex-shrink-0 shadow-md" style={{backgroundColor: '#102463'}}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h1 className="text-white text-base sm:text-lg font-semibold">कार्यकर्ता</h1>
            
            <button
              onClick={() => setSearchQuery('')}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
            <div className="bg-white/20 rounded-lg p-1 flex backdrop-blur-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white text-amber-600' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 sm:px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-amber-600' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white px-2 sm:px-4 py-2 sm:py-3 border-b border-amber-100 flex-shrink-0 shadow-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="Search karyakartas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 pl-8 sm:pl-10 bg-amber-50 rounded-lg border border-amber-200 focus:outline-none focus:border-amber-500 focus:bg-white transition-all duration-300 text-sm sm:text-base"
            />
            <svg className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Karyakarta List */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4" style={{ backgroundColor: '#e5e8ff' }}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 text-sm">Loading karyakarta data...</p>
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
          ) : karyakartaData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-gray-800 font-semibold mb-2">No Karyakartas Found</h3>
                <p className="text-gray-600 text-sm">No karyakarta data available at the moment.</p>
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
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 shadow-lg space-y-2 sm:space-y-0" style={{backgroundColor: '#102463'}}>
          <div className="px-2 sm:px-3 py-1 sm:py-2 rounded-lg shadow-sm" style={{backgroundColor: '#0d2f7a'}}>
            <span className="text-white text-xs sm:text-sm font-medium">
              टोटल : {filteredKaryakartas.length}
            </span>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow-md" 
            style={{backgroundColor: '#0d2f7a'}} 
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2563'} 
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0d2f7a'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-white text-xs sm:text-sm font-medium">कार्यकर्ता बनाएं</span>
          </button>
        </div>

        {/* Karyakarta Detail Modal */}
        <KaryakartaDetailModal
          karyakarta={selectedKaryakarta}
          onClose={() => setSelectedKaryakarta(null)}
          onCall={handleCall}
          onToggleStatus={toggleStatus}
          onEdit={handleEditKaryakarta}
          onDelete={handleDeleteClick}
        />

        {/* Edit Modal */}
        <CreateAdminModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateKaryakarta}
          editData={karyakartaToEdit}
          mode="edit"
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          admin={karyakartaToDelete}
        />

        {/* Create Karyakarta Modal */}
        <CreateKaryakartaModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateKaryakarta}
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

export default Karyakarta
