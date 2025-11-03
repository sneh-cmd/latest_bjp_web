import React from 'react'

const DataSearchLoader = ({ isVisible = true }) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      {/* Main Container */}
      <div className="text-center">
        {/* Main Text */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            SEARCHING RECORDS IN{' '}
            <span className="text-orange-500">500000+</span>
          </h1>
          <h2 className="text-4xl font-bold text-blue-900">
            DATA, PLEASE WAIT....
          </h2>
        </div>

        {/* Central Illustration */}
        <div className="relative flex justify-center items-center mb-8">
          {/* Hand */}
          <div className="absolute -left-8 -bottom-4 z-10">
            <svg width="120" height="80" viewBox="0 0 120 80" className="text-blue-300">
              <path
                d="M20 60 Q30 50 40 55 Q50 45 60 50 Q70 40 80 45 Q90 35 100 40 L105 45 Q110 50 105 55 Q100 60 95 55 Q90 50 85 55 Q80 60 75 55 Q70 50 65 55 Q60 60 55 55 Q50 50 45 55 Q40 60 35 55 Q30 50 25 55 Q20 60 20 60 Z"
                fill="currentColor"
                className="opacity-80"
              />
            </svg>
          </div>

          {/* ID Card */}
          <div className="relative">
            <div className="w-64 h-40 bg-blue-100 border-4 border-blue-900 rounded-lg relative overflow-hidden">
              {/* Profile Picture Area */}
              <div className="absolute left-4 top-4 w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 40 40" className="text-blue-600">
                  <circle cx="20" cy="15" r="8" fill="currentColor" />
                  <path
                    d="M8 32 Q8 24 20 24 Q32 24 32 32"
                    fill="currentColor"
                  />
                </svg>
              </div>

              {/* Data Lines */}
              <div className="absolute right-4 top-4 space-y-2">
                <div className="w-20 h-2 bg-purple-200 rounded"></div>
                <div className="w-24 h-2 bg-purple-200 rounded"></div>
                <div className="w-28 h-2 bg-purple-200 rounded"></div>
                <div className="w-32 h-2 bg-purple-200 rounded"></div>
                <div className="w-24 h-2 bg-purple-200 rounded"></div>
              </div>
            </div>
          </div>

          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Left side labels */}
            <line
              x1="20%"
              y1="20%"
              x2="35%"
              y2="25%"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
            <line
              x1="20%"
              y1="35%"
              x2="35%"
              y2="40%"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-pulse"
            />

            {/* Right side labels */}
            <line
              x1="80%"
              y1="20%"
              x2="65%"
              y2="25%"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
            <line
              x1="80%"
              y1="35%"
              x2="65%"
              y2="40%"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
            <line
              x1="80%"
              y1="50%"
              x2="65%"
              y2="55%"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
            <line
              x1="80%"
              y1="65%"
              x2="65%"
              y2="70%"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Labels */}
        <div className="flex justify-between px-8">
          {/* Left Labels */}
          <div className="space-y-4">
            <div className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              Name
            </div>
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              ID #
            </div>
          </div>

          {/* Right Labels */}
          <div className="space-y-4">
            <div className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              John Doe
            </div>
            <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              123-456
            </div>
            <div className="bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium">
              12/08/94
            </div>
            <div className="bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium">
              12 Street
            </div>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="mt-8">
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataSearchLoader
