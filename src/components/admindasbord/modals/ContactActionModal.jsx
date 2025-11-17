import React from 'react'

const ACTIONS = [
  {
    type: 'call',
    label: 'Call',
    bg: '',
    iconColor: 'text-white',
    style: { backgroundColor: '#103a94' },
    hoverStyle: { backgroundColor: '#0d2f7a' },
    renderIcon: () => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    )
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    bg: 'bg-green-100',
    iconColor: 'text-green-600',
    renderIcon: () => (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.04 2C6.58 2 2.15 6.33 2.15 11.7c0 2.16.78 4.16 2.08 5.73l-1.38 4.26 4.43-1.4a10.06 10.06 0 004.76 1.23c5.46 0 9.89-4.33 9.89-9.7C22 6.33 17.57 2 12.11 2h-.07zm5.68 13.7c-.24.68-1.4 1.3-1.93 1.37-.49.07-1.08.1-1.74-.11-.4-.14-.9-.29-1.54-.57-2.71-1.18-4.48-3.86-4.61-4.05-.13-.18-1.1-1.45-1.1-2.76 0-1.3.69-1.94.94-2.21.24-.27.53-.34.7-.34h.5c.16 0 .38-.06.6.46.24.58.82 2 .88 2.14.07.14.12.31.02.5-.1.2-.15.31-.3.48-.15.18-.32.4-.46.53-.15.14-.3.29-.13.58.16.28.7 1.14 1.51 1.84 1.04.9 1.9 1.18 2.19 1.32.3.14.47.12.64-.07.17-.18.73-.76.93-1.02.2-.27.4-.2.67-.12.27.09 1.75.83 2.05.98.3.14.5.21.57.33.08.14.08.8-.16 1.48z" />
      </svg>
    )
  },
  {
    type: 'sms',
    label: 'SMS',
    bg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    renderIcon: () => (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 4H5a3 3 0 00-3 3v10a3 3 0 003 3h2v2.5a.5.5 0 00.8.4L11 20h8a3 3 0 003-3V7a3 3 0 00-3-3zm1 12a1 1 0 01-1 1h-8.5a1 1 0 00-.6.2L9 18.5V18a1 1 0 00-1-1H5a1 1 0 01-1-1V7a1 1 0 011-1h14a1 1 0 011 1z" />
      </svg>
    )
  }
]

const ContactActionModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-6 relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow hover:shadow-md text-gray-500 hover:text-gray-700 flex items-center justify-center text-xs sm:text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {ACTIONS.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={() => onSelect(action.type)}
              className="flex flex-col items-center justify-center gap-2"
            >
              <div 
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 ${action.bg} ${action.iconColor}`}
                style={action.style}
                onMouseEnter={
                  action.hoverStyle
                    ? (e) => {
                        e.currentTarget.style.backgroundColor = action.hoverStyle.backgroundColor
                      }
                    : undefined
                }
                onMouseLeave={
                  action.style
                    ? (e) => {
                        e.currentTarget.style.backgroundColor = action.style.backgroundColor
                      }
                    : undefined
                }
              >
                {action.renderIcon()}
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-gray-600">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ContactActionModal

