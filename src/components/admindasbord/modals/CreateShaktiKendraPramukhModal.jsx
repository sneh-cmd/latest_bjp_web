import React, { useState, useEffect } from 'react'
import apiService, { displayAllBoothForSaktiAllocation } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'

const CreateShaktiKendraPramukhModal = ({ isOpen, onClose, onSuccess, editData = null, mode = 'create', alreadyAssignedBooths = [] }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBooths, setSelectedBooths] = useState([])
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [photo, setPhoto] = useState(null)
  const [showBoothPicker, setShowBoothPicker] = useState(false)
  const [booths, setBooths] = useState([])
  const [loadingBooths, setLoadingBooths] = useState(false)

  // Update form when editData changes
  useEffect(() => {
    if (editData && mode === 'edit') {
      setName(editData.name || '')
      setMobile(editData.phoneNumber || editData.mobile || '')
      // Convert booth numbers to numbers if they're strings
      const boothNumbers = editData.boothNumbers || []
      setSelectedBooths(boothNumbers.map(booth => typeof booth === 'string' ? parseInt(booth.trim(), 10) : booth).filter(booth => !isNaN(booth)))
      setPhoto(null) // Reset photo, user can upload new one if needed
    } else {
      // Reset form for create mode
      setName('')
      setMobile('')
      setSelectedBooths([])
      setPhoto(null)
    }
  }, [editData, mode, isOpen])

  if (!isOpen) return null

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) setPhoto(file)
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async () => {
    const booth_javabdari = selectedBooths.join(',')
    
    // Convert photo to base64 if present
    let photoBase64 = ''
    let photoName = ''
    if (photo) {
      try {
        const base64String = await convertFileToBase64(photo)
        // Remove data URL prefix if present (data:image/...;base64,)
        photoBase64 = base64String.replace(/^data:image\/[a-z]+;base64,/, '')
        photoName = photo.name
      } catch (error) {
        console.error('Error converting photo to base64:', error)
        alert('Failed to process photo. Please try again.')
        return
      }
    }

    try {
      setIsSubmitting(true)
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
      
      if (mode === 'edit' && editData) {
        // Update existing pramukh
        await apiService.updateAdmin({
          admin_id: editData.id || editData.adminId,
          type: 'SP',
          sub_type: 'SP',
          name: name,
          mobile_no: mobile,
          photo: photoName || editData.photo || '',
          base64: photoBase64,
          idcard_no: '',
          booth_javabdari: booth_javabdari || '0',
          page_javabdari: '',
          add: '',
          modify_by: '1'
        }, panelApiUrl)
      } else {
        // Create new pramukh
        await apiService.insertAdmin({
          type: 'SP',
          sub_type: 'SP',
          main_admin_id: '0',
          name: name,
          mobile_no: mobile,
          photo: photoName,
          base64: photoBase64,
          idcard_no: '',
          booth_javabdari: booth_javabdari || '0',
          page_javabdari: '',
          add: ''
        }, panelApiUrl)
      }
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (e) {
      alert(e.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} Shakti Kendra Pramukh`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-800 p-4 text-white">
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <h2 className="text-lg font-bold">
            {mode === 'edit' ? 'शक्ति केन्द्र प्रमुख संपादित करें' : 'शक्ति केन्द्र प्रमुख'}
          </h2>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm font-semibold mb-2">बूथ की जिम्मेदारी</p>
            <label className="block text-sm mb-1">बूथ नं.</label>
            <input
              type="text"
              value={(selectedBooths.map(n => `${n},`).join(' ')).trim()}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\s/g, '')
                const parts = cleaned.split(',').filter(Boolean)
                const nums = []
                parts.forEach(p => {
                  const n = parseInt(p, 10)
                  if (!isNaN(n)) nums.push(n)
                })
                setSelectedBooths(Array.from(new Set(nums)))
              }}
              className="w-full px-3 py-2 rounded-md border bg-white"
              placeholder="बूथ नं."
            />
          <button onClick={async () => {
            setShowBoothPicker(true)
            try {
              setLoadingBooths(true)
              const userData = localStorageManager.getUserData()
              const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'
              const result = await displayAllBoothForSaktiAllocation('SP', panelApiUrl)
              const raw = Array.isArray(result) ? result.map((b, idx) => {
                const n = Number(b.booth_no || b.boothNo || b.number || b)
                return { id: `${idx}-${n}`, number: n }
              }).filter(x => !isNaN(x.number)) : []
              // compute duplicates by frequency and mark them
              const freq = raw.reduce((m, it) => { const k = it.number; m[k] = (m[k]||0)+1; return m }, {})
              const mapped = raw.map(it => ({ ...it, isDuplicate: (freq[it.number]||0) > 1 }))
              setBooths(mapped)
            } finally {
              setLoadingBooths(false)
            }
          }} className="mt-2 px-3 py-2 rounded-md text-white" style={{backgroundColor:'#103a94'}}>
            बूथ चुनें
          </button>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">नाम</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-white"
              placeholder="नाम"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">मोबाइल नं.</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-white"
              placeholder="मोबाइल नं."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">फोटो</label>
            <div className="flex items-center space-x-3">
              <div className="w-20 h-20 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden">
                {photo ? (
                  <img src={URL.createObjectURL(photo)} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                )}
              </div>
              <label className="px-3 py-2 rounded-md text-white cursor-pointer" style={{backgroundColor:'#103a94'}}>
                Upload
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden"/>
              </label>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={isSubmitting} className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-60" style={{backgroundColor:'#0a67c2'}}>
            {mode === 'edit' ? 'शक्ति केन्द्र प्रमुख अपडेट करें' : 'शक्ति केन्द्र प्रमुख बनाए'}
          </button>
        </div>
      </div>
    </div>
    {showBoothPicker && (
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3">
        <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-blue-800 text-white flex items-center justify-between px-4 py-3">
            <button onClick={() => setShowBoothPicker(false)} className="w-8 h-8 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            </button>
            <h3 className="font-bold">बूथ</h3>
            <div className="w-8" />
          </div>
          <div className="p-3 max-h-[60vh] overflow-auto grid grid-cols-4 gap-3">
            {(loadingBooths ? Array.from({ length: 8 }, (_, i) => ({ id: `s-${i}`, number: null, isDuplicate: false })) : booths).map(item => {
              const num = item.number
              const isSelected = num !== null && selectedBooths.includes(num)
              const isDuplicate = !!item.isDuplicate
              const isAlreadyAssigned = num !== null && alreadyAssignedBooths.includes(num)
              const isDisabled = isSelected || isDuplicate || isAlreadyAssigned || num === null
              return (
              <button
                key={item.id}
                disabled={isDisabled}
                onClick={() => {
                  if (num === null || isDuplicate || isSelected || isAlreadyAssigned) return
                  setSelectedBooths(prev => {
                    if (prev.includes(num)) {
                      return prev.filter(n => n !== num)
                    }
                      return [...prev, num].sort((a,b)=>a-b)
                  })
                }}
                className={`rounded-xl border py-4 text-sm font-semibold ${num===null ? 'animate-pulse opacity-60' : ''}`}
                style={
                  isSelected
                    ? { backgroundColor: '#103a94', color: '#ffffff', borderColor: '#103a94', cursor: 'not-allowed' }
                    : isDuplicate || isAlreadyAssigned
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

export default CreateShaktiKendraPramukhModal


