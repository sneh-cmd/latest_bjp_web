import React, { useState, useEffect } from 'react'
import { displayBuildingPramukh, apiService } from '../../../apidata.jsx'
import AddBuildingPramukhModal from '../modals/AddBuildingPramukhModal.jsx'
import BuildingPramukhDetailModal from '../modals/BuildingPramukhDetailModal.jsx'
import EditBuildingPramukhModal from '../modals/EditBuildingPramukhModal.jsx'
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const BuildingPramukh = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [buildingData, setBuildingData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCards, setExpandedCards] = useState(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [buildingToEdit, setBuildingToEdit] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [buildingToDelete, setBuildingToDelete] = useState(null)

  const [summary, setSummary] = useState({ total_address: 0, matched_address: 0 })

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Function to fetch building pramukh data
  const fetchBuildingPramukh = async () => {
    try {
      setLoading(true)
      setError(null)

      const resp = await displayBuildingPramukh()
      setBuildingData(resp.list || [])
      setSummary(resp.summary || { total_address: 0, matched_address: 0 })
      setLoading(false)
    } catch (err) {
      console.error('Error loading building data:', err)
      setError(err.message || 'Failed to load building data')
      setLoading(false)
    }
  }

  // Load building data
  useEffect(() => {
    fetchBuildingPramukh()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleCall = (building) => {
    if (building.phoneNumber) {
      window.open(`tel:${building.phoneNumber}`, '_self')
    }
  }

  const handleMoreOptions = (building) => {
    setSelectedBuilding(building)
    setShowDetailModal(true)
  }

  const handleEdit = (building) => {
    setBuildingToEdit(building)
    setShowEditModal(true)
    setShowDetailModal(false)
  }

  const handleDelete = (building) => {
    setBuildingToDelete(building)
    setShowDeleteConfirm(true)
    setShowDetailModal(false)
  }

  const handleDeleteConfirm = async () => {
    if (!buildingToDelete) return
    
    try {
      setLoading(true)
      
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      // Prepare payload for delete using update_admin with type="D" and sub_type="D"
      const payload = {
        admin_id: buildingToDelete.id || buildingToDelete.adminId,
        type: 'D',
        sub_type: 'D',
        name: buildingToDelete.name || '',
        mobile_no: buildingToDelete.phoneNumber || buildingToDelete.mobileNo || '',
        photo: buildingToDelete.profileImage || buildingToDelete.photoPath || '',
        base64: '',
        idcard_no: '',
        booth_javabdari: '0',
        page_javabdari: '',
        add: buildingToDelete.addresses && buildingToDelete.addresses.length > 0
          ? buildingToDelete.addresses.join('%') + '%'
          : '',
        modify_by: userData?.admin?.adminId || userData?.admin?.id || '1'
      }
      
      // Call the update_admin API with delete flags
      await apiService.updateAdmin(payload, panelApiUrl)
      
      // Refresh the list
      await fetchBuildingPramukh()
      
      setShowDeleteConfirm(false)
      setBuildingToDelete(null)
    } catch (err) {
      console.error('Failed to delete building pramukh:', err)
      alert(err.message || 'Failed to delete building pramukh')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setBuildingToDelete(null)
  }

  const handleEditSuccess = async () => {
    await fetchBuildingPramukh()
    setShowEditModal(false)
    setBuildingToEdit(null)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setBuildingToEdit(null)
  }

  const handleToggleStatus = (buildingId) => {
    // TODO: Implement toggle status functionality
    console.log('Toggle status for building:', buildingId)
    // Refresh the list after status change
    fetchBuildingPramukh()
    setShowDetailModal(false)
  }

  const handleCardClick = (building) => {
    navigate(`/building-detail?buildingId=${building.id}`, { buildingData: building })
  }

  const toggleAddressExpansion = (buildingId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(buildingId)) {
        newSet.delete(buildingId)
      } else {
        newSet.add(buildingId)
      }
      return newSet
    })
  }

  const filteredBuildings = buildingData.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.addresses.some(addr => addr.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const totalAddresses = summary.total_address
  const totalPramukhs = buildingData.length
  const remainingAddresses = Math.max(0, summary.total_address - summary.matched_address)
  
  const handleSaveNew = async (data) => {
    console.log('New Building Pramukh saved:', data)
    // Refresh the building pramukh list
    await fetchBuildingPramukh()
    setShowAddModal(false)
  }

  const renderProfileImage = (building, size = 'w-12 h-12') => {
    if (building.profileImage) {
      return (
        <img
          src={building.profileImage}
          alt={building.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )
    } else {
      // Generate initials from name
      const initials = building.name ? building.name.charAt(0).toUpperCase() : 'B'
      return (
        <div className={`${size} rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center border-2 border-gray-200`}>
          <span className="text-white text-sm font-bold">
            {initials}
          </span>
        </div>
      )
    }
  }

  return (
    <>
    <div className={`relative w-screen h-screen overflow-hidden transition-all duration-700 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50"></div>
      
      {/* Main Container */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <div className="px-4 py-4 flex-shrink-0 shadow-md" style={{backgroundColor: '#102463'}}>
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h1 className="text-white text-lg font-semibold">बिल्डिंग प्रमुख</h1>
            
            <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="px-4 py-4 flex-shrink-0">
          <div className="flex justify-center space-x-4">
            <div className="bg-white rounded-lg p-3 shadow-sm text-center min-w-[80px]">
              <div className="text-lg font-bold text-gray-800">473</div>
              <div className="text-xs text-gray-600">पता</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm text-center min-w-[80px]">
              <div className="text-lg font-bold text-gray-800">3</div>
              <div className="text-xs text-gray-600">प्रमुख</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm text-center min-w-[80px]">
              <div className="text-lg font-bold text-gray-800">457</div>
              <div className="text-xs text-gray-600">बाकी पता</div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6',
          backgroundColor: '#e5e8ff'
        }}>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 font-medium">Loading building pramukhs...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <p className="text-red-600 font-medium mb-2">Error loading data</p>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                </div>
              </div>
            ) : filteredBuildings.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">🏢</div>
                  <p className="text-gray-600 font-medium">No building pramukhs found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search term</p>
                </div>
              </div>
            ) : (
              filteredBuildings.map((building, index) => (
                <div key={building.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-pointer" onClick={() => handleCardClick(building)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Profile Image */}
                      {renderProfileImage(building, 'w-12 h-12')}
                      
                      {/* Building Info */}
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-bold text-base">
                          {index + 1}. {building.name}
                        </h3>
                        
                        {/* Address Count */}
                        <div className="flex items-center space-x-2 mb-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleAddressExpansion(building.id) }}
                            className="text-blue-600 font-medium text-sm hover:text-blue-800 transition-colors"
                          >
                            पता : {building.addressCount}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleAddressExpansion(building.id) }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {expandedCards.has(building.id) ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 14l5-5 5 5z"/>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 10l5 5 5-5z"/>
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        {/* Voter Count */}
                        <p className="text-gray-800 text-sm">
                          मतदाता : {building.voters}
                        </p>
                        
                        {/* Expanded Address Details */}
                        {expandedCards.has(building.id) && (
                          <div className="mt-2 space-y-1">
                            {building.addresses.map((address, addrIndex) => (
                              <p key={addrIndex} className="text-gray-600 text-xs leading-relaxed">
                                {address}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCall(building) }}
                        className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                      </button>
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoreOptions(building) }}
                        className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </button>
                      
                      <button
                        className={`px-3 py-1 rounded text-xs font-medium text-white ${
                          building.last_login && building.last_login.trim() !== ''
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-red-500 hover:bg-red-600'
                        } transition-colors`}
                      >
                        {building.last_login && building.last_login.trim() !== '' ? 'Active' : 'inactive'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 flex-shrink-0 shadow-lg" style={{backgroundColor: '#102463'}}>
          <div className="flex items-center justify-between">
            <div className="bg-black rounded px-3 py-2">
              <span className="text-white text-sm font-medium">टोटल : {totalPramukhs}</span>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-black rounded px-4 py-2 flex items-center space-x-2 hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span className="text-white text-sm font-medium">बिल्डिंग प्रमुख बनाए</span>
            </button>
          </div>
        </div>

      </div>
      
      {/* Custom CSS for Scrollbar */}
      <style>{`
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
      
      {/* Add Building Pramukh Modal */}
      <AddBuildingPramukhModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveNew}
      />
    </div>

    {/* Building Pramukh Detail Modal */}
    {showDetailModal && (
      <BuildingPramukhDetailModal
        building={selectedBuilding}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedBuilding(null)
        }}
        onCall={handleCall}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    )}

    {/* Edit Building Pramukh Modal */}
    <EditBuildingPramukhModal
      isOpen={showEditModal}
      onClose={handleCloseEditModal}
      onSuccess={handleEditSuccess}
      building={buildingToEdit}
    />

    {/* Delete Confirmation Modal */}
    <DeleteConfirmationModal
      isOpen={showDeleteConfirm}
      onClose={handleDeleteCancel}
      onConfirm={handleDeleteConfirm}
      admin={buildingToDelete}
    />
    </>
  )
}

export default BuildingPramukh
