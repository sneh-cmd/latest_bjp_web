import React, { useState, useEffect } from 'react'
import PageHeader from '../common/PageHeader.jsx'
import StarKaryakartaDetailModal from '../modals/StarKaryakartaDetailModal.jsx'
import { displayStarKarykarta } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const StarKaryakarta = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [karyakartaData, setKaryakartaData] = useState([])
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'list' or 'grid'
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch star karyakarta data from API
  useEffect(() => {
    const fetchStarKaryakarta = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = localStorageManager.getApiUrl()
        const data = await displayStarKarykarta(apiUrl)
        console.log('Star Karyakarta API response:', data)
        
        if (Array.isArray(data) && data.length > 0) {
          // Transform API data and add rank based on total_point
          const sortedData = data
            .sort((a, b) => b.total_point - a.total_point)
            .map((item, index) => ({
              id: item.id || item.admin_id,
              rank: index + 1,
              name: item.name,
              role: item.designation,
              points: item.total_point,
              avatar: item.image || null,
              mobile: item.mobile_no,
              stats: {
                survey: item.sr || 0,
                slip: item.s || 0,
                message: item.w || 0,
                photo: item.ip || 0,
                contactUpdate: item.c || 0,
                audio: item.ap || 0,
                video: item.vp || 0,
                selfie: item.tp || 0,
                call: item.mbc || 0,
                sms: item.shr || 0,
                print: item.ps || 0
              },
              panel: {
                name: 'पॅनेल',
                number: ''
              }
            }))
          setKaryakartaData(sortedData)
        } else {
          setKaryakartaData([])
        }
      } catch (err) {
        console.error('Error fetching Star Karyakarta data:', err)
        setError(err.message || 'Failed to load data')
        setKaryakartaData([])
      } finally {
        setLoading(false)
      }
    }

    fetchStarKaryakarta()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => navigate('/admin'), 300)
  }

  const handleCall = (person) => {
    // Handle call functionality
    console.log('Call:', person)
  }

  const handleCardClick = (person) => {
    setSelectedPerson(person)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedPerson(null), 300)
  }

  const filteredData = karyakartaData.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">लोड हो रहा है...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">त्रुटि</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            पुनः प्रयास करें
          </button>
        </div>
      </div>
    )
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = String(name).trim().split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase()
  }

  const renderProfileImage = (person, size = 'w-12 h-12') => {
    const initials = getInitials(person.name)
    
    return (
      <div className={`${size} rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm`}>
        {initials}
      </div>
    )
  }

  // List View Render
  const renderListView = () => (
    <div className="space-y-2 sm:space-y-3">
      {filteredData.map((person) => (
        <div
          key={person.id}
          className="bg-white rounded-lg overflow-hidden border transition-all"
          style={{ borderColor: '#e6f0ff' }}
        >
          {/* Points Badge at Top - Only visible on screens smaller than 640px */}
          <div className="block sm:hidden">
            <div className={`w-full ${person.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gray-200'} flex items-center`}>
              {/* Rank Badge Section */}
              <div className="flex items-center justify-center px-3 py-2 border-r-2" style={{ borderColor: person.rank === 1 ? '#d4af37' : '#999999' }}>
                <span className="text-white font-bold text-lg">
                  {person.rank}
                </span>
              </div>
              
              {/* Points Text Section */}
              <div className="flex-1 flex items-center justify-center gap-1 px-2 py-2">
                <span className={`${person.rank === 1 ? 'text-white' : 'text-dark'} font-bold text-xs`}>
                  टोटल पोईन्ट : {person.points}
                </span>
                {person.rank === 1 && (
                  <div className="w-5 h-5">
                    <img src="https://img.icons8.com/emoji/48/trophy-emoji.png" alt="trophy" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-2 md:p-4">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Avatar and Info */}
              <div className="flex flex-col items-center gap-1">
                {renderProfileImage(person, 'w-10 h-10 md:w-14 md:h-14')}
              </div>

              {/* Name and Role */}
              <div className="flex flex-col min-w-0">
                <h3 className="text-gray-900 font-semibold text-xs md:text-base truncate">
                  <span className="text-gray-500 text-xs md:text-sm font-medium">{person.rank}.</span>&nbsp;
                  {person.name}
                </h3>
                <p className="text-gray-600 text-xs md:text-sm truncate">
                  {person.role}
                </p>
              </div>

              {/* Points Badge (for rank 1) - Hidden on screens smaller than 640px */}
              {person.rank === 1 && (
                <div className="flex-shrink-0 hidden sm:block">
                  <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg px-2 py-1 md:px-3 md:py-2 flex items-center gap-1 md:gap-2 shadow-md">
                    <span className="text-white font-bold text-xs md:text-sm">टोटल पोईन्ट : {person.points}</span>
                    <div className="w-5 h-5 md:w-8 md:h-8">
                      <img src="https://img.icons8.com/emoji/48/trophy-emoji.png" alt="trophy" className="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>
              )}

              {/* Points Badge (for other ranks) - Hidden on screens smaller than 640px */}
              {person.rank !== 1 && (
                <div className="flex-shrink-0 hidden sm:block">
                  <div className="bg-gray-200 rounded-lg px-2 py-1 md:px-3 md:py-1.5">
                    <span className="text-gray-700 font-semibold text-xs md:text-sm">टोटल पोईन्ट : {person.points}</span>
                  </div>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1"></div>

              {/* Profile Section */}
              <div className="flex items-center gap-3">
                {/* Call Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCall(person)
                  }}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 flex-shrink-0"
                  style={{ backgroundColor: '#103a94' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d2f7a'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#103a94'}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Grid View Render
  const renderGridView = () => (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {filteredData.map((person) => (
        <div
          key={person.id}
          className="bg-white rounded-xl border transition-all duration-300 group hover:shadow-lg overflow-hidden cursor-pointer"
          style={{ borderColor: '#2424a53d' }}
          onClick={() => handleCardClick(person)}
        >
          {/* Points Badge at Top with Rank Badge */}
          <div className={`w-full ${person.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gray-200'} flex items-center rounded-t-xl`}>
            {/* Rank Badge Section */}
            <div className="flex items-center justify-center px-3 md:px-5 py-1.5 md:py-3 border-r-2" style={{ borderColor: person.rank === 1 ? '#d4af37' : '#999999' }}>
              <span className={`${person.rank === 1 ? 'text-white' : 'text-gray-700'} font-bold text-base md:text-2xl`}>
                {person.rank}
              </span>
            </div>
            
            {/* Points Text Section */}
            <div className="flex-1 flex items-center justify-center gap-1 md:gap-2 pr-2 md:pr-10">
              <span className={`${person.rank === 1 ? 'text-white' : 'text-gray-700'} font-bold text-xs md:text-sm`}>
                टोटल पोईन्ट : {person.points}
              </span>
              {person.rank === 1 && (
                <div className="w-4 h-4 md:w-6 md:h-6">
                  <img src="https://img.icons8.com/emoji/48/trophy-emoji.png" alt="trophy" className="w-full h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Card Content */}
          <div className="flex flex-col items-center space-y-1.5 md:space-y-3 p-2 md:p-4">
            {/* Avatar */}
            <div className="relative">
              {renderProfileImage(person, 'w-12 h-12 md:w-20 md:h-20')}
            </div>

            {/* Name and Role */}
            <div className="text-center w-full">
              <h3 className="font-bold text-xs md:text-base truncate transition-colors mb-0.5 md:mb-1" style={{ color: '#1a1a1a' }}>
                {person.name}
              </h3>
              <p className="text-xs md:text-sm mb-1 md:mb-2" style={{ color: '#4a5568' }}>
                {person.role}
              </p>
            </div>

            {/* Call Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCall(person)
              }}
              className="w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: '#103a94' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d2f7a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#103a94'}
            >
              <svg className="w-3.5 h-3.5 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
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
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">

        {/* Header */}
        <PageHeader
          title="स्टार कार्यकर्ता"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />

        {/* Filter/Summary Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Total count */}
              <div className="px-2 py-1 rounded-lg inline-block">
                <span className="text-sm font-bold" style={{ color: '#102463' }}>
                  टोटल : {filteredData.length}
                </span>
              </div>

            {/* View Mode Toggle and Total count */}
            <div className="flex items-center gap-2">
              {/* Filter dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white"
                style={{ color: '#102463' }}
              >
                <option value="all">कार्यकर्ता के अनुसार</option>
                <option value="admin">एडमिन</option>
                <option value="building">बिल्डिंग प्रमुख</option>
                <option value="shakti">शक्ति केंद्र प्रमुख</option>
              </select>
            </div>

              {/* View Mode Toggle */}
              <div className="rounded-lg p-1 flex" style={{ backgroundColor: '#102463' }}>
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
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-4" style={{ backgroundColor: '#e5e8ff' }}>
          {viewMode === 'list' && renderListView()}
          {viewMode === 'grid' && renderGridView()}
        </div>

        {/* Bottom Bar */}
        <div className="px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-end flex-shrink-0 shadow-lg" style={{ backgroundColor: '#102463' }}>
            {/* Export Button */}
          <button 
            // onClick={handleExport}
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
        </div>
      </div>

      {/* Star Karyakarta Detail Modal */}
      <StarKaryakartaDetailModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        person={selectedPerson}
      />
    </div>
  )
}

export default StarKaryakarta
