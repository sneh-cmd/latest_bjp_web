import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_AUTH_CONFIG } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const EMPTY_STATE = {
  loading: true,
  error: null,
  families: []
}

const Familyscreen = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { params = {}, state = {} } = location || {}
  const voterId = state?.voterId || params?.voterId || null
  const voterName = state?.name || params?.name || 'परिवार'

  const [uiState, setUiState] = useState(EMPTY_STATE)

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (!voterId) {
        setUiState({
          loading: false,
          error: 'Family data unavailable. Missing voter id.',
          families: []
        })
        return
      }

      try {
        setUiState(prev => ({ ...prev, loading: true, error: null }))

        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'

        const soapBody = `<display_family_member xmlns="http://tempuri.org/">
      <id>${voterId}</id>
    </display_family_member>`

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

        const endpoint = import.meta.env.DEV
          ? '/panel-api/webservice.asmx'
          : `${panelApiUrl}/webservice.asmx`

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://tempuri.org/display_family_member'
          },
          body: soapEnvelope
        })

        if (!response.ok) {
          throw new Error(`Failed to load family data. Status: ${response.status}`)
        }

        const xmlText = await response.text()
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
        const resultNode = xmlDoc.getElementsByTagName('display_family_memberResult')[0]

        if (!resultNode || !resultNode.textContent) {
          throw new Error('Invalid family response format')
        }

        const jsonData = JSON.parse(resultNode.textContent)

        if (!jsonData || !Array.isArray(jsonData.result)) {
          throw new Error(jsonData?.message || 'Family data not available')
        }

        const transformed = jsonData.result.map(member => ({
          id: member.id,
          voterId: member.idcard_no || '-',
          name: `${member.f_name || ''} ${member.surname || ''}`.trim() || '-',
          phone: member.contact_no && member.contact_no !== '-' ? member.contact_no : '-',
          age: member.age || '-'
        }))

        setUiState({
          loading: false,
          error: null,
          families: transformed
        })
      } catch (error) {
        console.error('Family screen error:', error)
        setUiState({
          loading: false,
          error: error.message || 'Failed to load family information',
          families: []
        })
      }
    }

    fetchFamilyMembers()
  }, [voterId])

  const handleBack = () => {
    navigate(-1)
  }

  const renderContent = () => {
    if (uiState.loading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600 font-medium">परिवार के सदस्य लोड हो रहे हैं...</p>
          </div>
        </div>
      )
    }

    if (uiState.error) {
      return (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">परिवार की जानकारी उपलब्ध नहीं है</h3>
              <p className="text-gray-600 text-sm">{uiState.error}</p>
            </div>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              वापस जाएं
            </button>
          </div>
        </div>
      )
    }

    if (!uiState.families.length) {
      return (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">कोई परिवार के सदस्य सूचीबद्ध नहीं है</h3>
            <p className="text-gray-600 text-sm">कृपया बाद में पुनः प्रयास करें</p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-6" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-2 sm:gap3">
          {uiState.families.map(member => (
            <div
              key={member.id || member.voterId}
              className="border border-gray-300 rounded-lg m-2 px-3 py-3 sm:px-4 sm:py-4 bg-white shadow-sm"
            >
              <div className="text-sm font-semibold text-gray-900 mb-2">
                {member.name || '—'}
              </div>
              <div className="space-y-1 text-xs sm:text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">मोबाइल नं.</span>
                  <span className="text-gray-900">{member.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">उम्र</span>
                  <span className="text-gray-900">{member.age || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">वोटर आईडी</span>
                  <span className="text-gray-900">{member.voterId || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"></div>
      <div className="relative z-10 h-full flex flex-col">
        <div className="px-2 sm:px-4 py-3 flex-shrink-0 shadow-md" style={{ backgroundColor: '#102463' }}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleBack}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-white text-base sm:text-lg font-semibold">परिवार के अनुसार</h1>
            </div>
          </div>
        </div>

        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-sm" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-xs sm:text-sm font-bold" style={{ color: '#102463' }}>
                {voterName} के परिवार के सदस्य 
              </span>
            </div>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  )
}

export default Familyscreen

