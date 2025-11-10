import React, { useState, useEffect } from 'react'
import { apiService } from '../../../apidata.jsx'
import localStorageManager from '../../../utils/localStorage.js'
import RemovePhotoConfirmModal from './RemovePhotoConfirmModal.jsx'
import DuplicateMobileModal from './DuplicateMobileModal.jsx'

const AddBuildingCoInchargeModal = ({
  isOpen,
  onClose,
  onSave,
  onSuccess,
  buildingId,
  person = null,
  existingMobiles = [],
  duplicateContextLabel = 'बिल्डिंग सह इनचार्ज',
  duplicateMessage = ''
}) => {
  const isEditMode = !!person
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    photo: null
  })
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null)
  const [photoBase64, setPhotoBase64] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [duplicateModal, setDuplicateModal] = useState({ isOpen: false, mobile: '', message: '' })

  const resetForm = () => {
    setFormData({ name: '', phone: '', photo: null })
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setPhotoBase64('')
    setPhotoName('')
    setPhotoRemoved(false)
    setShowRemoveConfirm(false)
    const addInput = document.getElementById('building-coincharge-photo-input')
    if (addInput) addInput.value = ''
    const editInput = document.getElementById('edit-building-coincharge-photo-input')
    if (editInput) editInput.value = ''
  }

  const resolveExistingPhotoUrl = (entity) => {
    if (!entity) return null

    const ensureBaseUrl = (url) => {
      const fallback = 'http://ntmc2.mhbjplok.com'
      if (!url) return fallback
      let normalized = url.toString().trim()
      if (!normalized) return fallback
      if (/\/webservice\.asmx$/i.test(normalized)) {
        normalized = normalized.replace(/\/webservice\.asmx$/i, '')
      }
      if (!/^https?:\/\//i.test(normalized)) {
        if (normalized.startsWith('//')) {
          normalized = `https:${normalized}`
        } else {
          normalized = `http://${normalized.replace(/^\/+/, '')}`
        }
      }
      return normalized.replace(/\/$/, '') || fallback
    }

    const userData = localStorageManager.getUserData()
    const baseUrl = ensureBaseUrl(userData?.panel?.apiUrl)

    const normalizeCandidate = (value) => {
      if (value == null) return null
      const str = value.toString().trim()
      if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return null
      if (str.startsWith('data:image')) return str
      if (/^[A-Za-z0-9+/=]{60,}$/.test(str)) return `data:image/jpeg;base64,${str}`
      if (/^https?:\/\//i.test(str)) return str
      if (str.startsWith('//')) return `https:${str}`
      if (str.startsWith('blob:')) return str

      let path = str.replace(/\\/g, '/').replace(/^\.\/+/, '')
      if (/^\/?img\//i.test(path)) {
        if (!path.startsWith('/')) path = `/${path}`
        return `${baseUrl}${path}`
      }
      if (/^\/upload_/i.test(path) || /^\/.*\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(path)) {
        return `${baseUrl}${path}`
      }
      if (/^upload_/i.test(path)) {
        return `${baseUrl}/${path}`
      }
      if (path.startsWith('/')) {
        return `${baseUrl}${path}`
      }
      return `${baseUrl}/${path}`
    }

    const { profileImage, photoPath, photo } = entity
    const candidates = [
      profileImage,
      photoPath,
      photo
    ]

    for (const candidate of candidates) {
      const normalized = normalizeCandidate(candidate)
      if (normalized) return normalized
    }
    return null
  }

  useEffect(() => {
    if (!isOpen) {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
      resetForm()
      return
    }

    if (isEditMode && person) {
      setFormData({
        name: person.name || '',
        phone: person.phone || person.phoneNumber || person.mobile_no || person.mobileNo || '',
        photo: null
      })
      const resolved = resolveExistingPhotoUrl(person)
      setExistingPhotoUrl(resolved)
      setPhotoPreview(resolved)
      setPhotoBase64('')
      setPhotoName(person?.photoPath || person?.profileImage || person?.photo || '')
      setPhotoRemoved(false)
      const inputId = isEditMode ? 'edit-building-coincharge-photo-input' : 'building-coincharge-photo-input'
      const fileInput = document.getElementById(inputId)
      if (fileInput) fileInput.value = ''
    } else {
      resetForm()
    }
  }, [isOpen, isEditMode, person])

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'phone') {
      // Only allow digits and max 10 digits
      const digitsOnly = value.replace(/\D/g, '')
      if (digitsOnly.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: digitsOnly }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const validateMobile = (mobileNumber) => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      return false
    }
    const firstDigit = mobileNumber.charAt(0)
    return firstDigit === '6' || firstDigit === '9'
  }

  const normalizeMobileNumber = (value) => {
    if (!value) return ''
    const digits = value.toString().replace(/\D/g, '')
    if (digits.length > 10) {
      return digits.slice(-10)
    }
    return digits
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }

    setFormData(prev => ({ ...prev, photo: file }))
    setPhotoRemoved(false)
    setShowRemoveConfirm(false)
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
    setExistingPhotoUrl(null)

    try {
      const base64String = await convertFileToBase64(file)
      const cleanedBase64 = base64String.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
      setPhotoBase64(cleanedBase64)
      setPhotoName(sanitizeFileName(file.name))
    } catch (error) {
      console.error('Error converting photo to base64:', error)
      alert('फोटो प्रोसेस करने में त्रुटि. कृपया पुनः प्रयास करें.')
      setPhotoBase64('')
      setPhotoName('')
    }
  }

  const handleRemovePhotoClick = () => {
    setShowRemoveConfirm(true)
  }

  const handleRemovePhotoConfirm = () => {
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }
    setFormData(prev => ({ ...prev, photo: null }))
    setPhotoPreview(null)
    setExistingPhotoUrl(null)
    setPhotoBase64('')
    setPhotoName('')
    setPhotoRemoved(true)
    const inputId = isEditMode ? 'edit-building-coincharge-photo-input' : 'building-coincharge-photo-input'
    const fileInput = document.getElementById(inputId)
    if (fileInput) fileInput.value = ''
    setShowRemoveConfirm(false)
  }

  const handleRemovePhotoCancel = () => {
    setShowRemoveConfirm(false)
  }

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = error => reject(error)
    })
  }

  const sanitizeFileName = (fileName = '') => {
    if (!fileName) return ''
    const timestamp = Date.now()
    const dotIndex = fileName.lastIndexOf('.')
    const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName
    const ext = dotIndex > 0 ? fileName.slice(dotIndex).toLowerCase() : ''
    const safeBase = base
      .toString()
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase() || 'photo'
    return `coincharge_${timestamp}_${safeBase}${ext}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (duplicateModal.isOpen) {
      setDuplicateModal({ isOpen: false, mobile: '', message: '' })
    }

    // Validate name first
    if (!formData.name.trim()) {
      alert('Name is required')
      return
    }

    // Validate mobile number exists
    if (!formData.phone.trim()) {
      alert('Mobile number is required')
      return
    }

    // Validate mobile number format
    if (!validateMobile(formData.phone)) {
      alert('Invalid mobile number')
      return
    }

    const normalizedMobile = normalizeMobileNumber(formData.phone)
    const sanitizedExistingMobiles = Array.isArray(existingMobiles)
      ? existingMobiles.map(normalizeMobileNumber).filter(Boolean)
      : []
    const originalMobile = isEditMode
      ? normalizeMobileNumber(
          person?.phone ||
          person?.phoneNumber ||
          person?.mobile_no ||
          person?.mobileNo ||
          person?.mobile
        )
      : ''

    const isDuplicateMobile = normalizedMobile &&
      sanitizedExistingMobiles.includes(normalizedMobile) &&
      !(isEditMode && normalizedMobile === originalMobile)

    if (isDuplicateMobile) {
      const messageToShow = duplicateMessage || `यह मोबाइल नंबर पहले से ही ${duplicateContextLabel} में उपयोग किया जा चुका है।`
      setDuplicateModal({
        isOpen: true,
        mobile: normalizedMobile,
        message: messageToShow
      })
      return
    }

    setLoading(true)
    try {
      // Get or fallback to default API URL
      const userData = localStorageManager.getUserData()
      const panelApiUrl = userData?.panel?.apiUrl || 'http://ntmc2.mhbjplok.com'

      // Get login ID (admin ID) from user data for create_by field
      const loginId = userData?.admin?.adminId || userData?.admin?.id || '1'

      let finalPhotoName = ''
      let finalPhotoBase64 = ''

      if (formData.photo) {
        finalPhotoName = photoName || sanitizeFileName(formData.photo.name)
        finalPhotoBase64 = photoBase64
        if (!finalPhotoBase64) {
          const base64String = await convertFileToBase64(formData.photo)
          finalPhotoBase64 = base64String.replace(/^data:image\/[a-zA-Z]+;base64,/, '')
        }
      }

      if (isEditMode) {
        const adminId = person?.id || person?.admin_id || person?.adminId
        if (!adminId) {
          throw new Error('Invalid co-incharge data for edit (missing admin_id).')
        }

        if (photoRemoved) {
          finalPhotoName = ''
          finalPhotoBase64 = ''
        } else if (!formData.photo) {
          finalPhotoName = person.photoPath || person.profileImage || person.photo || ''
          finalPhotoBase64 = ''
        }

        const updateData = {
          admin_id: adminId,
          type: 'AP',
          sub_type: 'AS',
          name: formData.name.trim(),
          mobile_no: formData.phone.trim(),
          photo: finalPhotoName || '',
          base64: finalPhotoBase64 || '',
          idcard_no: '0',
          booth_javabdari: '0',
          page_javabdari: '0',
          add: '',
          modify_by: loginId
        }

        console.log('📤 Updating building co-incharge data:', updateData)

        const response = await apiService.updateAdmin(updateData, panelApiUrl)

        if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
          if (onSuccess) {
            onSuccess()
          } else if (onSave) {
            onSave({ ...formData, apiResponse: response })
          }
          resetForm()
          onClose && onClose()
        } else {
          console.error('Update building co-incharge unexpected response:', response)
          throw new Error('Failed to update building co-incharge')
        }
      } else {
        // Prepare data for API - Building Co Incharge
        let buildingMainAdminId = '0'

        if (buildingId) {
          const idStr = String(buildingId).trim()
          if (idStr && idStr !== '0' && idStr !== '1' && idStr.toLowerCase() !== 'undefined' && idStr.toLowerCase() !== 'null') {
            buildingMainAdminId = idStr
          }
        }

        if (buildingMainAdminId === '0') {
          console.warn('⚠️ WARNING: Building ID is invalid or not provided!', {
            buildingId,
            type: typeof buildingId,
            buildingMainAdminId
          })
          const userConfirm = confirm('⚠️ Building ID नहीं मिला!\n\nCo-incharge बिल्डिंग से link नहीं होगा.\n\nफिर भी save करें?')
          if (!userConfirm) {
            setLoading(false)
            return
          }
        }

        const adminData = {
          type: 'AP',
          sub_type: 'AS',
          main_admin_id: buildingMainAdminId,
          name: formData.name.trim(),
          mobile_no: formData.phone.trim(),
          photo: finalPhotoName || '',
          base64: finalPhotoBase64 || '',
          idcard_no: '0',
          booth_javabdari: '0',
          page_javabdari: '0',
          add: '',
          create_by: loginId
        }

        console.log('✅ Submitting building co-incharge data:', adminData)

        const response = await apiService.insertAdmin(adminData, panelApiUrl)

        if (response && (response.success || response?.Column1 === 'ok' || (Array.isArray(response) && response[0]?.Column1 === 'ok'))) {
          if (onSave) {
            onSave({
              ...formData,
              buildingId: buildingId || buildingMainAdminId,
              main_admin_id: buildingMainAdminId,
              apiResponse: response
            })
          }

          resetForm()
          onClose && onClose()
        } else {
          console.error('Insert building co-incharge unexpected response:', response)
          throw new Error('Failed to save building co-incharge')
        }
      }
    } catch (error) {
      console.error('Error saving building co-incharge:', error)
      alert('बिल्डिंग सह इनचार्ज सेव करने में विफल. कृपया पुन: प्रयास करें.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto z-[125]">
        <div className="p-3 sm:p-5 text-white" style={{ backgroundColor: '#103a94' }}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all hover:scale-105"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">{isEditMode ? 'बिल्डिंग सह इनचार्ज संपादित करें' : 'बिल्डिंग सह इनचार्ज'}</h2>
              <p className="text-blue-100 text-xs sm:text-sm">
                {isEditMode ? 'Edit Building Co-Incharge' : 'Create New Building Co-Incharge'}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 space-y-3 sm:space-y-4"
          style={{ backgroundColor: '#f4f6ff' }}
          noValidate
        >
          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#103a94' }}>
              नाम
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{ backgroundColor: '#f0f4ff', borderColor: '#103a94' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#103a94'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#103a94'
              }}
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#103a94' }}>
              मोबाइल नं.
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              className="w-full px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg border focus:outline-none focus:bg-white transition-all text-gray-800 text-sm sm:text-base"
              style={{ backgroundColor: '#f0f4ff', borderColor: '#103a94' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#103a94'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#103a94'
              }}
              placeholder="Enter mobile number"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2" style={{ color: '#103a94' }}>
              फोटो
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id={isEditMode ? 'edit-building-coincharge-photo-input' : 'building-coincharge-photo-input'}
              />
              {photoPreview ? (
                <div className="relative">
                  <label
                    htmlFor={isEditMode ? 'edit-building-coincharge-photo-input' : 'building-coincharge-photo-input'}
                    className="block w-full h-28 sm:h-32 rounded-lg border overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer transition-all hover:bg-gray-100"
                    style={{ borderColor: '#103a94' }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#0d2f7a'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#103a94'
                    }}
                  >
                    <img
                      src={photoPreview}
                      alt="Photo preview - Click to change"
                      className="max-w-full max-h-full object-contain"
                    />
                  </label>
                  <div className="mt-1.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleRemovePhotoClick}
                      className="text-red-600 text-xs sm:text-sm hover:text-red-700 transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Remove Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor={isEditMode ? 'edit-building-coincharge-photo-input' : 'building-coincharge-photo-input'}
                  className="w-full h-20 sm:h-28 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all"
                  style={{ backgroundColor: '#f0f4ff', borderColor: '#103a94' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e6f0ff'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f0f4ff'
                  }}
                >
                  <div className="text-center">
                    <svg
                      className="w-5 h-5 sm:w-7 sm:h-7 mx-auto mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: '#103a94' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-xs sm:text-sm" style={{ color: '#103a94' }}>
                      Click to upload photo
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-xl transition-all flex items-center justify-center shadow-sm hover:shadow-md text-sm sm:text-base disabled:opacity-60"
              style={{ backgroundColor: '#103a94' }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#0d2f7a'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#103a94'
                }
              }}
            >
              {loading ? 'सेव हो रहा है...' : isEditMode ? 'बिल्डिंग सह इनचार्ज अपडेट करें' : 'बिल्डिंग सह इनचार्ज सेव करें'}
            </button>
          </div>
        </form>
      </div>
    </div>

    <RemovePhotoConfirmModal
      isOpen={showRemoveConfirm}
      onConfirm={handleRemovePhotoConfirm}
      onCancel={handleRemovePhotoCancel}
      zIndex={200}
    />
    <DuplicateMobileModal
      isOpen={duplicateModal.isOpen}
      mobileNumber={duplicateModal.mobile}
      message={duplicateModal.message}
      onClose={() => setDuplicateModal({ isOpen: false, mobile: '', message: '' })}
    />
  </>
)
}

export default AddBuildingCoInchargeModal

