import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../common/PageHeader.jsx'
import { displayAllPhonebookMatchAdmin } from '../../../apidata.jsx'
import ContactActionModal from '../modals/ContactActionModal.jsx'
import * as XLSX from 'xlsx-js-style'

const TYPE_META = {
  A: { label: 'ऐडमिन', badge: 'bg-blue-100 text-blue-700' },
  S: { label: 'सब ऐडमिन', badge: 'bg-emerald-100 text-emerald-700' },
  V: { label: 'कार्यकर्ता', badge: 'bg-orange-100 text-orange-700' }
}

const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.result && Array.isArray(payload.result)) return payload.result
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  return []
}

const KaryakartaPhonebook = ({ navigation }) => {
  const { navigate } = navigation
  const [phonebookData, setPhonebookData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionContact, setActionContact] = useState(null)

  const fetchPhonebookData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await displayAllPhonebookMatchAdmin()
      const records = normalizeResponse(response).map((item, index) => ({
        id: item.admin_id || index,
        adminId: item.admin_id,
        name: item.name || 'N/A',
        mobile: item.mobile_no || '-',
        photo: item.photo_path || '',
        type: item.type || 'V',
        totalMembers: Number(item.total_phonebook_member) || 0
      }))
      setPhonebookData(records)
    } catch (err) {
      console.error('Error fetching phonebook data:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setPhonebookData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhonebookData()
  }, [fetchPhonebookData])

  const typeOptions = useMemo(() => {
    const uniqueTypes = new Set(phonebookData.map((item) => item.type).filter(Boolean))
    return ['all', ...uniqueTypes]
  }, [phonebookData])

  const filteredData = useMemo(() => {
    return phonebookData.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.mobile.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = selectedFilter === 'all' || item.type === selectedFilter

      return matchesSearch && matchesType
    })
  }, [phonebookData, searchQuery, selectedFilter])

  const totalMembers = useMemo(
    () => filteredData.reduce((acc, item) => acc + item.totalMembers, 0),
    [filteredData]
  )

  const handleBack = () => {
    navigate(-1)
  }

  const handleOpenMemberList = (admin) => {
    if (!admin) return
    const adminId = admin.adminId || admin.admin_id || admin.id
    if (!adminId) {
      setError('Admin ID उपलब्ध नहीं है')
      return
    }
    navigate('/karyakarta-phonebook-members', {
      admin: { ...admin, adminId }
    })
  }

  const handleOpenActions = (contact, event) => {
    event.stopPropagation()
    if (!contact?.mobile || contact.mobile === '-') return
    setActionContact(contact)
    setShowActionModal(true)
  }

  const handleActionSelect = (actionType) => {
    if (!actionContact?.mobile) return
    const mobile = actionContact.mobile
    if (actionType === 'call') {
      window.open(`tel:${mobile}`, '_self')
    } else if (actionType === 'whatsapp') {
      const phone = mobile.startsWith('+') ? mobile : `+91${mobile}`
      window.open(`https://wa.me/${phone.replace(/[^0-9+]/g, '')}`, '_blank')
    } else if (actionType === 'sms') {
      window.open(`sms:${mobile}`, '_self')
    }
    setShowActionModal(false)
  }

  const handleCloseActionModal = () => {
    setShowActionModal(false)
    setActionContact(null)
  }

  const handleExport = () => {
    try {
      // Use filteredData which already includes search and type filters
      if (filteredData.length === 0) {
        alert('No data to export')
        return
      }

      // Transform data to Excel format with headers
      const excelData = filteredData.map((item, index) => ({
        'Sr. No.': index + 1,
        'Name': item.name || '',
        'Mobile': item.mobile || '-',
        'Designation': TYPE_META[item.type]?.label || item.type || '',
        'Match Voter': item.totalMembers || 0
      }))

      // Create a new workbook
      const wb = XLSX.utils.book_new()
      
      // Create worksheet with title and headers
      const ws = XLSX.utils.aoa_to_sheet([])
      const title = 'कार्यकर्ता की फोनबुक'
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
      ws['!merges'] = ws['!merges'] || []
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } })
      ws['A1'].s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }

      const headers = [['Sr. No.', 'Name', 'Mobile', 'Designation', 'Match Voter']]
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
       
      // Set column widths for better readability
      const colWidths = [
        { wch: 8 },   // Sr. No.
        { wch: 25 },  // Name
        { wch: 15 },  // Mobile
        { wch: 15 },  // Designation
        { wch: 12 }   // Match Voter
      ]
      ws['!cols'] = colWidths
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Karyakarta Phonebook')
      
      // Generate Excel file and download
      const fileName = `Karyakarta_Phonebook_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      console.log('Export successful:', fileName)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const renderProfileImage = (item, size = 'w-12 h-12') => {
    if (item.photo) {
      return (
        <img
          src={item.photo}
          alt={item.name}
          className={`${size} rounded-full object-cover border-2 border-gray-200`}
        />
      )
    }

    const initials = (item.name || 'A')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase()

    return (
      <div
        className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-gray-200`}
      >
        <span className="text-white text-sm font-bold">{initials || 'A'}</span>
      </div>
    )
  }

  const renderCard = (item, index) => {
    const meta = TYPE_META[item.type] || TYPE_META.V

    return (
      <div
        key={`${item.id}-${index}`}
        onClick={() => handleOpenMemberList(item)}
        className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            {renderProfileImage(item, 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 truncate leading-tight">
              {index + 1}. {item.name}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-2 sm:gap-4 mt-2">
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] ${meta.badge}`}>
                {meta.label}
              </span>
              <span className="text-[11px] sm:text-xs text-gray-500">
                सदस्य :{item.totalMembers}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={(event) => handleOpenActions(item, event)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{backgroundColor: '#103a94'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden" style={{ backgroundColor: '#e5e8ff' }}>
      <PageHeader
        title="कार्यकर्ता की फोनबुक"
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      {/* Totals & Filter */}
      <div className="px-4 py-2 flex-shrink-0 border-b border-gray-200" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex w-full items-center justify-between gap-2 sm:gap-4 flex-nowrap overflow-visible">
          <div className="px-2 py-1 rounded-lg inline-block flex-shrink-0">
            <span className="text-xs sm:text-sm font-bold whitespace-nowrap" style={{ color: '#102463' }}>
              टोटल : {filteredData.length}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 relative flex-shrink-0 min-w-[180px] sm:min-w-[220px]">
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              className={`flex items-center justify-between gap-1 bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors w-full border-b-2 ${
                selectedFilter === 'all' && !filterOpen ? 'border-transparent' : 'border-[#102463]'
              }`}
              style={{ color: '#102463' }}
            >
              <span className="truncate">
                {selectedFilter === 'all'
                  ? 'कार्यकर्ता के अनुसार'
                  : TYPE_META[selectedFilter]?.label || 'कार्यकर्ता के अनुसार'}
              </span>
              <svg
                className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${filterOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {selectedFilter !== 'all' && (
              <button
                onClick={() => setSelectedFilter('all')}
                className="px-1.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-[#102463] hover:underline whitespace-nowrap flex-shrink-0"
                type="button"
              >
                Reset
              </button>
            )}
            {filterOpen && (
              <div className="absolute left-0 top-full mt-2 w-full sm:w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                {typeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(type)
                      setFilterOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                      selectedFilter === type ? 'text-blue-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {type === 'all' ? 'सभी' : TYPE_META[type]?.label || type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 sm:px-4 pb-6 space-y-3 sm:space-y-4">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 text-sm">डेटा लोड हो रहा है...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-red-100">
            <div className="text-red-500 text-3xl mb-2">⚠️</div>
            <p className="text-red-600 text-sm font-semibold mb-3">{error}</p>
            <button
              type="button"
              onClick={fetchPhonebookData}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {!loading && !error && filteredData.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center shadow border border-gray-100">
            <p className="text-gray-600 text-sm">कोई परिणाम नहीं मिला</p>
          </div>
        )}

        {!loading && !error && filteredData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredData.map((item, index) => renderCard(item, index))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex flex-row items-center justify-between flex-shrink-0 shadow-lg" style={{backgroundColor: '#102463'}}>
        <div className="px-1.5 sm:px-3 py-0.5 sm:py-2 rounded-lg" style={{backgroundColor: '#ffffff'}}>
          <div className="flex items-center space-x-2 sm:space-x-6" style={{color: '#102463'}}>
            <div className="text-center">
              <div className="text-[10px] sm:text-xs">सदस्य: {totalMembers}</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-row items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-semibold shadow-sm"
          >
            मेच बाकी
          </button>
          <button
            type="button"
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-semibold shadow-sm"
          >
            बूथ अनुसार
          </button>
          {/* Export Button */}
          <button 
            type="button"
            onClick={handleExport}
            className="w-auto px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center justify-center space-x-1 sm:space-x-2 transition-all shadow-sm hover:shadow-md"
            style={{backgroundColor: 'rgba(220, 38, 38, 0.87)'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(185, 28, 28, 0.85)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(220, 38, 38, 0.87)'}
          >
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1.8 18H6.2v-1.4h9.6V20zm0-2.8H6.2v-1.4h9.6v1.4zm0-2.8H6.2v-1.4h9.6v1.4zM13 9V3.5L18.5 9H13z"/>
              <path d="M9 12h6v1.5H9V12zm0 2.5h6V16H9v-1.5zm0 2.5h6V18.5H9V17z"/>
            </svg>
            <span className="text-white text-[10px] sm:text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      <ContactActionModal
        isOpen={showActionModal}
        onClose={handleCloseActionModal}
        onSelect={handleActionSelect}
      />
    </div>
  )
}

export default KaryakartaPhonebook


