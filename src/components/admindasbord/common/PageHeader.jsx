import React from 'react'

const PageHeader = ({
  title = '',
  onBack,
  searchQuery = '',
  onSearchChange,
  onSearchClear,
  titleClassName = '',
  showSearch = true
}) => {
  return (
    <div className="px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 shadow-md" style={{ backgroundColor: '#102463' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1
            className={`text-white text-sm sm:text-lg font-semibold truncate max-w-[65vw] sm:max-w-full uppercase ${titleClassName}`}
          >
            {title || ''}
          </h1>
        </div>

        {showSearch && (
          <div className="search-box">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
            <button
              type="reset"
              onClick={() => onSearchClear && onSearchClear()}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader

