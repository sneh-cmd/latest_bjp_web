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
    <div className="p-6 space-y-4">
      {/* Name Field */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
          नाम
        </label>
        <input
          type="text"
          value={searchData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="नाम यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white"
        />
      </div>

      {/* Father/Husband Name Field */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
          पिता/पति का नाम
        </label>
        <input
          type="text"
          value={searchData.fatherHusbandName}
          onChange={(e) => handleInputChange('fatherHusbandName', e.target.value)}
          placeholder="पिता/पति का नाम यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white"
        />
      </div>

      {/* Surname Field */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
          सरनेम
        </label>
        <input
          type="text"
          value={searchData.surname}
          onChange={(e) => handleInputChange('surname', e.target.value)}
          placeholder="सरनेम यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white"
        />
      </div>

      {/* Mobile Number Field */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
          मोबाइल नंबर
        </label>
        <input
          type="tel"
          value={searchData.mobileNumber}
          onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
          placeholder="मोबाइल नंबर यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white"
        />
      </div>

      {/* Voter ID Number Field */}
      <div>
        <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
          वोटर आईडी नंबर
        </label>
        <input
          type="text"
          value={searchData.voterIdNumber}
          onChange={(e) => handleInputChange('voterIdNumber', e.target.value)}
          placeholder="वोटर आईडी यहाँ..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-gray-800 bg-white"
        />
      </div>
    </div>

    {/* Action Buttons - Side by Side */}
    <div className="flex">
      <button
        onClick={onCloseOnly}
        className="flex-1 px-4 py-3 border border-blue-600 text-blue-600 font-semibold rounded-bl-2xl transition-colors hover:bg-blue-50"
        style={{borderColor: '#103a94', color: '#103a94'}}
      >
        रद करे
      </button>
      <div className="w-px bg-gray-300"></div>
      <button
        onClick={handleSubmit}
        className="flex-1 px-4 py-3 text-white font-semibold rounded-br-2xl transition-colors"
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
        console.log('Results state set, showResults:', true)
      } else {
        // No results found
        console.log('No results in response:', jsonData)
        setResults([])
        setShowResults(true)
        setError(null)
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
    } finally {
      setIsSearching(false)
    }
  }

  if (!isOpen) return null

  // Results view
  if (showResults) {
    return (
      <div className="fixed inset-0 z-[9999]">
        <div className="bg-white w-full h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 flex-shrink-0" style={{backgroundColor: '#103a94'}}>
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-white text-lg font-semibold">मास्टर सर्च</h1>
              <div className="w-8"></div>
            </div>
          </div>

          {/* Search again button */}
          <div className="p-4 bg-white border-b border-gray-200">
            <button
              onClick={() => setShowFormOverlay(true)}
              className="w-full bg-indigo-100 text-indigo-900 font-semibold rounded-xl py-3 hover:bg-indigo-200 transition-colors"
            >
              फिर से सर्च कीजिए
            </button>
          </div>

          {/* Results list */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 font-medium">No results found</p>
                  <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
                </div>
              </div>
            ) : (
              results.map((voter, idx) => (
                <div key={voter.id} className="bg-white rounded-xl border border-gray-300 p-4 mb-4">
                  <div className="text-base font-extrabold tracking-wide mb-1">{idx + 1}.&nbsp;&nbsp;{voter.name}</div>
                  <div className="text-sm text-gray-800 mb-1"><span className="font-semibold">पिता/पति :</span> {voter.fatherHusbandName}</div>
                  <div className="text-sm text-gray-800 mb-1"><span className="font-semibold">पता :</span> {voter.address}</div>
                  <div className="text-sm text-gray-800 mb-1"><span className="font-semibold">क्रमांक :</span> {voter.serialNumber}</div>
                  <div className="text-sm text-gray-800 mb-1"><span className="font-semibold">मोबाइल :</span> {voter.mobileNumber}</div>
                  <div className="text-sm text-gray-800 mb-1"><span className="font-semibold">पहचान पत्र नं.:</span> {voter.idCardNumber}</div>
                  <div className="text-sm text-gray-800 mb-1"><span className="font-semibold">बूथ नं :</span> {voter.boothNumber}</div>
                  <div className="text-sm text-gray-800"><span className="font-semibold">घर नं :</span> {voter.houseNumber || '—'}</div>
                  <div className="text-sm text-gray-800"><span className="font-semibold">मतदान स्थान :</span> {voter.pollingStation}</div>
                  <div className="flex items-center justify-around mt-3">
                    <div className="flex items-center gap-2 text-blue-600"><span className="inline-flex w-9 h-9 items-center justify-center bg-blue-100 rounded-full">📞</span> <span className="text-sm">Call</span></div>
                    <div className="flex items-center gap-2 text-green-600"><span className="inline-flex w-9 h-9 items-center justify-center bg-green-100 rounded-full">✅</span> <span className="text-sm">Check</span></div>
                    <div className="flex items-center gap-2 text-amber-600"><span className="inline-flex w-9 h-9 items-center justify-center bg-amber-100 rounded-full">👨‍👩‍👧‍👦</span> <span className="text-sm">Family</span></div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer total */}
          <div className="px-4 py-3 bg-white border-t border-gray-200 flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-800 font-semibold">टोटल : {results.length}</div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
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

