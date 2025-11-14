import React from 'react'

const UnsurveyedLeadersModal = ({
  isOpen,
  title = 'सर्वे नहीं किए हुए प्रमुख',
  onClose,
  onSearchToggle,
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'नाम या फोन नंबर से खोजें...',
  loading = false,
  loadingText = 'डेटा लोड हो रहा है...',
  error = null,
  onRetry,
  retryButtonText = 'पुनः प्रयास करें',
  filteredData = [],
  overallCount = 0,
  filteredCount = 0,
  emptyMessage = 'सभी प्रमुखों ने सर्वे किया है',
  searchEmptyMessage = 'कोई परिणाम नहीं मिला',
  showFileOptions = false,
  onExcelClick,
  onOpenFile,
  onShareFile,
  onCancelFileOptions,
}) => {
  if (!isOpen) return null

  const handleSearchChange = (value) => {
    if (onSearchChange) {
      onSearchChange(value)
    }
  }

  const handleClearSearch = () => {
    handleSearchChange('')
  }

  const getContactNumber = (item) => item.phone || item.mobile_no || ''
  const getProfileImage = (item) =>
    item.profileImage ||
    item.photo_path ||
    item.photoPath ||
    item.photo ||
    item.image_url ||
    item.image ||
    item.photoUrl ||
    ''

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#102463' }}></div>
          <p className="mt-4 text-gray-600">{loadingText}</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <p className="text-red-700 text-base sm:text-lg font-semibold mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              style={{ backgroundColor: '#102463' }}
            >
              {retryButtonText}
            </button>
          )}
        </div>
      )
    }

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <p className="text-base sm:text-lg">
            {searchQuery ? searchEmptyMessage : emptyMessage}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-2 sm:space-y-3">
        {filteredData.map((item) => {
          const contactNumber = getContactNumber(item)
          const boothNumber = item.booth_javabdari || item.booth || item.booth_no || ''
          const profileImage = getProfileImage(item)
          return (
            <div
              key={item.id || item.admin_id}
              className="bg-white rounded-lg sm:rounded-xl shadow-md w-full overflow-hidden relative"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2" style={{ backgroundColor: '#102463' }}></div>

              <div className="pl-3.5 sm:pl-5 pr-3 sm:pr-4 py-2.5 sm:py-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#d4a574' }}>
                      <svg className="avatar-icon w-7 h-7 sm:w-8 sm:h-8 text-white transition-opacity duration-200" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: profileImage ? 0 : 1 }}>
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      {profileImage && (
                        <img
                          src={profileImage}
                          alt={item.name || 'profile'}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.style.display = 'none'
                            const icon = e.currentTarget.parentElement?.querySelector('.avatar-icon')
                            if (icon) {
                              icon.style.opacity = '1'
                            }
                          }}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="text-sm sm:text-lg md:text-xl font-bold text-gray-900">
                        {item.name} {item.designation ? `(${item.designation})` : ''}
                      </div>
                      {boothNumber ? (
                        <div className="text-[11px] sm:text-xs md:text-sm text-gray-600">
                          बूथ नं. : {boothNumber}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {contactNumber && (
                    <a
                      href={`tel:${contactNumber}`}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ml-2"
                      style={{ backgroundColor: '#E3F2FD', color: '#102463' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#BBDEFB'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#E3F2FD'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const showSubsetNote = Boolean(searchQuery && overallCount && overallCount !== filteredCount)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{
          opacity: 0.5,
          animation: 'fadeIn 0.3s ease-out'
        }}
      ></div>

      <div
        className="relative w-full h-[85vh] sm:h-[80vh] lg:h-[75vh] sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b shadow-sm" style={{ backgroundColor: '#102463' }}>
          <h2 className="text-white text-lg sm:text-xl font-bold flex-1">{title}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onSearchToggle}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="sticky top-[56px] sm:top-[60px] z-10 w-full px-4 sm:px-6 py-1.5 sm:py-2 bg-white border-b shadow-md">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4" style={{ backgroundColor: '#e5e8ff' }}>
          {renderContent()}
        </div>

        <div className="sticky bottom-0 bg-black px-4 sm:px-6 py-1.5 sm:py-2.5 flex items-center justify-between">
          <div className="bg-white rounded-md sm:rounded-lg px-3 sm:px-4 py-1 sm:py-1.5">
            <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
              टोटल : {filteredCount}
              {showSubsetNote && (
                <span className="text-xs text-gray-600 ml-1">({overallCount} में से)</span>
              )}
            </span>
          </div>
          {!showFileOptions ? (
            <button
              onClick={onExcelClick}
              className="bg-green-600 hover:bg-green-700 rounded-md sm:rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
              </svg>
              <span className="text-white text-xs sm:text-sm font-semibold hidden sm:inline">Excel</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={onOpenFile}
                className="bg-blue-600 hover:bg-blue-700 rounded-md sm:rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 transition-colors flex flex-col items-center space-y-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                  <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
                </svg>
                <span className="text-white text-[10px] sm:text-xs font-semibold">फ़ाइल खोलें</span>
              </button>

              <button
                onClick={onShareFile}
                className="bg-green-600 hover:bg-green-700 rounded-md sm:rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 transition-colors flex flex-col items-center space-y-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-white text-[10px] sm:text-xs font-semibold">शेयर फ़ाइल</span>
              </button>

              <button
                onClick={onCancelFileOptions}
                className="bg-gray-600 hover:bg-gray-700 rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.5;
          }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default UnsurveyedLeadersModal


