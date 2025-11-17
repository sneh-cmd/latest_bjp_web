import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { displayUserWiseSurveyVoter, displayVoterSurveyLog, selectSurveyDetail } from '../../../../apidata'
import localStorageManager from '../../../../utils/localStorage'
import SurveyDetailModal from '../../modals/SurveyDetailModal.jsx'
import PageHeader from '../../common/PageHeader.jsx'

const buildDisplayInfo = (data) => {
  if (!data) return null

  const fullName =
    [data.eng_f_name, data.eng_m_name, data.f_eng_surname, data.eng_surname]
      .filter(Boolean)
      .join(' ')
      .trim() || data.name

  return {
    name: fullName || '-',
    address: data.eng_localityid || data.visit_location || data.address || '-',
    mobile: data.contact_no || data.mobile || '-',
    voterId: data.idcard_no || data.idCardNo || data.voterId || data.voter_id || '-'
  }
}

const extractPayloadArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && Array.isArray(payload.result)) return payload.result
  if (payload && Array.isArray(payload.data)) return payload.data
  if (payload && Array.isArray(payload.voters)) return payload.voters
  if (payload && Array.isArray(payload.logs)) return payload.logs
  if (payload && Array.isArray(payload.items)) return payload.items
  return []
}

const STATUS_META = {
  p: { label: 'पॉजिटिव', badgeClass: 'bg-green-500 text-white' },
  n: { label: 'नेगेटिव', badgeClass: 'bg-red-500 text-white' },
  d: { label: 'डाउटफुल', badgeClass: 'bg-orange-500 text-white' },
  c: { label: 'कुछ नहीं', badgeClass: 'bg-gray-500 text-white' }
}

const getStatusMeta = (status) => {
  const key = status ? String(status).trim().toLowerCase() : ''
  return STATUS_META[key] || { label: 'कुछ नहीं', badgeClass: 'bg-slate-400 text-white' }
}

const getValueFromKeys = (data, keys, fallback = '') => {
  if (!data) return fallback
  for (const key of keys) {
    if (key in data && data[key] !== null && data[key] !== undefined) {
      const value = typeof data[key] === 'string' ? data[key].trim() : data[key]
      if (value !== '' && value !== '-') {
        return value
      }
    }
  }
  return fallback
}

const VoterLogDetailSlide = ({ navigation }) => {
  const { navigate, state } = navigation
  const selectedVoter = state?.voter

  const resolveAdminId = useMemo(() => {
    if (!state) return null
    const candidateIds = [
      state.admin_id,
      state.adminId,
      state.user_id,
      selectedVoter?.admin_id,
      selectedVoter?.adminId,
      selectedVoter?.user_id,
      selectedVoter?.main_admin_id,
      state?.categoryData?.admin_id,
      state?.categoryData?.id
    ]
      .map((value) => (value !== undefined && value !== null ? String(value).trim() : ''))
      .filter(Boolean)
    return candidateIds[0] || null
  }, [state, selectedVoter])

  const [voterInfo, setVoterInfo] = useState(() => buildDisplayInfo(selectedVoter))
  const [loadingVoter, setLoadingVoter] = useState(false)
  const [voterError, setVoterError] = useState(null)
  const [surveyLogs, setSurveyLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState(null)
  const [selectedSurveyLog, setSelectedSurveyLog] = useState(null)
  const [surveyDetail, setSurveyDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    let ignore = false

    const fetchVoterInfo = async () => {
      if (!resolveAdminId) {
        if (!selectedVoter) {
          setVoterError('एडमिन आईडी उपलब्ध नहीं है')
        }
        return
      }

      try {
        setLoadingVoter(true)
        setVoterError(null)

        const panelApiUrl = localStorageManager.getApiUrl()
        const response = await displayUserWiseSurveyVoter(resolveAdminId, '', panelApiUrl)
        const allVoters = extractPayloadArray(response)

        if (!allVoters.length) {
          if (!ignore) {
            setVoterInfo(null)
            setVoterError('वोटर जानकारी नहीं मिल पाई')
          }
          return
        }

        const candidateKeys = ['id', 'voter_id', 'voterId', 'idcard_no', 'idCardNo', 'main_admin_id']
        const targetValues = (selectedVoter
          ? candidateKeys
              .map((key) => selectedVoter[key])
              .concat([selectedVoter?.contact_no, selectedVoter?.mobile])
          : []
        )
          .filter((value) => value !== undefined && value !== null)
          .map((value) => String(value).trim().toLowerCase())

        const matchedVoter =
          allVoters.find((voter) =>
            candidateKeys.some((key) => {
              const currentValue = voter[key]
              if (currentValue === undefined || currentValue === null) return false
              return targetValues.includes(String(currentValue).trim().toLowerCase())
            })
          ) || allVoters[0]

        if (!ignore) {
          setVoterInfo(buildDisplayInfo(matchedVoter))
        }
      } catch (error) {
        console.error('Failed to load voter detail:', error)
        if (!ignore) {
          setVoterError('डेटा लोड करने में समस्या आई')
        }
      } finally {
        if (!ignore) {
          setLoadingVoter(false)
        }
      }
    }

    fetchVoterInfo()

    return () => {
      ignore = true
    }
  }, [resolveAdminId, selectedVoter])

  const voterIdForLogs =
    voterInfo?.voterId ||
    selectedVoter?.idcard_no ||
    selectedVoter?.idCardNo ||
    selectedVoter?.voterId ||
    selectedVoter?.voter_id ||
    null

  useEffect(() => {
    let ignore = false

    const fetchSurveyLogs = async () => {
      // Validate voter ID - must be non-empty string or number
      const validVoterId = voterIdForLogs && 
        (String(voterIdForLogs).trim() !== '' && 
         String(voterIdForLogs).trim() !== '-' && 
         String(voterIdForLogs).trim() !== 'N/A')
      
      if (!validVoterId) {
        console.warn('Invalid voter ID for logs:', voterIdForLogs)
        if (!ignore) {
          setSurveyLogs([])
          setLogsError('वोटर आईडी उपलब्ध नहीं है')
          setLogsLoading(false)
        }
        return
      }

      try {
        setLogsLoading(true)
        setLogsError(null)

        const panelApiUrl = localStorageManager.getApiUrl()
        // Ensure voter ID is a string and trimmed
        const cleanVoterId = String(voterIdForLogs).trim()
        console.log('Fetching survey logs for voter ID:', cleanVoterId)
        
        const response = await displayVoterSurveyLog(cleanVoterId, panelApiUrl)
        const logsList = extractPayloadArray(response)

        if (!ignore) {
          setSurveyLogs(Array.isArray(logsList) ? logsList : [])
          if (!Array.isArray(logsList) || logsList.length === 0) {
            setLogsError('कोई सर्वे लॉग नहीं मिला')
          }
        }
      } catch (error) {
        console.error('Failed to fetch voter survey logs:', error)
        if (!ignore) {
          setSurveyLogs([])
          // Check if error message contains specific information
          const errorMessage = error.message || 'सर्वे लॉग लोड नहीं हो पाए'
          if (errorMessage.includes('Success') && errorMessage.includes('0')) {
            setLogsError('इस वोटर के लिए कोई सर्वे लॉग उपलब्ध नहीं है')
          } else {
            setLogsError(errorMessage)
          }
        }
      } finally {
        if (!ignore) {
          setLogsLoading(false)
        }
      }
    }

    fetchSurveyLogs()

    return () => {
      ignore = true
    }
  }, [voterIdForLogs])

  const fetchSurveyDetail = useCallback(
    async (surveyId) => {
      if (!surveyId) return
      try {
        setDetailLoading(true)
        setDetailError(null)
        setSurveyDetail(null)

        const panelApiUrl = localStorageManager.getApiUrl()
        const response = await selectSurveyDetail(surveyId, panelApiUrl)
        const detailData = Array.isArray(response) ? response[0] : response
        setSurveyDetail(detailData || null)
      } catch (error) {
        console.error('Failed to fetch survey detail:', error)
        setDetailError('सर्वे विवरण लोड नहीं हो पाया')
        setSurveyDetail(null)
      } finally {
        setDetailLoading(false)
      }
    },
    []
  )

  const handleSurveyClick = (log) => {
    if (!log?.survey_id) return
    setSelectedSurveyLog(log)
    setShowDetailModal(true)
    fetchSurveyDetail(log.survey_id)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedSurveyLog(null)
    setSurveyDetail(null)
    setDetailError(null)
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#e4e6ff]">
      <div className="absolute inset-0 bg-[#e4e6ff]" />
      <div className="relative z-10 h-full flex flex-col">
        <PageHeader title="Log" onBack={handleBack} showSearch={false} uppercase={false} />

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="text-[#102463] text-base font-semibold mb-3">मतदाता विगत</h2>
            <div className="space-y-3 text-sm text-gray-700">
              {loadingVoter ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                </div>
              ) : voterInfo ? (
                <>
                  <div className="flex">
                    <span className="w-24 font-semibold text-gray-600">नाम :</span>
                    <span className="flex-1 text-gray-900">{voterInfo.name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-semibold text-gray-600">पता :</span>
                    <span className="flex-1 text-gray-900">{voterInfo.address}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-semibold text-gray-600">मोबाइल :</span>
                    <span className="flex-1 text-gray-900">{voterInfo.mobile || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-semibold text-gray-600">पहचान पत्र नं.:</span>
                    <span className="flex-1 text-gray-900">{voterInfo.voterId}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">वोटर विवरण उपलब्ध नहीं है</p>
              )}
              {voterError && !loadingVoter && (
                <p className="text-xs text-red-600">{voterError}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-[#102463] text-base font-semibold mb-3">सर्वे</h3>
            <div className="space-y-3">
              {logsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm p-4 space-y-3 animate-pulse">
                      <div className="flex justify-between">
                        <div className="h-5 w-32 bg-gray-200 rounded-full" />
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : surveyLogs.length > 0 ? (
                surveyLogs.map((log, index) => {
                  const statusCode = getValueFromKeys(log, ['voter_status', 'status', 'voter_status1', 'voterStatus'])
                  const statusInfo = getStatusMeta(statusCode)
                  const surveyChannel = getValueFromKeys(
                    log,
                    ['survey_from', 'Survey_from', 'surveyFrom', 'source', 'type', 'sub_type'],
                    'N/A'
                  )
                  const surveyDate = getValueFromKeys(
                    log,
                    ['survey_date', 'date', 'created_at', 'SurveyDate'],
                    '-'
                  )
                  const surveyTitle =
                    getValueFromKeys(log, ['name', 'survey_by_name', 'survey_by', 'designation'], '') ||
                    `सर्वे #${log.survey_id || index + 1}`
                  const surveyPhone = getValueFromKeys(
                    log,
                    ['mobile_no', 'contact_no', 'phone', 'mobile', 'survey_by_phone'],
                    '-'
                  )
                  const surveyLocation = getValueFromKeys(
                    log,
                    ['visit_location', 'location', 'address', 'eng_localityid'],
                    'लोकेशन उपलब्ध नहीं'
                  )

                  return (
                    <div
                      key={log.survey_id || index}
                      className="bg-white rounded-2xl shadow-sm p-4 flex flex-col space-y-3 cursor-pointer transition hover:shadow-md"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSurveyClick(log)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSurveyClick(log)
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-sm font-medium text-gray-500">{surveyDate}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">{surveyTitle}</p>
                        <p className="text-sm text-gray-600">{surveyPhone}</p>
                        <p className="text-sm text-gray-600">{surveyLocation}</p>
                      </div>
                    </div>
                  )
                })
              ) : voterIdForLogs ? (
                <p className="text-sm text-gray-500">कोई सर्वे लॉग उपलब्ध नहीं है</p>
              ) : (
                <p className="text-sm text-gray-500">पहले वोटर का चयन करें</p>
              )}
              {logsError && !logsLoading && <p className="text-xs text-red-600">{logsError}</p>}
            </div>
          </div>
        </div>
      </div>
      <SurveyDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        detail={surveyDetail}
        fallbackLog={selectedSurveyLog}
        loading={detailLoading}
        error={detailError}
        statusInfo={getStatusMeta(
          getValueFromKeys(
            surveyDetail || selectedSurveyLog || {},
            ['voter_status', 'status', 'voter_status1', 'voterStatus']
          )
        )}
      />
    </div>
  )
}

export default VoterLogDetailSlide

