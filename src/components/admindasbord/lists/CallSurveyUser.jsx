import React, { useState, useEffect } from 'react'
import logoImage from '../../../assets/image/BJP-Logo.png'
import apiService from '../../../apidata.jsx'
import CreateCallSurveyUserModal from '../modals/CreateCallSurveyUserModal'
import EditCallSurveyUserModal from '../modals/EditCallSurveyUserModal'
import CallSurveyUserDetailModal from '../modals/CallSurveyUserDetailModal'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal'
import localStorageManager from '../../../utils/localStorage.js'

const CallSurveyUser = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userData, setUserData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [newUser, setNewUser] = useState({
    name: '',
    phoneNumber: '',
    boothNumbers: []
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get panel API URL from localStorage
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        
        console.log('Fetching call survey user data from:', panelApiUrl)
        
        // Call the real API
        const apiData = await apiService.displayCallCenter(panelApiUrl)
        
        // Transform API data to match component structure
        const transformedData = apiData.map((user, index) => ({
          id: user.adminId || index + 1,
          adminId: user.adminId || user.id || null, // Store adminId separately for delete operation
          name: user.name || 'Unknown',
          phoneNumber: user.mobileNo || '',
          boothNumbers: user.boothNo ? user.boothNo.split(',').filter(booth => booth.trim() !== '').map(booth => parseInt(booth.trim())).filter(booth => !isNaN(booth)) : [],
          profileImage: user.photo || null,
          photoPath: user.photoPath || null,
          isPhoto: Boolean(user.photo && user.photo.trim() !== ''),
          lastLogin: user.lastLogin || null,
          type: user.type || 'CL'
        }))
        
        console.log('Transformed call survey user data:', transformedData)
        setUserData(transformedData)
      } catch (err) {
        console.error('Error fetching call survey user data:', err)
        setError(err.message || 'Failed to fetch call survey user data')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleCall = (user) => {
    if (user.phoneNumber) {
      window.open(`tel:${user.phoneNumber}`, '_self')
    }
  }

  const handleUserClick = (user) => {
    setSelectedUser(user)
  }

  const handleEditUser = () => {
    setUserToEdit(selectedUser)
    setShowEditModal(true)
    setSelectedUser(null) // Close detail modal
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setUserToEdit(null)
  }

  const handleDeleteClick = () => {
    setUserToDelete(selectedUser)
    setShowDeleteConfirm(true)
    setSelectedUser(null) // Close detail modal
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    
    try {
      setLoading(true)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      // Get the correct admin_id - prioritize adminId from API response
      const adminIdToDelete = userToDelete.adminId || userToDelete.id
      
      if (!adminIdToDelete) {
        console.error('Error: Cannot delete user - Admin ID not found')
        setLoading(false)
        setShowDeleteConfirm(false)
        setUserToDelete(null)
        return
      }
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: String(adminIdToDelete), // Ensure it's a string
        type: 'D',
        sub_type: 'D',
        name: userToDelete.name || '',
        mobile_no: userToDelete.phoneNumber || userToDelete.phone || userToDelete.mobile_no || '',
        photo: userToDelete.profileImage || userToDelete.photo || '',
        base64: '',
        idcard_no: userToDelete.idcard_no || '',
        booth_javabdari: userToDelete.boothNumbers && userToDelete.boothNumbers.length > 0 
          ? userToDelete.boothNumbers.join(',') 
          : '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }
      
      console.log('Deleting call survey user:', {
        userToDelete,
        adminIdToDelete,
        payload
      })
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh the list
      await refreshList()
      
      setShowDeleteConfirm(false)
      setUserToDelete(null)
    } catch (err) {
      console.error('Failed to delete call survey user:', err)
      // Error is logged to console, no alert shown
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setUserToDelete(null)
  }

  const handleCreateUser = () => {
    setShowCreateModal(true)
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
    setNewUser({ name: '', phoneNumber: '', boothNumbers: [] })
  }

  const handleInputChange = (field, value) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBoothNumberChange = (value) => {
    // Convert comma-separated string to array of numbers
    const boothNumbers = value.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num))
    setNewUser(prev => ({
      ...prev,
      boothNumbers
    }))
  }

  const refreshList = async () => {
    try {
      setLoading(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
      const apiData = await apiService.displayCallCenter(panelApiUrl)
      const transformedData = apiData.map((user, index) => ({
        id: user.adminId || index + 1,
        adminId: user.adminId || user.id || null, // Store adminId separately for delete operation
        name: user.name || 'Unknown',
        phoneNumber: user.mobileNo || '',
        boothNumbers: user.boothNo ? user.boothNo.split(',').filter(booth => booth.trim() !== '').map(booth => parseInt(booth.trim())).filter(booth => !isNaN(booth)) : [],
        profileImage: user.photo || null,
        photoPath: user.photoPath || null,
        isPhoto: Boolean(user.photo && user.photo.trim() !== ''),
        lastLogin: user.lastLogin || null,
        type: user.type || 'CL'
      }))
      setUserData(transformedData)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = userData.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phoneNumber.includes(searchQuery) ||
    user.boothNumbers.some(booth => booth.toString().includes(searchQuery))
  )

  const totalUsers = userData.length

  const renderProfileImage = (user, size = 'w-12 h-12') => {
    // Check if we have a photo URL (either direct photo or photo_path)
    const photoUrl = user.photoPath || user.profileImage
    
    if (user.isPhoto && photoUrl) {
      return (
        <img
          src={photoUrl}
          alt={user.name}
          className={`${size} rounded-full object-cover border-2 border-blue-200`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )
    } else {
      // Generate initials from name
      const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CL'
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-200`}>
          <span className="text-white text-xs font-bold text-center leading-tight">
            {initials}
          </span>
        </div>
      )
    }
  }


  return (
    <div className={`relative w-screen h-screen overflow-hidden transition-all duration-700 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-100"></div>
      
      {/* Main Container with Flex Layout */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex-shrink-0 shadow-md" style={{backgroundColor: '#103a94'}}>
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h1 className="text-white text-base sm:text-lg font-semibold">कॉल सर्वे यूज़र</h1>
          </div>

          {/* Search Bar - Centered */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-10 bg-gray-100 rounded-lg border-0 focus:outline-none text-gray-800 placeholder-gray-500 text-sm sm:text-base"
              />
              <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}>
          <div className="min-h-full">
            <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading users...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <p className="text-red-600 font-medium mb-2">Error loading users</p>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : userData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <p className="text-gray-600 font-medium">No users found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search term</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  onClick={() => handleUserClick(user)}
                  className="bg-white rounded-xl p-3 sm:p-4 border transition-all cursor-pointer shadow-sm hover:shadow-md"
                  style={{borderColor: '#e6f0ff'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#103a94'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e6f0ff'
                    e.currentTarget.style.transform = 'translateY(0px)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      {/* Profile Image */}
                      {renderProfileImage(user, 'w-10 h-10 sm:w-12 sm:h-12')}
                      
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-gray-900 font-semibold text-sm sm:text-base">
                            {index + 1}. {user.name}
                          </h3>
                        </div>
                        <p className="text-blue-600 font-medium text-xs sm:text-sm mb-1 sm:mb-2">
                          {user.phoneNumber}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <span className="text-gray-700 text-xs sm:text-sm">बूथ नं. :</span>
                          <div className="flex flex-wrap gap-1">
                            {user.boothNumbers.map((boothNumber, idx) => (
                              <span
                                key={idx}
                                className="px-1 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium"
                              >
                                {`${boothNumber}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Call Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCall(user)
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                      style={{backgroundColor: '#103a94'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between flex-shrink-0 shadow-lg space-y-2 sm:space-y-0" style={{backgroundColor: '#103a94'}}>
          <div className="text-white">
            <span className="text-base sm:text-lg font-bold">टोटल : {totalUsers}</span>
          </div>
          
          <button 
            onClick={handleCreateUser}
            className="px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
            style={{backgroundColor: '#0d2f7a'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0a2563'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#0d2f7a'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-white text-xs sm:text-sm font-medium">कॉल सेन्टर यूज़र बनाए</span>
          </button>
        </div>

        {/* User Detail Modal */}
        <CallSurveyUserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onCall={handleCall}
          onEdit={handleEditUser}
          onDelete={handleDeleteClick}
        />
        <CreateCallSurveyUserModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onSuccess={refreshList}
          allUsers={userData}
        />
        <EditCallSurveyUserModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSuccess={refreshList}
          user={userToEdit}
          allUsers={userData}
        />
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          admin={userToDelete}
        />
      </div>
      
      {/* Custom CSS for Scrollbar */}
      <style>{`
        /* Custom Scrollbar Styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  )
}

export default CallSurveyUser
