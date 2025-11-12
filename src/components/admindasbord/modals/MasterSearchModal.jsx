import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_AUTH_CONFIG } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import ValidationModal from './ValidationModal.jsx'

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

const EMPTY_SEARCH_DATA = {
  name: '',
  fatherHusbandName: '',
  surname: '',
  mobileNumber: '',
  voterIdNumber: ''
}

const MasterSearchModal = ({ isOpen, onClose, onSearch }) => {
  const navigate = useNavigate()
  const [searchData, setSearchData] = useState(EMPTY_SEARCH_DATA)

  const [isSearching, setIsSearching] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  const fieldConfig = useMemo(() => ({
    name: { min: 4, label: 'Name' },
    fatherHusbandName: { min: 4, label: 'Father/Husband Name' },
    surname: { min: 4, label: 'Surname' },
    mobileNumber: { min: 5, label: 'Mobile number' },
    voterIdNumber: { min: 5, label: 'Id-card No' }
  }), [])

  const handleInputChange = (field, value) => {
    if (validationMessage) {
      setValidationMessage('')
    }

    if (fieldConfig[field]) {
      value = value.trimStart()
    }

    setSearchData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClose = () => {
    setSearchData(EMPTY_SEARCH_DATA)
    setValidationMessage('')
    setIsSearching(false)
    if (onClose) {
      onClose()
    }
  }

  const hasSearchInput = useMemo(() => {
    return Object.values(searchData).some(value => value && value.toString().trim() !== '')
  }, [searchData])

  const handleSubmit = async () => {
    const payload = { ...searchData }

    if (!hasSearchInput) {
      setValidationMessage('Write Something to searching')
      return
    }

    const textFieldValidations = [
      { key: 'name', min: 4 },
      { key: 'fatherHusbandName', min: 4 },
      { key: 'surname', min: 4 },
      { key: 'mobileNumber', min: 5 },
      { key: 'voterIdNumber', min: 5 }
    ]

    for (const { key, min } of textFieldValidations) {
      const value = (payload[key] || '').trim()
      if (value && value.length < min) {
        setValidationMessage(`Enter Maximum ${min} characters for ${fieldConfig[key].label}`)
        return
      }
      payload[key] = value
    }

    if (onSearch) {
      onSearch(payload)
    }
    
    setIsSearching(true)
    setSearchData(EMPTY_SEARCH_DATA)
    
    try {
      // Get panel API URL from localStorage
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://tmc14.mhbjplok.com'
      
      // Build SOAP request body
      const soapBody = `<master_search xmlns="http://tempuri.org/">
      <f_name>${payload.name || ''}</f_name>
      <m_name>${payload.fatherHusbandName || ''}</m_name>
      <surname>${payload.surname || ''}</surname>
      <mobile_no>${payload.mobileNumber || ''}</mobile_no>
      <id_card_no>${payload.voterIdNumber || ''}</id_card_no>
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
      const transformedData = (jsonData && Array.isArray(jsonData.result))
        ? jsonData.result.map((voter, index) => ({
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
        : []

      const totalResults = transformedData.length
      const success = Boolean(jsonData && (jsonData.Success === '1' || jsonData.Success === 1))

      navigate('/master-search-results', {
        state: {
          results: transformedData,
          total: totalResults,
          success,
          error: success ? null : (jsonData?.message || (totalResults === 0 ? 'No results found' : null))
        }
      })
      if (onClose) {
        onClose()
      }
      return
    } catch (err) {
      console.error('Error fetching master search data:', err)
      navigate('/master-search-results', {
        state: {
          results: [],
          total: 0,
          success: false,
          error: err.message || 'Failed to load search results'
        }
      })
      if (onClose) {
        onClose()
      }
      return
    } finally {
      setIsSearching(false)
    }
  }

  if (!isOpen) return null

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
      <ValidationModal
        isOpen={!!validationMessage}
        message={validationMessage}
        onClose={() => setValidationMessage('')}
      />
    </div>
  )
}

export default MasterSearchModal

