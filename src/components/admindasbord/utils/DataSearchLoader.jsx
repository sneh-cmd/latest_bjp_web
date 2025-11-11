import React from 'react'

const DataSearchLoader = ({ isVisible = true }) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
      {/* Main Loading Text */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-2">
          SEARCHING RECORDS IN{' '}
          <span className="text-orange-500">500000+</span> DATA, PLEASE WAIT....
        </h1>
      </div>

      {/* Animated Card Visualization */}
      <div className="relative mb-8">
        {/* Hand holding card */}
        <div className="relative">
          {/* Hand */}
          <div className="w-24 h-32 bg-blue-300 rounded-full relative transform rotate-12">
            {/* Hand details */}
            <div className="absolute top-4 left-2 w-16 h-20 bg-blue-200 rounded-full"></div>
            <div className="absolute top-6 left-4 w-12 h-16 bg-blue-100 rounded-full"></div>
          </div>
          
          {/* Card */}
          <div className="absolute -top-4 -right-8 w-32 h-20 bg-blue-600 rounded-lg border-2 border-blue-400 shadow-lg">
            {/* Profile section */}
            <div className="flex items-center p-2">
              {/* Avatar */}
              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center mr-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              
              {/* Text lines */}
              <div className="flex-1">
                <div className="h-1 bg-gray-300 rounded mb-1"></div>
                <div className="h-1 bg-gray-300 rounded mb-1"></div>
                <div className="h-1 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Labels */}
        <div className="absolute -left-16 top-4">
          <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium mb-2">
            Name
          </div>
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
            ID #
          </div>
        </div>

        <div className="absolute -right-16 top-4">
          <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium mb-2">
            John Doe
          </div>
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium mb-2">
            123-456
          </div>
          <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-medium mb-2">
            12/08/94
          </div>
          <div className="bg-blue-800 text-white px-2 py-1 rounded text-xs font-medium">
            12 Street
          </div>
        </div>
      </div>

      {/* Loading Animation */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  )
}

export default DataSearchLoader
