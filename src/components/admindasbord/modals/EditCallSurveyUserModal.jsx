import React, { useEffect, useState, useMemo } from 'react'
import apiService, { displayAllBoothForSaktiAllocation } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const EditCallSurveyUserModal = ({ isOpen, onClose, onSuccess, user, allUsers = [] }) => {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [boothNumbersText, setBoothNumbersText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBoothPicker, setShowBoothPicker] = useState(false)
  const [booths, setBooths] = useState([])
  const [loadingBooths, setLoadingBooths] = useState(false)
  const [selectedBooths, setSelectedBooths] = useState([])
  const [sessionSelected, setSessionSelected] = useState([])
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoBase64, setPhotoBase64] = useState('')

  // Get all booths assigned to other users (excluding current user)
  const assignedBooths = useMemo(() => {
    const currentUserId = user?.id || user?.adminId
    const assignedSet = new Set()
    
    allUsers.forEach(u => {
      const userId = u.id || u.adminId
      // Skip current user's booths
      if (userId !== currentUserId && u.boothNumbers) {
        u.boothNumbers.forEach(booth => {
          if (booth !== null && booth !== undefined) {
            assignedSet.add(Number(booth))
          }
        })
      }
    })
    
    return assignedSet
  }, [allUsers, user])

  // Initialize form with user data when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '')
      setMobile(user.phoneNumber || '')
      const boothText = user.boothNumbers && user.boothNumbers.length > 0 
        ? user.boothNumbers.join(',') + ',' 
        : ''
      setBoothNumbersText(boothText)
      setSelectedBooths(user.boothNumbers || [])
      // Set photo preview if available
      if (user.photoPath || user.profileImage) {
        setPhotoPreview(user.photoPath || user.profileImage)
      } else {
        setPhotoPreview('')
      }
      setPhotoBase64('')
    }
  }, [isOpen, user])

  useEffect(() => {
    const loadBooths = async () => {
      try {
        setLoadingBooths(true)
        const userData = localStorageManager.getUserData()
        const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
        const result = await displayAllBoothForSaktiAllocation('cl', panelApiUrl)
        const numbers = Array.isArray(result)
          ? result.map((b) => Number(b.booth_no || b.boothNo || b.number || b)).filter((n) => !isNaN(n))
          : []
        // Remove duplicates by converting to Set and back to array, then sort
        const uniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b)
        setBooths(uniqueNumbers.map((n, idx) => ({ id: `${idx}-${n}`, number: n })))
      } catch (e) {
        console.warn('Failed to fetch booths for CL:', e)
      } finally {
        setLoadingBooths(false)
      }
    }
    if (isOpen) loadBooths()
  }, [isOpen])

  if (!isOpen || !user) return null

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Remove non-digits
    if (value.length <= 10) {
      setMobile(value)
    }
  }

  const validateMobile = (mobileNumber) => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      return false
    }
    const firstDigit = mobileNumber.charAt(0)
    return firstDigit === '6' || firstDigit === '9'
  }

  const handleSubmit = async () => {
    // Validate name first
    if (!name.trim()) {
      alert('Name is required')
      return
    }
    
    // Validate mobile number exists
    if (!mobile.trim()) {
      alert('Mobile number is required')
      return
    }
    
    // Validate mobile number format
    if (!validateMobile(mobile)) {
      alert('Invalid mobile number')
      return
    }

    try {
      setIsSubmitting(true)
      const cleaned = (boothNumbersText || '').replace(/\s/g, '')
      const parts = cleaned.split(',').filter(Boolean)
      const boothCsv = parts.slice(0, 5).join(',')

      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      await apiService.updateAdmin({
        admin_id: user.id || user.adminId,
        type: 'cl',
        sub_type: 'cl',
        name,
        mobile_no: mobile,
        photo: photoPreview || '',
        base64: photoBase64 || '',
        idcard_no: '',
        booth_javabdari: boothCsv || '0',
        page_javabdari: '',
        add: '',
        modify_by: '1'
      }, panelApiUrl)
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (e) {
      alert(e.message || 'Failed to update Call Survey User')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSelectPhoto = async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      setPhotoPreview(typeof result === 'string' ? result : '')
      const base64 = typeof result === 'string' ? result.split(',')[1] || '' : ''
      setPhotoBase64(base64)
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-5 py-4 text-white" style={{backgroundColor:'#103a94'}}>
            <div className="flex items-center">
              <button onClick={onClose} className="w-8 h-8 mr-2 flex items-center justify-center hover:bg-white/10 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <h2 className="flex-1 text-center font-bold tracking-wide">कॉल सेंटर सर्वे संपादित करें</h2>
              <div className="w-8" />
            </div>
          </div>

          <div className="px-5 py-5 space-y-5" style={{backgroundColor:'#f4f6ff'}}>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">बूथ की जिम्मेदारी</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">बूथ नं.</label>
                <input value={boothNumbersText} onChange={(e)=>setBoothNumbersText(e.target.value)} placeholder="1,2,3,4,5," className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <p className="text-[11px] text-gray-500 mt-1">पहले 5 नंबर सेव होंगे</p>
                <div className="flex justify-end mt-2">
                  <button type="button" onClick={() => { setSessionSelected([]); setShowBoothPicker(true) }} className="px-3 py-2 rounded-md text-white shadow" style={{backgroundColor:'#103a94'}}>बूथ चुनें</button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">नाम</label>
              <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="" className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">मोबाइल नं.</label>
              <input value={mobile} onChange={handleMobileChange} maxLength={10} placeholder="" className="w-full h-11 px-3 rounded-md border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{color: '#103a94'}}>
                फोटो
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onSelectPhoto(e.target.files && e.target.files[0])}
                  className="hidden"
                  id="edit-callsurvey-photo-upload"
                />
                <label
                  htmlFor="edit-callsurvey-photo-upload"
                  className="w-full h-24 sm:h-32 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all"
                  style={{backgroundColor: '#f0f4ff', borderColor: '#103a94'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e6f0ff'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f4ff'}
                >
                  {photoPreview ? (
                    <div className="text-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-xs sm:text-sm text-gray-600">Photo Selected</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#103a94'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-xs sm:text-sm" style={{color: '#103a94'}}>Click to upload photo</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button disabled={isSubmitting} onClick={handleSubmit} className="w-full h-12 rounded-md text-white font-semibold shadow disabled:opacity-60" style={{backgroundColor:'#103a94'}}>
              अपडेट करें
            </button>
          </div>
        </div>
      </div>

      {showBoothPicker && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-blue-800 text-white flex items-center justify-between px-4 py-3">
              <button onClick={() => setShowBoothPicker(false)} className="w-8 h-8 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <h3 className="font-bold">बूथ</h3>
              <div className="w-8" />
            </div>
            <div className="p-3 max-h-[60vh] overflow-auto grid grid-cols-4 gap-3">
              {(loadingBooths ? Array.from({ length: 8 }, (_, i) => ({ id: `s-${i}`, number: null })) : booths).map(item => {
                const num = item.number
                const isSelected = num !== null && selectedBooths.includes(num)
                const isAtLimit = selectedBooths.length >= 5
                const isNewlySelected = num !== null && sessionSelected.includes(num)
                const isAssignedToOtherUser = num !== null && assignedBooths.has(num)
                const isDisabled = isSelected || isAssignedToOtherUser
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (num === null || isDisabled) return
                      setSelectedBooths(prev => {
                        if (prev.includes(num) || prev.length >= 5) return prev
                        const next = [...prev, num].sort((a,b)=>a-b)
                        setBoothNumbersText(next.join(',') + (next.length ? ',' : ''))
                        return next
                      })
                      setSessionSelected(prev => prev.includes(num) ? prev : [...prev, num])
                    }}
                    disabled={isDisabled}
                    className={`rounded-xl border py-4 text-sm font-semibold ${num===null ? 'animate-pulse opacity-60' : ''}`}
                    style={
                      isSelected
                        ? (isNewlySelected
                            ? { backgroundColor: '#103a94', color: '#ffffff', borderColor: '#103a94', cursor: 'not-allowed' }
                            : { backgroundColor: '#d1d5db', color: '#111827', borderColor: '#d1d5db', cursor: 'not-allowed' })
                        : isAssignedToOtherUser
                        ? { backgroundColor: '#d1d5db', color: '#111827', borderColor: '#d1d5db', cursor: 'not-allowed' }
                        : { backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#e5e7eb' }
                    }
                  >
                    {num===null ? '…' : num}
                  </button>
                ) 
              })}
            </div>
            <div className="bg-blue-800 p-3">
              <button onClick={() => setShowBoothPicker(false)} className="w-full py-3 rounded-lg text-white font-semibold">
                बूथ चुनें
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EditCallSurveyUserModal

