import React, { useState, useEffect } from 'react'
import logoImage from '../../../assets/image/BJP-Logo.png'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import CreateAdminModal from '../modals/CreateAdminModal'
import AdminDetailModal from '../modals/AdminDetailModal'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal'
import LastLoginModal from '../modals/LastLoginModal'
import * as XLSX from 'xlsx'

const AdminList = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'list', 'grid'
  const [adminData, setAdminData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState(null)
  const [adminToEdit, setAdminToEdit] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showLastLoginModal, setShowLastLoginModal] = useState(false)
  const [selectedUserForLastLogin, setSelectedUserForLastLogin] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch admin data from API
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        
        console.log('Fetching admin data from:', panelApiUrl)
        
        const admins = await apiService.displayAdmin(panelApiUrl)
        console.log('Fetched admin data:', admins)
        
        // Transform API data to match component structure
        const transformedAdmins = admins.map(admin => ({
          id: admin.adminId,
          name: admin.name,
          phoneNumber: admin.mobileNo,
          status: admin.lastLogin && admin.lastLogin.trim() !== '' ? 'active' : 'inactive',
          profileImage: admin.photoPath || (admin.name ? admin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'),
          isPhoto: !!admin.photoPath,
          adminId: admin.adminId,
          type: admin.type,
          subType: admin.subType,
          mainAdminId: admin.mainAdminId,
          photo: admin.photo,
          idcardNo: admin.idcardNo,
          lastLogin: admin.lastLogin
        }))
        
        setAdminData(transformedAdmins)
      } catch (err) {
        console.error('Error fetching admin data:', err)
        setError(err.message || 'Failed to fetch admin data')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleCall = (admin) => {
    window.open(`tel:${admin.phoneNumber}`, '_self')
  }

  const handleAdminClick = (admin) => {
    setSelectedAdmin(admin)
  }

  const toggleStatus = (adminId) => {
    // Toggle status logic here
    console.log('Toggle status for admin:', adminId)
  }

  const handleCreateAdmin = () => {
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
  }

  const handleEditAdmin = () => {
    setAdminToEdit(selectedAdmin)
    setShowEditModal(true)
    setSelectedAdmin(null) // Close detail modal
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setAdminToEdit(null)
  }

  const handleDeleteClick = () => {
    setAdminToDelete(selectedAdmin)
    setShowDeleteConfirm(true)
    setSelectedAdmin(null) // Close detail modal
  }

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return
    
    try {
      setLoading(true)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: adminToDelete.adminId || adminToDelete.id,
        type: 'D',
        sub_type: 'D',
        name: adminToDelete.name || '',
        mobile_no: adminToDelete.phoneNumber || adminToDelete.mobileNo || '',
        photo: adminToDelete.photo || '',
        base64: '',
        idcard_no: adminToDelete.idcardNo || '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh admin list from API after successful deletion
      const admins = await apiService.displayAdmin(panelApiUrl)
      const transformedAdmins = admins.map(admin => ({
        id: admin.adminId,
        name: admin.name,
        phoneNumber: admin.mobileNo,
        status: admin.lastLogin && admin.lastLogin.trim() !== '' ? 'active' : 'inactive',
        profileImage: admin.photoPath || (admin.name ? admin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'),
        isPhoto: !!admin.photoPath,
        adminId: admin.adminId,
        type: admin.type,
        subType: admin.subType,
        mainAdminId: admin.mainAdminId,
        photo: admin.photo,
        idcardNo: admin.idcardNo,
        lastLogin: admin.lastLogin
      }))
      setAdminData(transformedAdmins)
      
      setShowDeleteConfirm(false)
      setAdminToDelete(null)
    } catch (err) {
      console.error('Failed to delete admin:', err)
      alert(err.message || 'Failed to delete admin')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setAdminToDelete(null)
  }

  const handleExport = () => {
    try {
      // Filter admins based on search query (same logic as filteredAdmins)
      const filteredData = adminData.filter(admin =>
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.phoneNumber.includes(searchQuery)
      )
      
      if (filteredData.length === 0) {
        alert('No data to export')
        return
      }

      // Transform data to Excel format with headers
      const excelData = filteredData.map((admin, index) => ({
        'Sr. No.': index + 1,
        'Name': admin.name || '',
        'Phone Number': admin.phoneNumber || '',
        'Status': admin.status === 'active' ? 'Active' : 'Inactive'
      }))

      // Create a new workbook
      const wb = XLSX.utils.book_new()
      
      // Create a worksheet from the data
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 8 },   // Sr. No.
        { wch: 25 },  // Name
        { wch: 15 },  // Phone Number
        { wch: 12 }   // Status
      ]
      ws['!cols'] = colWidths
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Admins')
      
      // Generate Excel file and download
      const fileName = `Admin_List_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      console.log('Export successful:', fileName)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const handleImport = () => {
    setShowImportModal(true)
  }

  const handleCloseImportModal = () => {
    setShowImportModal(false)
  }

  const handleImportSubmit = (file) => {
    // Implement import functionality
    console.log('Import file:', file)
    handleCloseImportModal()
  }

  const handleSubmitAdmin = async (data) => {
    try {
      setLoading(true)
      // Prepare payload for insert_admin
      const payload = {
        type: 'A',
        sub_type: 'A',
        name: data.name || '',
        mobile_no: data.mobile || '',
        photo: data.photo || '',
        base64: data.base64 || '',
        idcard_no: '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: ''
      }

      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'

      await apiService.insertAdmin(payload, panelApiUrl)

      // Refresh admin list without full page reload
      const admins = await apiService.displayAdmin(panelApiUrl)
      const transformedAdmins = admins.map(admin => ({
        id: admin.adminId,
        name: admin.name,
        phoneNumber: admin.mobileNo,
        status: admin.lastLogin && admin.lastLogin.trim() !== '' ? 'active' : 'inactive',
        profileImage: admin.photoPath || (admin.name ? admin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'),
        isPhoto: !!admin.photoPath,
        adminId: admin.adminId,
        type: admin.type,
        subType: admin.subType,
        mainAdminId: admin.mainAdminId,
        photo: admin.photo,
        idcardNo: admin.idcardNo,
        lastLogin: admin.lastLogin
      }))
      setAdminData(transformedAdmins)
      handleCloseCreateModal()
    } catch (err) {
      console.error('Failed to create admin:', err)
      alert(err.message || 'Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAdmin = async (data) => {
    try {
      setLoading(true)
      
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Get the admin being edited to preserve existing fields
      const adminToUpdate = adminToEdit || adminData.find(admin => admin.id === data.adminId || admin.adminId === data.admin_id)
      
      // Prepare payload for update_admin API
      // If photo was explicitly removed, send empty strings
      // If no new photo is provided and photo wasn't removed, preserve existing photo
      const photoValue = data.photoRemoved 
        ? '' // Photo was removed, send empty string
        : (data.photo || adminToUpdate?.photo || '') // Keep existing or use new photo
      
      const base64Value = data.photoRemoved 
        ? '' // Photo was removed, send empty base64
        : (data.base64 || '') // Use new base64 if provided, otherwise empty (keeps existing)
      
      const payload = {
        admin_id: data.admin_id || data.adminId || adminToUpdate?.adminId || adminToUpdate?.id,
        type: adminToUpdate?.type || 'A',
        sub_type: adminToUpdate?.subType || adminToUpdate?.sub_type || 'A',
        name: data.name || '',
        mobile_no: data.mobile || '',
        photo: photoValue,
        base64: base64Value,
        idcard_no: adminToUpdate?.idcardNo || '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }

      // Call the update API
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh admin list from API
      const admins = await apiService.displayAdmin(panelApiUrl)
      const transformedAdmins = admins.map(admin => ({
        id: admin.adminId,
        name: admin.name,
        phoneNumber: admin.mobileNo,
        status: admin.lastLogin && admin.lastLogin.trim() !== '' ? 'active' : 'inactive',
        profileImage: admin.photoPath || (admin.name ? admin.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A'),
        isPhoto: !!admin.photoPath,
        adminId: admin.adminId,
        type: admin.type,
        subType: admin.subType,
        mainAdminId: admin.mainAdminId,
        photo: admin.photo,
        idcardNo: admin.idcardNo,
        lastLogin: admin.lastLogin
      }))
      setAdminData(transformedAdmins)
      
      handleCloseEditModal()
    } catch (err) {
      console.error('Failed to update admin:', err)
      alert(err.message || 'Failed to update admin')
    } finally {
      setLoading(false)
    }
  }

  const filteredAdmins = adminData.filter(admin =>
    admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.phoneNumber.includes(searchQuery)
  )

  const renderProfileImage = (admin, size = 'w-12 h-12') => {
    if (admin.isPhoto && admin.profileImage) {
      return (
        <img
          src={admin.profileImage}
          alt={admin.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
        />
      )
    } else {
      // Show initials when no photo is available (same as other roles)
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200`}>
          <span className="text-white text-sm font-bold">
            {admin.profileImage}
          </span>
        </div>
      )
    }
  }

  // List View Render
  const renderListView = () => (
    <div className="space-y-2 sm:space-y-3">
      {filteredAdmins.map((admin, index) => (
        <div
          key={admin.id}
          onClick={() => handleAdminClick(admin)}
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
              {renderProfileImage(admin, 'w-10 h-10 sm:w-12 sm:h-12')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 text-xs sm:text-sm font-medium">{index + 1}.</span>
                <h3 className="text-gray-900 font-semibold text-sm sm:text-base truncate">
                  {admin.name}
                </h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mt-1 truncate">
                {admin.phoneNumber}
              </p>
            </div>
            <div className="flex flex-col items-center space-y-1 sm:space-y-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCall(admin)
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
                  if (admin.status === 'active' && admin.lastLogin) {
                    setSelectedUserForLastLogin({
                      name: admin.name,
                      lastLogin: admin.lastLogin
                    })
                    setShowLastLoginModal(true)
                  } else {
                    toggleStatus(admin.id)
                  }
                }}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  admin.status === 'active'
                    ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {admin.status === 'active' ? 'Active' : 'Inactive'}
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
      {filteredAdmins.map((admin, index) => (
        <div
          key={admin.id}
          onClick={() => handleAdminClick(admin)}
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
              {renderProfileImage(admin, 'w-12 h-12 sm:w-16 sm:h-16')}
              <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center" style={{backgroundColor: '#0d2f7a'}}>
                {index + 1}
              </div>
            </div>
            
            {/* Admin Info */}
            <div className="text-center w-full">
              <h3 className="font-bold text-xs sm:text-sm truncate transition-colors mb-1" style={{color: '#1a1a1a'}} onMouseEnter={(e) => e.target.style.color = '#103a94'} onMouseLeave={(e) => e.target.style.color = '#1a1a1a'}>
                {admin.name}
              </h3>
              <p className="text-xs mb-2 sm:mb-3 flex items-center justify-center" style={{color: '#4a5568'}}>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#718096'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="truncate">{admin.phoneNumber}</span>
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col items-center space-y-1 sm:space-y-2 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCall(admin)
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
                  if (admin.status === 'active' && admin.lastLogin) {
                    setSelectedUserForLastLogin({
                      name: admin.name,
                      lastLogin: admin.lastLogin
                    })
                    setShowLastLoginModal(true)
                  } else {
                    toggleStatus(admin.id)
                  }
                }}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all w-full text-white"
                style={{
                  backgroundColor: admin.status === 'active' ? '#059669' : '#dc2626'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = admin.status === 'active' ? '#047857' : '#b91c1c'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = admin.status === 'active' ? '#059669' : '#dc2626'
                }}
              >
                {admin.status === 'active' ? 'Active' : 'Inactive'}
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
      
      {/* Main Container with Flex Layout */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-md" style={{ backgroundColor: '#102463' }}>
          {/* First Row: Arrow + Title (left) | Search icon (right) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handleBack}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h1 className="text-white text-base sm:text-lg font-semibold">ऐडमिन</h1>
            </div>
            
            <div className="search-box">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="reset"
                onClick={() => setSearchQuery('')}
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Total Count - Left side */}
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{color: '#102463'}}>
                टोटल : {filteredAdmins.length}
              </span>
            </div>
            {/* View Mode Toggle - Right side */}
            <div className="rounded-lg p-1 flex" style={{backgroundColor: '#102463'}}>
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


        {/* Admin List */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4" style={{ backgroundColor: '#e5e8ff' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-sm">Loading admin data...</p>
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
        ) : adminData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md w-full text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-gray-800 font-semibold mb-2">No Admins Found</h3>
              <p className="text-gray-600 text-sm">No admin data available at the moment.</p>
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
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex flex-row items-center justify-end flex-shrink-0 shadow-lg" style={{ backgroundColor: '#102463' }}>
        <div className="flex flex-row items-center gap-2 sm:gap-3">

          {/* Export Button */}
          <button 
            onClick={handleExport}
            className="w-auto px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow-md"
            style={{backgroundColor: 'rgba(220, 38, 38, 0.87)'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(185, 28, 28, 0.85)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.87)'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 18H6.2v-1.4h9.6V20zm0-2.8H6.2v-1.4h9.6v1.4zm0-2.8H6.2v-1.4h9.6v1.4zM13 9V3.5L18.5 9H13z"/>
              <path d="M9 12h6v1.5H9V12zm0 2.5h6V16H9v-1.5zm0 2.5h6V18.5H9V17z"/>
            </svg>
            <span className="text-white text-xs sm:text-sm font-medium">Export</span>
          </button>

          {/* Create Admin Button */}
          <button 
            onClick={handleCreateAdmin}
            className="w-auto px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm hover:shadow-md"
            style={{backgroundColor: '#ffffff'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{color: '#102463'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-xs sm:text-sm font-medium" style={{color: '#102463'}}>एडमिन बनाएं</span>
          </button>
        </div>
        </div>

        {/* Admin Detail Modal */}
        <AdminDetailModal
          admin={selectedAdmin}
          onClose={() => setSelectedAdmin(null)}
          onCall={handleCall}
          onToggleStatus={toggleStatus}
          onEdit={handleEditAdmin}
          onDelete={handleDeleteClick}
        />

        {/* Create Admin Modal */}
        <CreateAdminModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onSubmit={handleSubmitAdmin}
          mode="create"
        />

        {/* Edit Admin Modal */}
        <CreateAdminModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateAdmin}
          editData={adminToEdit}
          mode="edit"
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          admin={adminToDelete}
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

export default AdminList
