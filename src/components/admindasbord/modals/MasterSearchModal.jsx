import React, { useState } from 'react'
import { ADMIN_AUTH_CONFIG } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

// FormCard component defined outside to prevent recreation on each render
const FormCard = ({ onCloseOnly, searchData, handleInputChange, handleSubmit, isSearching }) => (
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
    {/* Modal Header - Dark Blue Background */}
    <div className="p-4 rounded-t-2xl" style={{backgroundColor: '#103a94'}}>
      <div className="flex items-center justify-between">
        <button
          onClick={onCloseOnly}
          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-white text-lg font-semibold">मास्टर सर्च</h2>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>
    </div>

    {/* Modal Content */}
    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
      {/* Name Field */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#103a94' }}>
          नाम
        </label>
        <input
          type="text"
          value={searchData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="नाम यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white text-sm sm:text-base"
        />
      </div>

      {/* Father/Husband Name Field */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#103a94' }}>
          पिता/पति का नाम
        </label>
        <input
          type="text"
          value={searchData.fatherHusbandName}
          onChange={(e) => handleInputChange('fatherHusbandName', e.target.value)}
          placeholder="पिता/पति का नाम यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white text-sm sm:text-base"
        />
      </div>

      {/* Surname Field */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#103a94' }}>
          सरनेम
        </label>
        <input
          type="text"
          value={searchData.surname}
          onChange={(e) => handleInputChange('surname', e.target.value)}
          placeholder="सरनेम यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white text-sm sm:text-base"
        />
      </div>

      {/* Mobile Number Field */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#103a94' }}>
          मोबाइल नंबर
        </label>
        <input
          type="tel"
          value={searchData.mobileNumber}
          onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
          placeholder="मोबाइल नंबर यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white text-sm sm:text-base"
        />
      </div>

      {/* Voter ID Number Field */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#103a94' }}>
          वोटर आईडी नंबर
        </label>
        <input
          type="text"
          value={searchData.voterIdNumber}
          onChange={(e) => handleInputChange('voterIdNumber', e.target.value)}
          placeholder="वोटर आईडी यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white text-sm sm:text-base"
        />
      </div>
    </div>

    {/* Action Buttons - Side by Side */}
    <div className="flex">
      <button
        onClick={onCloseOnly}
        className="flex-1 px-4 py-3 text-sm sm:text-base text-white font-semibold rounded-bl-2xl transition-colors"
        style={{backgroundColor: '#103a94'}}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0d2f7a'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#103a94'}
      >
        रद करे
      </button>
      <div className="w-px bg-gray-300"></div>
      <button
        onClick={handleSubmit}
        className="flex-1 px-4 py-3 text-sm sm:text-base text-white font-semibold rounded-br-2xl transition-colors"
        style={{backgroundColor: '#103a94'}}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#0d2f7a'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#103a94'}
      >
        सर्च
      </button>
    </div>

    {isSearching && (
      <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-gray-700 font-medium">सर्च हो रहा है...</div>
        </div>
      </div>
    )}
  </div>
)

const MasterSearchModal = ({ isOpen, onClose, onSearch }) => {
  const [searchData, setSearchData] = useState({
    name: '',
    fatherHusbandName: '',
    surname: '',
    mobileNumber: '',
    voterIdNumber: ''
  })

  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFormOverlay, setShowFormOverlay] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [resultSearchQuery, setResultSearchQuery] = useState('')

  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClose = () => {
    // Reset form and states
    setSearchData({
      name: '',
      fatherHusbandName: '',
      surname: '',
      mobileNumber: '',
      voterIdNumber: ''
    })
    setResults([])
    setError(null)
    setShowResults(false)
    setShowFormOverlay(false)
    onClose()
  }

  const handleSubmit = async () => {
    // Call the search handler with search data
    if (onSearch) {
      onSearch(searchData)
    }
    
    setIsSearching(true)
    setError(null)
    const isFromOverlay = showFormOverlay
    
    try {
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://tmc14.mhbjplok.com'
      
      // Build SOAP request body
      const soapBody = `<master_search xmlns="http://tempuri.org/">
      <f_name>${searchData.name || ''}</f_name>
      <m_name>${searchData.fatherHusbandName || ''}</m_name>
      <surname>${searchData.surname || ''}</surname>
      <mobile_no>${searchData.mobileNumber || ''}</mobile_no>
      <id_card_no>${searchData.voterIdNumber || ''}</id_card_no>
      <house_no></house_no>
    </master_search>`

      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthUser xmlns="http://tempuri.org/">
      <UserName>${ADMIN_AUTH_CONFIG.USERNAME}</UserName>
      <Password>${ADMIN_AUTH_CONFIG.PASSWORD}</Password>
      <Token>${ADMIN_AUTH_CONFIG.TOKEN}</Token>
    </AuthUser>
  </soap:Header>
  <soap:Body>
    ${soapBody}
  </soap:Body>
</soap:Envelope>`

      // Use proxy in development
      const endpoint = import.meta.env.DEV 
        ? '/panel-api/webservice.asmx' 
        : `${panelApiUrl}/webservice.asmx`

      console.log('Master Search API call:', endpoint)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://tempuri.org/master_search'
        },
        body: soapEnvelope
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const xmlText = await response.text()
      console.log('Master Search API response:', xmlText)
      
      // Parse XML response
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      
      // Extract JSON string from XML
      const resultNode = xmlDoc.getElementsByTagName('master_searchResult')[0]
      
      if (!resultNode || !resultNode.textContent) {
        throw new Error('No data returned from API')
      }

      // Parse the JSON string
      let jsonData
      try {
        jsonData = JSON.parse(resultNode.textContent)
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw text:', resultNode.textContent)
        throw new Error('Invalid JSON response from API')
      }
      
      console.log('Master Search parsed data:', jsonData)
      console.log('Success value:', jsonData.Success)
      console.log('Result array:', jsonData.result)
      
      // Handle response - check for Success and result array
      if (jsonData && (jsonData.Success === "1" || jsonData.Success === 1) && jsonData.result && Array.isArray(jsonData.result)) {
        // Transform API response to component's expected format
        const transformedData = jsonData.result.map((voter, index) => ({
          id: voter.id || index + 1,
          name: `${voter.eng_f_name || ''} ${voter.eng_surname || ''}`.trim(),
          fatherHusbandName: `${voter.eng_m_name || ''} ${voter.f_eng_surname || ''}`.trim(),
          address: voter.eng_localityid || '',
          serialNumber: voter.slnoinpart || '',
          mobileNumber: voter.contact_no || '-',
          idCardNumber: voter.idcard_no || '',
          boothNumber: voter.part_no || '',
          houseNumber: voter.eng_house_no || '',
          pollingStation: voter.eng_polling_location || ''
        }))
        
        console.log('Transformed results count:', transformedData.length)
        console.log('Transformed results:', transformedData)
        setResults(transformedData)
        setShowResults(true)
        setError(null)
        setResultSearchQuery('')
        console.log('Results state set, showResults:', true)
      } else {
        // No results found
        console.log('No results in response:', jsonData)
        setResults([])
        setShowResults(true)
        setError(null)
        setResultSearchQuery('')
      }
      
      // Close overlay if search was triggered from overlay form
      if (isFromOverlay) {
        setShowFormOverlay(false)
      }
    } catch (err) {
      console.error('Error fetching master search data:', err)
      setError(err.message || 'Failed to load search results')
      setResults([])
      setShowResults(true) // Show results view even on error
      setResultSearchQuery('')
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultCall = (phoneNumber) => {
    if (phoneNumber && phoneNumber !== '-') {
      window.open(`tel:${phoneNumber}`, '_self')
    }
  }

  const handleResultCheck = (voter) => {
    console.log('Check voter (master search):', voter)
    // TODO: Hook with survey/check workflow once implemented
  }

  const handleResultFamily = (voter) => {
    console.log('Family view (master search):', voter)
    // TODO: Navigate to family details once API/UI ready
  }

  if (!isOpen) return null

  const filteredResults = resultSearchQuery.trim()
    ? results.filter(result => {
        const query = resultSearchQuery.trim().toLowerCase()
        return [
          result.name,
          result.fatherHusbandName,
          result.address,
          result.serialNumber,
          result.mobileNumber,
          result.idCardNumber,
          result.boothNumber,
          result.houseNumber,
          result.pollingStation
        ]
          .filter(Boolean)
          .some(value => value.toString().toLowerCase().includes(query))
      })
    : results

  const hasBaseResults = results.length > 0

  // Results view
  if (showResults) {
    return (
      <div className="fixed inset-0 z-[9999]">
        <div className="bg-white w-full h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-md" style={{ backgroundColor: '#102463' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
              >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                
                <h1 className="text-white text-base sm:text-lg font-semibold">मास्टर सर्च</h1>
              </div>
              
              <div className="search-box">
                <input
                  type="text"
                  placeholder="सर्च रिज़ल्ट"
                  value={resultSearchQuery}
                  onChange={(e) => setResultSearchQuery(e.target.value)}
                />
                <button
                  type="reset"
                  onClick={() => setResultSearchQuery('')}
                />
              </div>
            </div>
          </div>

          {/* Summary Bar */}
          <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#e5e8ff' }}>
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="px-2 py-1 rounded-lg inline-block">
                <span className="text-sm font-bold" style={{ color: '#102463' }}>
                  टोटल : {results.length}
                </span>
              </div>
              <button
                onClick={() => setShowFormOverlay(true)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-white font-semibold rounded-lg sm:rounded-xl shadow-sm transition-all text-xs sm:text-sm"
                style={{ backgroundColor: '#0f276d' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0c2059')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f276d')}
              >
                फिर से सर्च कीजिए
              </button>
            </div>
          </div>

          {/* Results list */}
          <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: '#e5e8ff' }}>
            {error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <p className="text-red-600 font-medium mb-2">Error loading search results</p>
                  <p className="text-gray-600 text-sm mb-4">{error}</p>
                  <button 
                    onClick={() => setShowFormOverlay(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : !hasBaseResults ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 font-medium">No results found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
                </div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 text-5xl mb-4">🔄</div>
                  <p className="text-gray-600 font-medium">No matches in filtered results</p>
                  <p className="text-gray-500 text-sm">Reset या अलग सर्च शब्द का प्रयोग करें</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredResults.map((voter, idx) => (
                  <div key={voter.id} className="bg-white rounded-xl border border-gray-300 p-4 h-full flex flex-col">
                    <div className="text-base font-extrabold tracking-wide mb-3">{idx + 1}.&nbsp;&nbsp;{voter.name}</div>

                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm flex-1">
                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पिता/पति:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.fatherHusbandName || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पता:</span>
                        <div className="flex-1 min-w-0 flex items-start gap-1 sm:gap-2">
                          <span className="text-gray-900 break-words flex-1">{voter.address || '-'}</span>
                          <button className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">क्रमांक:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.serialNumber || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मोबाइल:</span>
                        <div className="flex items-center min-w-0">
                          <span className="text-gray-900 truncate">{voter.mobileNumber || '-'}</span>
                          <button className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-500 rounded flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">पहचान पत्र नं.:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.idCardNumber || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">बूथ नं:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.boothNumber || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">घर नं:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.houseNumber || '-'}</span>
                      </div>

                      <div className="flex flex-wrap gap-x-2">
                        <span className="font-medium text-gray-700 w-20 sm:w-24 flex-shrink-0">मतदान स्थान:</span>
                        <span className="text-gray-900 break-words flex-1 min-w-0">{voter.pollingStation || '-'}</span>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-4 flex justify-center space-x-1 sm:space-x-2 flex-wrap gap-1 sm:gap-0 pt-2 sm:pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleResultCall(voter.mobileNumber)}
                        className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                        type="button"
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
                        <span className="text-[10px] sm:text-xs text-gray-600">Call</span>
                      </button>

                      <button
                        onClick={() => handleResultCheck(voter)}
                        className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                        type="button"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-600">Check</span>
                      </button>

                      <button
                        onClick={() => handleResultFamily(voter)}
                        className="flex flex-col items-center space-y-0.5 sm:space-y-1"
                        type="button"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5c-.47-.62-1.21-.99-2.01-.99H9.46c-.8 0-1.54.37-2.01.99L6 10.5c-.47-.62-1.21-.99-2.01-.99H2.46c-.8 0-1.54.37-2.01.99L0 10.5v7.5h2v6h2v-6h2v6h2v-6h2v6h2v-6h2v6h2z" />
                          </svg>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-600">Family</span>
                      </button>
                  </div>
                </div>
                ))}
              </div>
            )}
          </div>

          {showFormOverlay && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
              <FormCard 
                onCloseOnly={() => setShowFormOverlay(false)}
                searchData={searchData}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isSearching={isSearching}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Modal view
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <FormCard 
        onCloseOnly={handleClose}
        searchData={searchData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isSearching={isSearching}
      />
    </div>
  )
}

export default MasterSearchModal

