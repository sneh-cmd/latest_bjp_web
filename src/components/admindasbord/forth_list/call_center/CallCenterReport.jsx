import React, { useState, useRef, useEffect } from 'react'
import localStorageManager from '../../../../utils/localStorage'
import { disAdminCallCenterSurveyDashboard } from '../../../../apidata'
import { Chart } from 'react-google-charts'

const StatItem = ({ value, label, color }) => (
  <div className="text-center py-3">
    <div className={`text-2xl font-bold`} style={{ color }}>{value}</div>
    <div className="text-sm text-gray-700 mt-1">{label}</div>
  </div>
)

// We'll use react-google-charts PieChart for a simple pie visualization

const CallCenterReport = ({ navigation }) => {
  const { navigate } = navigation || {}
  const containerRef = useRef(null)
  const [activeTab, setActiveTab] = useState('total')
  const [totalCounts, setTotalCounts] = useState({
    total: 0,
    received_not: 0,
    wrong_mobile: 0,
    positive: 0,
    negative: 0,
    doubtful: 0,
    none: 0
  })

  const [todayCounts, setTodayCounts] = useState({
    total: 0,
    received_not: 0,
    wrong_mobile: 0,
    positive: 0,
    negative: 0,
    doubtful: 0,
    none: 0
  })

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTo({ top: 0 })

    const mapApiToCounts = (item = {}) => {
      const received_not = item.NR || 0
      const wrong_mobile = item.WM || 0
      const positive = item.P || 0
      const negative = item.N || 0
      const doubtful = item.D || 0
      const none = item.C || 0

      const total =
        received_not +
        wrong_mobile +
        positive +
        negative +
        doubtful +
        none

      return {
        total,
        received_not,
        wrong_mobile,
        positive,
        negative,
        doubtful,
        none
      }
    }

    const fetchDashboardData = async () => {
      try {
        // Optional panelApiUrl if you store it; helper also falls back via getAdminEndpoint
        const panelApiUrl = localStorageManager.getApiUrl && localStorageManager.getApiUrl()

        const data = await disAdminCallCenterSurveyDashboard(panelApiUrl)

        if (data?.result?.[0]) {
          setTotalCounts(mapApiToCounts(data.result[0]))
        }

        if (data?.result2?.[0]) {
          setTodayCounts(mapApiToCounts(data.result2[0]))
        }
      } catch (error) {
        console.error('Failed to fetch call center dashboard data', error)
      }
    }

    fetchDashboardData()
  }, [])

  const handleBack = () => {
    if (navigate) navigate(-1)
  }

  const navCards = [
    { id: 'booth-wise', label: 'बूथ अनुसार सर्वे', icon: '📊', path: '/booth-wise-call-report' },
    { id: 'date-wise', label: 'तारीख अनुसार सर्वे', icon: '📅', path: '/date-wise-call-report' },
    { id: 'call-wise', label: 'कॉल सेंटर सर्वे', icon: '📞', path: '/call-wise-call-report' },
  ]

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-y-auto bg-gray-100" style={{ backgroundColor: '#e5e8ff' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 w-full px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#102463' }}>
         <button
          onClick={handleBack}
          className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-all duration-200 active:scale-95 shadow-sm"
        >
          <svg className="w-5 h-5 sm:w-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-white text-lg font-bold">कॉल सेंटर सर्वे रिपोर्ट</h1>
        <div className="w-9 h-9" />
      </div>

      <div className="max-w-4xl mx-auto p-4" style={{ backgroundColor: '#e5e8ff' }}>
        {/* Tabs */}
        <div className="bg-white rounded-t-2xl overflow-hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('total')}
              className={`flex-1 py-3 text-center ${activeTab === 'total' ? 'text-blue-800 border-b-2 border-blue-800 font-semibold' : 'text-gray-400'}`}>
              टोटल सर्वे
            </button>
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-3 text-center ${activeTab === 'today' ? 'text-blue-800 border-b-2 border-blue-800 font-semibold' : 'text-gray-400'}`}>
              आज का सर्वे
            </button>
          </div>

          {/* Pie chart (react-google-charts) */}
          <div className="px-6 py-6 text-center">
            {(() => {
              const counts = activeTab === 'total' ? totalCounts : todayCounts
              const data = [
                ['Status', 'Count'],
                ['रिसीव नहीं हुई', Number(counts.received_not || 0)],
                ['ग़लत मोबाइल', Number(counts.wrong_mobile || 0)],
                ['पॉजिटिव', Number(counts.positive || 0)],
                ['नेगेटिव', Number(counts.negative || 0)],
                ['डाउटफुल', Number(counts.doubtful || 0)],
                ['कुछ नहीं', Number(counts.none || 0)]
              ]

              const options = {
                pieHole: 0, // simple pie (no donut)
                legend: 'none', // disable built-in legend so we render a custom one below
                pieSliceText: 'percentage',
                slices: {
                  0: { color: '#38bdf8' },
                  1: { color: '#f472b6' },
                  2: { color: '#16a34a' },
                  3: { color: '#ef4444' },
                  4: { color: '#f59e0b' },
                  5: { color: '#1e40af' }
                }
              }

              return (
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center">
                    <Chart chartType="PieChart" data={data} options={options} width="320px" height="260px" />
                  </div>

                  {/* Custom legend - keep unchanged from original design */}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 inline-block rounded-sm" style={{ background: '#38bdf8' }} />रिसीव नहीं हुई</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 inline-block rounded-sm" style={{ background: '#f472b6' }} />ग़लत मोबाइल</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 inline-block rounded-sm" style={{ background: '#16a34a' }} />पॉजिटिव</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 inline-block rounded-sm" style={{ background: '#ef4444' }} />नेगेटिव</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 inline-block rounded-sm" style={{ background: '#f59e0b' }} />डाउटफुल</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 inline-block rounded-sm" style={{ background: '#1e40af' }} />कुछ नहीं</div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Stats Card */}
          <div className="bg-white p-4 rounded-b-2xl shadow-md -mt-6">
            <h2 className="text-center text-xl font-bold mb-4">{activeTab === 'total' ? 'टोटल सर्वे' : 'आज का सर्वे'}</h2>

            {(() => {
              const counts = activeTab === 'total' ? totalCounts : todayCounts

              return (
                <>
                  <div className="grid grid-cols-3 gap-0 border border-gray-200 rounded-t">
      <div className="p-2 sm:p-4 border-r text-center">
        <div className="text-lg sm:text-2xl font-bold">{counts.total}</div>
        <div className="text-xs sm:text-sm text-blue-700 mt-1">कुल कॉल</div>
      </div>
      <div className="p-2 sm:p-4 border-r text-center">
        <div className="text-lg sm:text-2xl font-bold">{counts.received_not}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">रिसीव नहीं हुई</div>
      </div>
      <div className="p-2 sm:p-4 text-center">
        <div className="text-lg sm:text-2xl font-bold">{counts.wrong_mobile}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">ग़लत मोबाइल</div>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-0 border border-t-0 border-gray-200 rounded-b">
      <div className="p-2 sm:p-3 text-center border-r">
        <div className="text-base sm:text-xl font-bold text-green-700">{counts.positive}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">पॉजिटिव</div>
      </div>
      <div className="p-2 sm:p-3 text-center border-r">
        <div className="text-base sm:text-xl font-bold text-red-600">{counts.negative}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">नेगेटिव</div>
      </div>
      <div className="p-2 sm:p-3 text-center border-r sm:border-r">
        <div className="text-base sm:text-xl font-bold text-yellow-500">{counts.doubtful}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">डाउटफुल</div>
      </div>
      <div className="p-2 sm:p-3 text-center">
        <div className="text-base sm:text-xl font-bold text-blue-800">{counts.none}</div>
        <div className="text-xs sm:text-sm text-gray-700 mt-1">कुछ नहीं</div>
      </div>
    </div>
                </>
              )
            })()}

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {navCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => navigate && navigate(card.path)}
                  className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 hover:shadow-lg border border-gray-300 hover:border-blue-300"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-md flex items-center justify-center text-sm sm:text-base">{card.icon}</div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-sm sm:text-lg font-semibold text-red-500 truncate">{card.label}</div>
                  </div>
                  
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CallCenterReport
