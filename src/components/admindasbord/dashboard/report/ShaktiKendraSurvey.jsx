import React, { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx-js-style'
import { displayTypeWiseUserListFromSurvey, noSurveyUserByType } from '../../../../apidata'
import UnsurveyedLeadersModal from '../../modals/UnsurveyedLeadersModal.jsx'
import PageHeader from '../../common/PageHeader.jsx'

const ShaktiKendraSurvey = ({ navigation }) => {
  const { navigate } = navigation
  const [searchQuery, setSearchQuery] = useState('')
  const [surveyData, setSurveyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUnsurveyedModal, setShowUnsurveyedModal] = useState(false)
  const [showFileOptions, setShowFileOptions] = useState(false)
  const [unsurveyedData, setUnsurveyedData] = useState([])
  const [unsurveyedLoading, setUnsurveyedLoading] = useState(false)
  const [unsurveyedError, setUnsurveyedError] = useState(null)
  const [showUnsurveyedSearch, setShowUnsurveyedSearch] = useState(false)
  const [unsurveyedSearchQuery, setUnsurveyedSearchQuery] = useState('')
  
  // Fetch survey data from API
  const fetchSurveyData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // survey_by_type: "sp" for Shakti Kendra
      const data = await displayTypeWiseUserListFromSurvey('sp', '')
      
      console.log('Shakti Kendra Survey Data:', data)
      setSurveyData(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching Shakti Kendra survey data:', err)
      setError(err.message || 'Failed to fetch survey data')
      setSurveyData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSurveyData()
  }, [fetchSurveyData])

  const handleBack = () => {
    navigate('/cadre-survey-report')
  }

  const handleCardClick = (item) => {
    // Navigate to detail slide with category data
    console.log('Navigating to ShaktiDetailSlide with item:', item)
    navigate('/shakti-detail-slide', {
      categoryData: item
    })
  }

  // Filter data based on search query
  const filteredData = surveyData.filter(item => { 
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.name.toLowerCase().includes(query) ||
      item.phone.includes(query)
    )
  })

  const totalCount = filteredData.length

  // Fetch unsurveyed data from API when modal opens
  const fetchUnsurveyedData = useCallback(async () => {
    try {
      setUnsurveyedLoading(true)
      setUnsurveyedError(null)
      
      // Fetch data from no_survey_user_by_type API with type="SP"
      const data = await noSurveyUserByType('SP')
      
      console.log('Unsurveyed Shakti Kendra Pramukh Data:', data)
      setUnsurveyedData(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching unsurveyed data:', err)
      setUnsurveyedError(err.message || 'Failed to fetch unsurveyed data')
      setUnsurveyedData([])
    } finally {
      setUnsurveyedLoading(false)
    }
  }, [])

  const handleUnsurveyedClick = () => {
    setShowUnsurveyedModal(true)
    // Fetch data when modal opens (always fetch to get latest data)
    fetchUnsurveyedData()
  }

  const handleCloseUnsurveyedModal = () => {
    setShowUnsurveyedModal(false)
    setShowFileOptions(false)
    setShowUnsurveyedSearch(false)
    setUnsurveyedSearchQuery('')
  }

  const handleUnsurveyedSearchToggle = () => {
    setShowUnsurveyedSearch(!showUnsurveyedSearch)
    if (showUnsurveyedSearch) {
      setUnsurveyedSearchQuery('')
    }
  }

  // Filter unsurveyed data based on search query
  const filteredUnsurveyedData = unsurveyedData.filter(item => {
    if (!unsurveyedSearchQuery.trim()) return true
    const query = unsurveyedSearchQuery.toLowerCase()
    return (
      item.name?.toLowerCase().includes(query) ||
      item.designation?.toLowerCase().includes(query) ||
      (item.phone || item.mobile_no || '').includes(query)
    )
  })

  const filteredUnsurveyedCount = filteredUnsurveyedData.length

  const handleExcelIconClick = () => {
    setShowFileOptions(true)
  }

  const handleCancelFileOptions = () => {
    setShowFileOptions(false)
  }

  const createExcelFile = () => {
    try {
      const dataToExport = unsurveyedSearchQuery ? filteredUnsurveyedData : unsurveyedData
      const rows = (dataToExport.length ? dataToExport : unsurveyedData).map((item, index) => ({
        'Sr. No.': index + 1,
        'Name': item.name || '',
        'Booth No.': item.booth_javabdari || '0',
        'Phone': item.phone || item.mobile_no || ''
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([])

      const title = 'सर्वे नहीं किए हुए शक्ति केन्द्र प्रमुख'
      const headers = [['Sr. No.', 'Name', 'Booth No.', 'Phone']]

      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' })
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers[0].length - 1 } }]
      ws['A1'] = { ...ws['A1'], s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } } }

      XLSX.utils.sheet_add_aoa(ws, headers, { origin: 'A2' })

      if (rows.length) {
        XLSX.utils.sheet_add_json(ws, rows, {
          origin: 'A3',
          skipHeader: true,
          header: headers[0]
        })
      }

      ws['!cols'] = [
        { wch: 8 },
        { wch: 30 },
        { wch: 18 },
        { wch: 18 }
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Unsurveyed Shakti')

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      return new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
    } catch (err) {
      console.error('Error creating Excel file:', err)
      return null
    }
  }

  // Open File Functionality
  const handleOpenFile = () => {
    try {
      const blob = createExcelFile()
      if (!blob) {
        alert('Failed to create file. Please try again.')
        return
      }

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      console.log('Excel file opened successfully')
    } catch (err) {
      console.error('Error opening file:', err)
      alert('Failed to open file. Please try again.')
    }
  }

  // Share File Functionality
  const handleShareFile = async () => {
    try {
      const blob = createExcelFile()
      if (!blob) {
        alert('Failed to create file. Please try again.')
        return
      }

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `सर्वे_नहीं_किए_हुए_प्रमुख_${new Date().toISOString().split('T')[0]}.xlsx`, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'सर्वे नहीं किए हुए प्रमुख',
            text: 'सर्वे नहीं किए हुए प्रमुखों की सूची',
            files: [file]
          })
          console.log('File shared successfully')
          return
        }
      }

      // Fallback: Download file
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `सर्वे_नहीं_किए_हुए_प्रमुख_${new Date().toISOString().split('T')[0]}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('File downloaded (fallback for share)')
    } catch (err) {
      console.error('Error sharing file:', err)
      alert('Failed to share file. Please try again.')
    }
  }

  return (
    <div 
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <PageHeader
        title="शक्ति केन्द्र प्रमुख - सर्वे"
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
            />

      {/* Summary Bar */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
          <div className="px-2 py-1 rounded-lg inline-block">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {totalCount}
            </span>
          </div>

          <button
            onClick={handleUnsurveyedClick}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-white font-semibold rounded-lg sm:rounded-xl shadow-sm transition-all text-xs sm:text-sm"
            style={{ backgroundColor: '#0f276d' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0c2059')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f276d')}
          >
            सर्वे नहीं किए हुए प्रमुख
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 pb-20 mb-7 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#102463' }}></div>
            <p className="mt-4 text-gray-600">डेटा लोड हो रहा है...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-8">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <p className="text-red-700 text-base sm:text-lg font-semibold mb-4">{error}</p>
            <button
              onClick={fetchSurveyData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              style={{ backgroundColor: '#102463' }}
            >
              पुनः प्रयास करें
            </button>
          </div>
        )}

        {/* Data Display */}
        {!loading && !error && (
          <>
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500 col-span-full">
                <p className="text-base sm:text-lg">कोई परिणाम नहीं मिला</p>
              </div>
            ) : (
              filteredData.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="bg-white rounded-lg sm:rounded-xl shadow-md w-full overflow-hidden relative cursor-pointer hover:shadow-lg transition-shadow duration-200"
                >
            {/* Left border indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2" style={{ backgroundColor: '#102463' }}></div>
            
            <div className="pl-2 sm:pl-5 pr-2 sm:pr-4 py-2 sm:py-4">
              {/* Top Section */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                {/* Left: User Icon and Info */}
                <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                  {/* User Icon */}
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4a574' }}>
                    <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  
                  {/* Name, Booth Number and Phone */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-lg md:text-xl font-bold text-gray-900 mb-0 sm:mb-1">
                      {item.name} {item.designation ? `(${item.designation})` : ''}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600">
                      बूथ नं. : {item.booth_javabdari || '0'}
                    </div>
                  </div>
                </div>

                 {/* Right: Total Survey */}
                 <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 ml-2">
                   <div className="flex items-baseline space-x-1.5">
                     <div className="text-xs sm:text-sm text-gray-600 leading-tight" style={{ color: '#8B4513' }}>टोटल सर्वे :</div>
                     <div className="text-base sm:text-lg md:text-xl font-bold text-gray-900 leading-tight">{item.totalSurvey || 0}</div>
                   </div>
                  {item.phone && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `tel:${item.phone}`
                      }}
                      className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                    >
                      <div
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
                        style={{ backgroundColor: '#103a94' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d2f7a')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#103a94')}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                    </button>
                  )}
                 </div>
              </div>

              {/* Bottom Section - Survey Breakdown */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
                {/* पॉजिटिव */}
                <div className="bg-green-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">पॉजिटिव</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#16a34a' }}>{item.positive}</div>
                </div>

                {/* नेगेटिव */}
                <div className="bg-red-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">नेगेटिव</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#dc2626' }}>{item.negative}</div>
                </div>

                {/* डाउटफुल */}
                <div className="bg-orange-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">डाउटफुल</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#ea580c' }}>{item.doubtful}</div>
                </div>

                {/* कुछ नहीं */}
                <div className="bg-blue-50 rounded-md sm:rounded-lg p-1.5 sm:p-3 text-center">
                  <div className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1">कुछ नहीं</div>
                  <div className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#2563eb' }}>{item.nothing}</div>
                </div>
              </div>
            </div>
          </div>
              ))
            )}
          </>
        )}
      </div>
      <UnsurveyedLeadersModal
        isOpen={showUnsurveyedModal}
        title="सर्वे नहीं किए हुए प्रमुख"
        onClose={handleCloseUnsurveyedModal}
        onSearchToggle={handleUnsurveyedSearchToggle}
        showSearch={showUnsurveyedSearch}
        searchQuery={unsurveyedSearchQuery}
        onSearchChange={setUnsurveyedSearchQuery}
        searchPlaceholder="नाम या फोन नंबर से खोजें..."
        loading={unsurveyedLoading}
        error={unsurveyedError}
        onRetry={fetchUnsurveyedData}
        filteredData={filteredUnsurveyedData}
        filteredCount={filteredUnsurveyedCount}
        overallCount={unsurveyedData.length}
        showFileOptions={showFileOptions}
        onExcelClick={handleExcelIconClick}
        onOpenFile={handleOpenFile}
        onShareFile={handleShareFile}
        onCancelFileOptions={handleCancelFileOptions}
      />
    </div>
  )
}

export default ShaktiKendraSurvey

