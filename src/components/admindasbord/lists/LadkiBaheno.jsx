import React, { useState, useEffect, useMemo } from 'react'
import PageHeader from '../common/PageHeader.jsx'
import { displayLadkiBahenoBoothWiseDash } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const LadkiBaheno = ({ navigation }) => {
  const { navigate } = navigation
  const [isVisible, setIsVisible] = useState(false)
  const [booths, setBooths] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const filteredBooths = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase()
    if (!q) return booths
    return booths.filter(b => {
      return (
        String(b.boothNumber).toLowerCase().includes(q) ||
        String(b.matchVoters).toLowerCase().includes(q) ||
        String(b.totalVoters).toLowerCase().includes(q)
      )
    })
  }, [booths, searchQuery])

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Fetch booth data from API
  useEffect(() => {
    const fetchBoothData = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = localStorageManager.getApiUrl()
        const data = await displayLadkiBahenoBoothWiseDash(apiUrl)
        console.log('Ladki Baheno API response:', data)
        setBooths(data || [])
      } catch (err) {
        console.error('Error fetching Ladki Baheno data:', err)
        setError(err.message || 'Failed to load booth data')
        setBooths([])
      } finally {
        setLoading(false)
      }
    }

    fetchBoothData()
  }, [])

  const handleBack = () => {
    setIsVisible(false)
    setTimeout(() => navigate('/admin'), 200)
  }

  const handleBoothClick = (booth) => {
    if (!booth || !booth.boothNumber) return
    navigate('/ladki-baheno-voters', {
      boothNumber: booth.boothNumber
    })
  }

  return (
    <div className={`h-screen flex flex-col transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ backgroundColor: '#e5e8ff' }}>
      <div className="sticky top-0 z-40" style={{ backgroundColor: '#e5e8ff' }}>
        <PageHeader
          title="लाड़की बहनो"
          onBack={handleBack}
          showSearch={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={() => setSearchQuery('')}
        />
        {/* Summary Bar */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="px-2 py-1 rounded-lg inline-block">
            <span className="text-sm font-bold" style={{ color: '#102463' }}>
             टोटल : {booths.length} बूथ
            </span>
          </div>
        </div>
      </div>
      </div>
      <div className="flex-1 overflow-auto px-3 sm:px-6 py-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">लोड हो रहा है...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-red-600">त्रुटि: {error}</div>
          </div>
        ) : filteredBooths.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">कोई बूथ नहीं मिला</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 pb-8">
            {filteredBooths.map(b => (
              <div 
                key={b.id} 
                className="bg-white rounded-lg p-2 sm:p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleBoothClick(b)}
              >
                <div className="text-center">
                  <div className="text-sm sm:text-xl font-bold mb-1 sm:mb-2">बूथ नं. {b.boothNumber}</div>
                  <div className="text-xs sm:text-sm text-gray-800 mb-1">मेच मतदाता : <span className="text-xs sm:text-sm text-gray-800">{b.matchVoters}</span></div>
                  <div className="text-xs sm:text-sm text-gray-600">टोटल मतदाता : <span className="text-xs sm:text-sm text-gray-600">{b.totalVoters}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LadkiBaheno
