import React, { useState, useEffect } from 'react'
import apiService from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import PageHeader from '../common/PageHeader.jsx'
import * as XLSX from 'xlsx-js-style'

const AllUsersList = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrganization, setSelectedOrganization] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch all users data from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'
        
        console.log('Fetching all users from:', panelApiUrl)
        
        const usersData = await apiService.displayAllAdmin(panelApiUrl)
        console.log('Fetched users data:', usersData)
        
        setUsers(usersData || [])
        setFilteredUsers(usersData || [])
      } catch (err) {
        console.error('Error fetching users:', err)
        setError(err.message || 'Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Filter users based on search, organization, and status
  useEffect(() => {
    let filtered = [...users]

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.mobile_no?.includes(searchQuery)
      )
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => {
        const isActive = user.temp_status === true || user.temp_status === 'true'
        return selectedStatus === 'active' ? isActive : !isActive
      })
    }

    setFilteredUsers(filtered)
  }, [searchQuery, selectedStatus, selectedOrganization, users])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => {
      navigate('/admin')
    }, 300)
  }

  const handleCall = (mobileNo) => {
    if (mobileNo) {
      window.open(`tel:${mobileNo}`, '_self')
    }
  }

  const toggleStatus = async (userId) => {
    try {
      setLoading(true)
      const user = users.find(u => u.admin_id === userId)
      if (!user) return

      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com/webservice.asmx'

      // Toggle status
      const newStatus = !user.temp_status
      
      // Update admin with new status
      const payload = {
        admin_id: user.admin_id,
        type: user.type || 'A',
        sub_type: user.sub_type || 'A',
        name: user.name || '',
        mobile_no: user.mobile_no || '',
        photo: user.photo_path || '',
        base64: '',
        idcard_no: '',
        booth_javabdari: user.booth_javabdari || '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }

      // Note: You may need to add an update API call here if available
      // For now, we'll update locally
      const updatedUsers = users.map(u =>
        u.admin_id === userId ? { ...u, temp_status: newStatus } : u
      )
      setUsers(updatedUsers)
    } catch (err) {
      console.error('Error toggling status:', err)
      alert('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    try {
      if (filteredUsers.length === 0) {
        alert('No data to export')
        return
      }

      const excelData = filteredUsers.map((user, index) => ({
        'Sr. No.': index + 1,
        'Name': user.name || '',
        'Phone Number': user.mobile_no || '',
        'Designation': user.designation || '',
        'Status': user.temp_status ? 'Active' : 'Not Active',
        'Last Login': user.last_login || ''
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([])
      const title = 'All Users'
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
      ws['!merges'] = ws['!merges'] || []
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } })
      ws['A1'].s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }

      const headers = [['Sr. No.', 'Name', 'Phone Number', 'Designation', 'Status', 'Last Login']]
      XLSX.utils.sheet_add_aoa(ws, headers, { origin: 'A2' })
      headers[0].forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: 1, c: colIndex })
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4472C4' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          }
        }
      })
      XLSX.utils.sheet_add_json(ws, excelData, { origin: 'A3', skipHeader: true })
      
      const colWidths = [
        { wch: 8 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
        { wch: 20 }
      ]
      ws['!cols'] = colWidths
      
      XLSX.utils.book_append_sheet(wb, ws, 'All Users')
      const fileName = `All_Users_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className={`relative w-full h-screen overflow-y-auto scroll-smooth transition-all duration-700 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`} style={{ backgroundColor: '#e5e8ff' }}>
      {/* Background */}
      <div className="fixed inset-0 -z-10" style={{ backgroundColor: '#e5e8ff' }}></div>

      {/* Header */}
      <PageHeader
        title="सभी यूजर"
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      {/* Filter Section */}
      <div className="bg-gray-100 border-b border-gray-200 px-2 sm:px-4 py-2">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Organization Filter */}
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setSelectedOrganization('all')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span>संगठन</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-300"></div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setSelectedStatus('all')}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <span>STATUS</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-2 sm:px-4 py-3 sm:py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">लोड हो रहा है...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-600 text-sm sm:text-base">{error}</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-600 text-sm sm:text-base">कोई यूजर नहीं मिला</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredUsers.map((user, index) => {
              const isActive = user.temp_status === true || user.temp_status === 'true'
              return (
                <div
                  key={user.admin_id}
                  className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      {user.photo_path ? (
                        <img
                          src={user.photo_path}
                          alt={user.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base ${
                          user.photo_path ? 'hidden' : 'flex'
                        }`}
                        style={{ backgroundColor: '#d4a574' }}
                      >
                        {getInitials(user.name)}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          {index + 1}.
                        </span>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-800 truncate">
                          {user.name || 'N/A'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {user.mobile_no || 'N/A'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {user.designation || 'एडमिन'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      {/* Phone Icon */}
                      <button
                        onClick={() => handleCall(user.mobile_no)}
                        className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </button>

                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleStatus(user.admin_id)}
                        className={`relative w-12 h-6 sm:w-14 sm:h-7 rounded-full transition-colors ${
                          isActive ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full transition-transform ${
                            isActive ? 'transform translate-x-6 sm:translate-x-7' : ''
                          }`}
                        ></span>
                      </button>

                      {/* Status Badge */}
                      <div
                        className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-semibold ${
                          isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isActive ? 'Active' : 'Not Active'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between shadow-lg z-10">
        <div className="bg-white rounded-lg px-3 sm:px-4 py-1.5 sm:py-2">
          <span className="text-xs sm:text-sm font-semibold text-gray-800">
            टोटल : {filteredUsers.length}
          </span>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">XLS</span>
        </button>
      </div>

      {/* Bottom padding for footer */}
      <div className="h-16 sm:h-20"></div>
    </div>
  )
}

export default AllUsersList

