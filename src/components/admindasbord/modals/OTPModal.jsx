import React, { useState, useEffect, useRef } from 'react'

const OTPModal = ({ isOpen, phoneNumber, onClose, onVerify, onEditPhone, onResendOTP, isVerifying }) => {
  const [otp, setOtp] = useState('')
  const [resendTimer, setResendTimer] = useState(59)
  const [canResend, setCanResend] = useState(false)
  const otpInputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setOtp('')
      setResendTimer(59)
      setCanResend(false)
      // Focus on OTP input after modal opens
      setTimeout(() => {
        if (otpInputRef.current) {
          otpInputRef.current.focus()
        }
      }, 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && resendTimer > 0) {
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isOpen, resendTimer])

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
  }

  const handleVerify = () => {
    if (otp.length === 6 && !isVerifying) {
      onVerify(otp)
    }
  }

  const handleResend = async () => {
    if (canResend && onResendOTP) {
      try {
        await onResendOTP()
        setResendTimer(59)
        setCanResend(false)
        setOtp('')
        if (otpInputRef.current) {
          otpInputRef.current.focus()
        }
      } catch (error) {
        console.error('Failed to resend OTP:', error)
      }
    }
  }

  const formatPhoneNumber = (phone) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
    }
    return `+91 ${cleaned}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1060] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-gray-800 text-sm sm:text-base font-medium">
            6 Digit OTP has been sent to
          </p>
        </div>

        {/* Phone Number with Edit Icon */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <p className="text-green-600 text-base sm:text-lg font-semibold">
            {formatPhoneNumber(phoneNumber)}
          </p>
          {onEditPhone && (
            <button
              onClick={onEditPhone}
              className="p-1 hover:bg-green-50 rounded-full transition-colors"
              type="button"
            >
              <svg 
                className="w-4 h-4 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                />
              </svg>
            </button>
          )}
        </div>

        {/* OTP Input Field */}
        <div className="mb-6">
          <input
            ref={otpInputRef}
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={handleOtpChange}
            placeholder="Enter 6 digit OTP"
            className="w-full px-4 py-4 text-center text-xl sm:text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            maxLength={6}
          />
        </div>

        {/* Login Button */}
        <div className="mb-4">
          <button
            onClick={handleVerify}
            disabled={otp.length !== 6 || isVerifying}
            type="button"
            className={`w-full py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
              otp.length === 6 && !isVerifying
                ? 'bg-[#102463] text-white shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            style={{
              backgroundColor: otp.length === 6 && !isVerifying ? '#102463' : undefined
            }}
          >
            {isVerifying ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'लॉग इन करें'
            )}
          </button>
        </div>

        {/* Resend OTP */}
        <div className="text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              className="text-blue-600 text-sm font-medium hover:underline"
              type="button"
            >
              Resend OTP
            </button>
          ) : (
            <p className="text-gray-500 text-sm">
              Resend otp in {resendTimer} seconds
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default OTPModal

