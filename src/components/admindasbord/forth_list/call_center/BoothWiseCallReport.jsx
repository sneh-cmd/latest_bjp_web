import React, { useRef, useEffect, useState, useCallback } from 'react'
import { displayBoothWiseCallCenterSurveyDash } from '../../../../apidata'
import PageHeader from '../../common/PageHeader.jsx'

const BoothCard = ({ booth, onClick }) => (
  <div
    className="bg-white rounded-xl shadow-md border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow p-2 sm:p-4"
    onClick={onClick}
    style={{ minWidth: 0 }}
  >
    <h3 className="text-center font-bold text-base sm:text-xl mb-2 sm:mb-3">बूथ नं. : {booth.id}</h3>

    <div className="grid grid-cols-3 gap-0 border border-gray-200 rounded-t">
      <div className="p-2 sm:p-4 border-r text-center">
        <div className="text-lg sm:text-2xl font-bold">{booth.total}</div>
        <div className="text-xs sm:text-sm text-blue-700 mt-1">कुल कॉल</div>
      </div>
      <div className="p-2 sm:p-4 border-r text-center">
        <div className="text-lg sm:text-2xl font-bold">{booth.received_not}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">रिसीव नहीं हुई</div>
      </div>
      <div className="p-2 sm:p-4 text-center">
        <div className="text-lg sm:text-2xl font-bold">{booth.wrong_mobile}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">ग़लत मोबाइल</div>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-0 border border-t-0 border-gray-200 rounded-b">
      <div className="p-2 sm:p-3 text-center border-r">
        <div className="text-base sm:text-xl font-bold text-green-700">{booth.positive}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">पॉजिटिव</div>
      </div>
      <div className="p-2 sm:p-3 text-center border-r">
        <div className="text-base sm:text-xl font-bold text-red-600">{booth.negative}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">नेगेटिव</div>
      </div>
      <div className="p-2 sm:p-3 text-center border-r sm:border-r">
        <div className="text-base sm:text-xl font-bold text-yellow-500">{booth.doubtful}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">डाउटफुल</div>
      </div>
      <div className="p-2 sm:p-3 text-center">
        <div className="text-base sm:text-xl font-bold text-blue-800">{booth.none}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">कुछ नहीं</div>
      </div>
    </div>
  </div>
)

const BoothWiseCallReport = ({ navigation }) => {
  const { navigate } = navigation || {}
  const containerRef = useRef(null)
  const [booths, setBooths] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBoothData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const panelApiUrl = localStorage.getItem('panelApiUrl') || 'http://ntmc2.mhbjplok.com/webservice.asmx'

      const response = await displayBoothWiseCallCenterSurveyDash(panelApiUrl)

      let dataList = []
      if (Array.isArray(response)) {
        dataList = response
      } else if (response && typeof response === 'object') {
        dataList = response.result || response.data || response.booths || []
      }

      const mapped = (dataList || []).map((item, index) => {
        const boothNo = item.booth_no ?? item.boothNo ?? (index + 1)
        const nr = item.nr ?? item.NR ?? 0
        const wm = item.wm ?? item.WM ?? 0
        const p = item.p ?? item.P ?? 0
        const n = item.n ?? item.N ?? 0
        const c = item.c ?? item.C ?? 0
        const d = item.d ?? item.D ?? 0
        const total = item.total ?? (nr + wm + p + n + c + d)

        return {
          id: boothNo,
          total,
          received_not: nr,
          wrong_mobile: wm,
          positive: p,
          negative: n,
          doubtful: d,
          none: c
        }
      })

      setBooths(mapped)
    } catch (err) {
      console.error('Error fetching booth wise call center data:', err)
      setError(err.message || 'Failed to fetch data')
      setBooths([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    fetchBoothData()
  }, [fetchBoothData])

  const handleBack = () => {
    if (navigate) navigate(-1)
  }

  const handleBoothClick = (booth) => {
    if (!navigate) return
    navigate('/call-center-booth-voters', {
      boothNo: booth.id
    })
  }

  // Filter booths by search query (match booth number or any stat)
  const filteredBooths = booths.filter(b => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      String(b.id).toLowerCase().includes(query) ||
      String(b.total).toLowerCase().includes(query) ||
      String(b.received_not).toLowerCase().includes(query) ||
      String(b.wrong_mobile).toLowerCase().includes(query) ||
      String(b.positive).toLowerCase().includes(query) ||
      String(b.negative).toLowerCase().includes(query) ||
      String(b.doubtful).toLowerCase().includes(query) ||
      String(b.none).toLowerCase().includes(query)
    )
  })

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
    >
      <div className="sticky top-0 z-20">
        <PageHeader
          title="कॉल सेंटर बूथ रिपोर्ट"
          onBack={handleBack}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />

        <div className="px-2 sm:px-4 py-2 sm:py-3" style={{ backgroundColor: '#e5e8ff' }}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="px-2 py-1 rounded-lg inline-block">
              <span className="text-sm font-bold" style={{ color: '#102463' }}>
                टोटल : {filteredBooths.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-1 sm:px-4 md:px-6 py-2 sm:py-4 pb-20 mb-7 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4">
        {loading ? (
          <div className="text-center py-8 col-span-full">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-base sm:text-lg text-gray-500 mt-4">डेटा लोड हो रहा है...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 col-span-full">
            <p className="text-base sm:text-lg">{error}</p>
            <button
              onClick={fetchBoothData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              पुनः प्रयास करें
            </button>
          </div>
        ) : filteredBooths.length === 0 ? (
          <div className="text-center py-8 text-gray-500 col-span-full">
            <p className="text-base sm:text-lg">कोई परिणाम नहीं मिला</p>
          </div>
        ) : (
          filteredBooths.map((b) => (
            <BoothCard key={b.id} booth={b} onClick={() => handleBoothClick(b)} />
          ))
        )}
      </div>
    </div>
  )
}

export default BoothWiseCallReport
