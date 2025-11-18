import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../common/PageHeader.jsx'
import { display_booth_wise_phonebook } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const normalizeResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.result && Array.isArray(payload.result)) return payload.result
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  return []
}

const BoothWisePhonebook = ({ navigation }) => {
  const { navigate } = navigation
  const [boothData, setBoothData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBoothData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const panelApiUrl = localStorageManager.getApiUrl()
      const response = await display_booth_wise_phonebook(panelApiUrl)
      const records = normalizeResponse(response).map((item, index) => ({
        id: item.booth_no || index,
        boothNo: item.booth_no || '0',
        total: Number(item.total) || 0
      }))
      setBoothData(records)
    } catch (err) {
      console.error('Error fetching booth wise phonebook data:', err)
      setError(err.message || 'डेटा लोड करने में त्रुटि')
      setBoothData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBoothData()
  }, [fetchBoothData])

  const filteredData = useMemo(() => {
    return boothData.filter((item) => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return item.boothNo.toString().toLowerCase().includes(query)
    })
  }, [boothData, searchQuery])

  const totalCount = useMemo(() => {
    return filteredData.reduce((acc, item) => acc + item.total, 0)
  }, [filteredData])

  const handleBack = () => {
    navigate(-1)
  }

  const handleBoothClick = (booth) => {
    navigate('/booth-wise-phonebook-member', {
      boothNo: booth.boothNo
    })
  }

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden" style={{ backgroundColor: '#e5e8ff' }}>
      <PageHeader
        title="परिचित मतदाता सूची"
        onBack={handleBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchClear={() => setSearchQuery('')}
        uppercase={false}
      />

      {/* Summary Bar */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0" style={{ backgroundColor: '#e5e8ff' }}>
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="px-2 py-1 rounded-lg inline-block">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
              टोटल : {filteredData.length}
            </span>
          </div>
          <div className="px-2 py-1 rounded-lg inline-block">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
              परिचित मतदाता : {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-3 sm:px-4 pb-20">
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
              onClick={fetchBoothData}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 py-3 sm:py-4">
            {filteredData.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                onClick={() => handleBoothClick(item)}
                className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-700 mb-2 font-medium">
                    बूथ नं. {item.boothNo}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-3">
                    परिचित मतदाता
                  </div>
                  <div 
                    className="text-3xl sm:text-4xl md:text-5xl font-bold"
                    style={{ color: '#60a5fa' }}
                  >
                    {item.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BoothWisePhonebook

