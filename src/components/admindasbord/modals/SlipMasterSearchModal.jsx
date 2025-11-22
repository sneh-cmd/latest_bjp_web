import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { master_search_for_slip_send } from '../../../apidata.jsx'
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

const SlipMasterSearchModal = ({ isOpen, onClose }) => {
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

    setIsSearching(true)
    
    try {
      const panelApiUrl = localStorageManager.getApiUrl()
      
      const searchParams = {
        f_name: payload.name || '',
        m_name: payload.fatherHusbandName || '',
        surname: payload.surname || '',
        mobile_no: payload.mobileNumber || '',
        id_card_no: payload.voterIdNumber || '',
        house_no: ''
      }
      
      console.log('Master Search for Slip Send API call:', searchParams)
      
      const response = await master_search_for_slip_send(searchParams, panelApiUrl)
      console.log('Master Search for Slip Send API response:', response)

      // Normalize response
      let records = []
      if (Array.isArray(response)) {
        records = response
      } else if (response?.result && Array.isArray(response.result)) {
        records = response.result
      } else if (response?.Success === "1" && response.result && Array.isArray(response.result)) {
        records = response.result
      }

      // Map API response to component structure
      const transformedData = records.map((voter, index) => ({
        id: voter.id || index + 1,
        name: `${voter.eng_f_name || ''} ${voter.f_eng_surname || ''}`.trim() || 'N/A',
        eng_f_name: voter.eng_f_name || '',
        eng_surname: voter.eng_surname || '',
        f_eng_surname: voter.f_eng_surname || '',
        fatherHusbandName: `${voter.eng_m_name || ''} ${voter.f_eng_surname || ''}`.trim() || '-',
        eng_m_name: voter.eng_m_name || '',
        address: voter.eng_localityid || '-',
        eng_localityid: voter.eng_localityid || '',
        serialNumber: voter.slnoinpart || '-',
        slnoinpart: voter.slnoinpart || '',
        mobileNumber: voter.contact_no || '-',
        contact_no: voter.contact_no || '-',
        idCardNumber: voter.idcard_no || '-',
        idcard_no: voter.idcard_no || '',
        boothNumber: voter.part_no || '-',
        part_no: voter.part_no || '',
        houseNumber: voter.eng_house_no || '-',
        eng_house_no: voter.eng_house_no || '',
        pollingStation: voter.eng_polling_location || '-',
        eng_polling_location: voter.eng_polling_location || '',
        slip_send: voter.slip_send || 0,
        send_date: voter.send_date || '',
        slip_count: voter.slip_count || null
      }))

      const totalResults = transformedData.length
      
      navigate('/slip-master-search-results', {
        state: {
          results: transformedData,
          total: totalResults,
          searchParams: searchParams,
          error: totalResults === 0 ? 'No results found' : null
        }
      })
      
      if (onClose) {
        onClose()
      }
      return
    } catch (err) {
      console.error('Error fetching master search for slip send data:', err)
      setValidationMessage(err.message || 'Failed to load search results')
      navigate('/slip-master-search-results', {
        state: {
          results: [],
          total: 0,
          searchParams: payload,
          error: err.message || 'Failed to load search results'
        }
      })
      if (onClose) {
        onClose()
      }
      return
    } finally {
      setIsSearching(false)
      setSearchData(EMPTY_SEARCH_DATA)
    }
  }

  if (!isOpen) return null

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

export default SlipMasterSearchModal

