import React, { useEffect, useRef, useState, useCallback } from 'react'
import { apiService } from '../../../../apidata'

const CadreSurveyReport = ({ navigation }) => {
  const { navigate } = navigation
  const containerRef = useRef(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleBack = () => {
    navigate('/admin')
  }

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Fetch survey dashboard data from API
  const fetchSurveyDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const endpoint = import.meta.env.DEV 
        ? '/panel-api/webservice.asmx' 
        : 'http://ntmc2.mhbjplok.com/webservice.asmx'
      
      const soapAction = 'dis_admin_survey_dashboard'
      const soapBody = '<dis_admin_survey_dashboard xmlns="http://tempuri.org/" />'
      
      const data = await apiService.makeRequest(
        endpoint,
        'POST',
        soapAction,
        soapBody,
        true // useAdminAuth = true for admin APIs
      )
      
      console.log('Survey Dashboard Data (raw):', data)
      console.log('Data type:', typeof data)
      console.log('Is array:', Array.isArray(data))
      
      // The API service already processes the data, so use it directly
      // No need for additional processing as apidata.jsx handles it
      console.log('Setting dashboard data:', data)
      console.log('result3 fields check:', {
        shakti_kendra: data?.shakti_kendra,
        booth_pramukh: data?.booth_pramukh,
        building_head: data?.building_head,
        phonebook: data?.phonebook,
        other: data?.other
      })
      
      setDashboardData(data)
    } catch (err) {
      console.error('Error fetching survey dashboard:', err)
      setError(err.message || 'Failed to fetch survey dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Scroll event handler - Additional scroll tracking
  useEffect(() => {
    const handleScroll = (e) => {
      const scrollTop = e.target.scrollTop || 0
      const scrollHeight = e.target.scrollHeight || 0
      const clientHeight = e.target.clientHeight || 0
      
      // Calculate scroll percentage for analytics or other uses
      const scrollPercentage = scrollHeight > clientHeight 
        ? (scrollTop / (scrollHeight - clientHeight)) * 100 
        : 0
      
      // Optional: Add scroll-based effects here
      // console.log('Scroll percentage:', scrollPercentage.toFixed(2), '%')
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      
      return () => {
        if (container) {
          container.removeEventListener('scroll', handleScroll)
        }
      }
    }
  }, [])

  // Smooth scroll to top on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchSurveyDashboard()
  }, [fetchSurveyDashboard])

  // Survey Report Cards Data Array
  const surveyReportCards = [
    {
      id: 'booth-wise-survey',
      route: '/booth-wise-survey',
      label: 'बूथ अनुसार सर्वे',
      textColor: '#06b6d4',
      gradientFrom: 'from-white',
      gradientTo: 'to-cyan-50',
      borderColor: 'border-cyan-200',
      hoverBorderColor: 'hover:border-cyan-400',
      spaceY: 'space-y-2 sm:space-y-2.5 md:space-y-3',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="6" fill="#4a5568"/>
          <rect x="22" y="31" width="6" height="12" rx="3" fill="#4a5568"/>
          <rect x="20" y="43" width="3" height="8" rx="1.5" fill="#4a5568"/>
          <rect x="27" y="43" width="3" height="8" rx="1.5" fill="#4a5568"/>
          <rect x="35" y="18" width="48" height="68" rx="4" fill="#06b6d4" opacity="0.2" stroke="#06b6d4" strokeWidth="2.5"/>
          <rect x="38" y="12" width="42" height="10" rx="2" fill="#06b6d4" opacity="0.4"/>
          <line x1="42" y1="32" x2="75" y2="32" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="42" y1="42" x2="75" y2="42" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="42" y1="52" x2="75" y2="52" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="42" y1="62" x2="68" y2="62" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round"/>
          <rect x="40" y="29" width="5" height="5" rx="1" fill="#06b6d4" stroke="#06b6d4" strokeWidth="1.5"/>
          <rect x="40" y="39" width="5" height="5" rx="1" fill="#06b6d4" stroke="#06b6d4" strokeWidth="1.5"/>
          <rect x="40" y="49" width="5" height="5" rx="1" fill="#06b6d4" stroke="#06b6d4" strokeWidth="1.5"/>
          <rect x="70" y="45" width="8" height="2" rx="1" fill="#06b6d4" opacity="0.6"/>
          <path d="M72 50 L78 50 L77 48 L73 48 Z" fill="#06b6d4" opacity="0.6"/>
        </svg>
      )
    },
    {
      id: 'date-wise-survey',
      route: '/date-wise-survey',
      label: 'तारीख अनुसार सर्वे',
      textColor: '#f97316',
      gradientFrom: 'from-white',
      gradientTo: 'to-orange-50',
      borderColor: 'border-orange-200',
      hoverBorderColor: 'hover:border-orange-400',
      spaceY: 'space-y-1 sm:space-y-1.5 md:space-y-2',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="6" fill="#4a5568"/>
          <rect x="22" y="31" width="6" height="12" rx="3" fill="#4a5568"/>
          <rect x="20" y="43" width="3" height="8" rx="1.5" fill="#4a5568"/>
          <rect x="27" y="43" width="3" height="8" rx="1.5" fill="#4a5568"/>
          <rect x="35" y="18" width="52" height="65" rx="5" fill="white" stroke="#f97316" strokeWidth="3"/>
          <rect x="35" y="18" width="52" height="14" rx="5" fill="#f97316" opacity="0.9"/>
          <text x="61" y="29" textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">MAR</text>
          <line x1="48" y1="32" x2="48" y2="83" stroke="#f97316" strokeWidth="1.5" opacity="0.4"/>
          <line x1="61" y1="32" x2="61" y2="83" stroke="#f97316" strokeWidth="1.5" opacity="0.4"/>
          <line x1="74" y1="32" x2="74" y2="83" stroke="#f97316" strokeWidth="1.5" opacity="0.4"/>
          <line x1="38" y1="45" x2="87" y2="45" stroke="#f97316" strokeWidth="1.5" opacity="0.4"/>
          <line x1="38" y1="58" x2="87" y2="58" stroke="#f97316" strokeWidth="1.5" opacity="0.4"/>
          <line x1="38" y1="71" x2="87" y2="71" stroke="#f97316" strokeWidth="1.5" opacity="0.4"/>
          <text x="61" y="64" textAnchor="middle" fontSize="18" fill="#f97316" fontWeight="bold">15</text>
          <circle cx="61" cy="62" r="14" fill="#ef4444" opacity="0.25"/>
          <circle cx="61" cy="62" r="10" fill="#ef4444" opacity="0.35"/>
        </svg>
      )
    },
    {
      id: 'scheme-wise-survey',
      route: '/scheme-wise-survey',
      label: 'योजना अनुसार सर्वे',
      textColor: '#102463',
      gradientFrom: 'from-white',
      gradientTo: 'to-indigo-50',
      borderColor: 'border-indigo-200',
      hoverBorderColor: 'hover:border-indigo-400',
      spaceY: 'space-y-1.5 sm:space-y-2 md:space-y-3',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.95">
            <path d="M20 55 Q20 38 30 38 L38 38 Q48 38 48 55 L48 72 Q48 78 42 78 L26 78 Q20 78 20 72 Z" fill="#102463" stroke="#0a1e4a" strokeWidth="2"/>
            <circle cx="34" cy="48" r="4" fill="#f97316"/>
            <text x="34" y="56" textAnchor="middle" fontSize="10" fill="#f97316" fontWeight="bold">₹</text>
            <path d="M26 38 Q26 32 30 32" stroke="#0a1e4a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
          <g opacity="0.8">
            <path d="M32 60 Q32 43 42 43 L50 43 Q60 43 60 60 L60 77 Q60 83 54 83 L38 83 Q32 83 32 77 Z" fill="#102463" stroke="#0a1e4a" strokeWidth="2"/>
            <circle cx="46" cy="53" r="4" fill="#f97316"/>
            <text x="46" y="61" textAnchor="middle" fontSize="10" fill="#f97316" fontWeight="bold">₹</text>
            <path d="M38 43 Q38 37 42 37" stroke="#0a1e4a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
          <g opacity="0.65">
            <path d="M44 65 Q44 48 54 48 L62 48 Q72 48 72 65 L72 82 Q72 88 66 88 L50 88 Q44 88 44 82 Z" fill="#102463" stroke="#0a1e4a" strokeWidth="2"/>
            <circle cx="58" cy="58" r="4" fill="#f97316"/>
            <text x="58" y="66" textAnchor="middle" fontSize="10" fill="#f97316" fontWeight="bold">₹</text>
            <path d="M50 48 Q50 42 54 42" stroke="#0a1e4a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
        </svg>
      )
    },
    {
      id: 'ration-card-wise-survey',
      route: '/ration-card-wise-survey',
      label: 'राशन कार्ड अनुसार सर्वे',
      textColor: '#f59e0b',
      gradientFrom: 'from-white',
      gradientTo: 'to-amber-50',
      borderColor: 'border-amber-200',
      hoverBorderColor: 'hover:border-amber-400',
      spaceY: 'space-y-1.5 sm:space-y-2 md:space-y-3',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 65 Q20 55 25 55 Q30 55 30 65 Q30 75 25 75 Q20 75 20 65" fill="#fbbf24" opacity="0.7"/>
          <path d="M25 60 Q28 58 32 60 Q35 58 38 60" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <rect x="38" y="28" width="20" height="28" rx="2.5" fill="#3b82f6" stroke="#2563eb" strokeWidth="2"/>
          <rect x="42" y="26" width="20" height="28" rx="2.5" fill="#10b981" stroke="#059669" strokeWidth="2"/>
          <rect x="46" y="24" width="20" height="28" rx="2.5" fill="#f59e0b" stroke="#d97706" strokeWidth="2"/>
          <rect x="41" y="32" width="16" height="2.5" rx="1" fill="white" opacity="0.9"/>
          <rect x="41" y="37" width="12" height="2" rx="1" fill="white" opacity="0.7"/>
          <rect x="45" y="37" width="12" height="2" rx="1" fill="white" opacity="0.7"/>
          <rect x="43" y="41" width="14" height="2" rx="1" fill="white" opacity="0.7"/>
        </svg>
      )
    },
    {
      id: 'community-wise-survey',
      route: '/community-wise-survey',
      label: 'समुदाय अनुसार सर्वे',
      textColor: '#102463',
      gradientFrom: 'from-white',
      gradientTo: 'to-pink-50',
      borderColor: 'border-pink-200',
      hoverBorderColor: 'hover:border-pink-400',
      spaceY: 'space-y-1.5 sm:space-y-2 md:space-y-3',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="28" cy="38" rx="10" ry="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2"/>
          <path d="M20 38 Q18 32 22 30 Q26 28 28 34" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M36 38 Q38 32 34 30 Q30 28 28 34" stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <ellipse cx="50" cy="38" rx="10" ry="8" fill="#34d399" stroke="#059669" strokeWidth="2"/>
          <path d="M42 38 Q40 32 44 30 Q48 28 50 34" stroke="#059669" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M58 38 Q60 32 56 30 Q52 28 50 34" stroke="#059669" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <ellipse cx="72" cy="38" rx="10" ry="8" fill="#60a5fa" stroke="#2563eb" strokeWidth="2"/>
          <path d="M64 38 Q62 32 66 30 Q70 28 72 34" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M80 38 Q82 32 78 30 Q74 28 72 34" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <ellipse cx="39" cy="58" rx="10" ry="8" fill="#f472b6" stroke="#db2777" strokeWidth="2"/>
          <path d="M31 58 Q29 52 33 50 Q37 48 39 54" stroke="#db2777" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M47 58 Q49 52 45 50 Q41 48 39 54" stroke="#db2777" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M28 46 Q35 50 39 48 Q43 50 50 46 Q57 50 72 46" stroke="#102463" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M39 50 Q39 55 39 58" stroke="#102463" strokeWidth="3" fill="none" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'caste-wise-survey',
      route: '/caste-wise-survey',
      label: 'कास्ट अनुसार सर्वे',
      textColor: '#102463',
      gradientFrom: 'from-white',
      gradientTo: 'to-slate-50',
      borderColor: 'border-slate-200',
      hoverBorderColor: 'hover:border-slate-400',
      spaceY: 'space-y-2 sm:space-y-2.5 md:space-y-3',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.9">
            <path d="M20 60 Q20 42 30 42 L38 42 Q48 42 48 60 L48 77 Q48 84 42 84 L26 84 Q20 84 20 77 Z" fill="#102463" stroke="#0a1e4a" strokeWidth="2"/>
            <circle cx="34" cy="52" r="4" fill="#f97316"/>
            <text x="34" y="60" textAnchor="middle" fontSize="11" fill="#f97316" fontWeight="bold">₹</text>
            <path d="M26 42 Q26 35 30 35" stroke="#0a1e4a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
          <g opacity="0.75">
            <path d="M35 65 Q35 47 45 47 L53 47 Q63 47 63 65 L63 82 Q63 89 57 89 L41 89 Q35 89 35 82 Z" fill="#102463" stroke="#0a1e4a" strokeWidth="2"/>
            <circle cx="49" cy="57" r="4" fill="#f97316"/>
            <text x="49" y="65" textAnchor="middle" fontSize="11" fill="#f97316" fontWeight="bold">₹</text>
            <path d="M41 47 Q41 40 45 40" stroke="#0a1e4a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
          <g opacity="0.6">
            <path d="M50 70 Q50 52 60 52 L68 52 Q78 52 78 70 L78 87 Q78 94 72 94 L56 94 Q50 94 50 87 Z" fill="#102463" stroke="#0a1e4a" strokeWidth="2"/>
            <circle cx="64" cy="62" r="4" fill="#f97316"/>
            <text x="64" y="70" textAnchor="middle" fontSize="11" fill="#f97316" fontWeight="bold">₹</text>
            <path d="M56 52 Q56 45 60 45" stroke="#0a1e4a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </g>
        </svg>
      )
    },
    {
      id: 'education-profession-wise-survey',
      route: '/education-profession-wise-survey',
      label: 'शिक्षा/व्यवसाय अनुसार...',
      textColor: '#84cc16',
      gradientFrom: 'from-white',
      gradientTo: 'to-lime-50',
      borderColor: 'border-lime-200',
      hoverBorderColor: 'hover:border-lime-400',
      spaceY: 'space-y-2 sm:space-y-2.5 md:space-y-3',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M25 38 L50 28 L75 38 L50 48 Z" fill="#102463" stroke="#0a1e4a" strokeWidth="2"/>
          <ellipse cx="50" cy="38" rx="25" ry="4" fill="#102463" opacity="0.35"/>
          <circle cx="75" cy="38" r="2" fill="#84cc16"/>
          <line x1="75" y1="40" x2="75" y2="45" stroke="#84cc16" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="30" y="50" width="40" height="26" rx="2.5" fill="#102463" opacity="0.25" stroke="#102463" strokeWidth="2"/>
          <rect x="33" y="54" width="34" height="5" rx="1" fill="#102463"/>
          <rect x="33" y="62" width="34" height="5" rx="1" fill="#102463"/>
          <rect x="33" y="70" width="28" height="5" rx="1" fill="#102463"/>
          <line x1="36" y1="56" x2="40" y2="56" stroke="#84cc16" strokeWidth="2" strokeLinecap="round"/>
          <line x1="36" y1="64" x2="40" y2="64" stroke="#84cc16" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'redevelopment-building',
      route: '/redevelopment-building',
      label: 'पुनर्विकास भवन',
      textColor: '#0d9488',
      gradientFrom: 'from-white',
      gradientTo: 'to-teal-50',
      borderColor: 'border-teal-200',
      hoverBorderColor: 'hover:border-teal-400',
      spaceY: 'space-y-2 sm:space-y-2.5 md:space-y-3',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="25" width="60" height="40" rx="3" fill="#0d9488" stroke="#0f766e" strokeWidth="2.5"/>
          <rect x="25" y="30" width="50" height="30" rx="2" fill="#134e4a" opacity="0.8"/>
          <rect x="28" y="33" width="44" height="24" rx="1.5" fill="#14b8a6" opacity="0.6"/>
          <rect x="28" y="33" width="44" height="6" rx="1.5" fill="#0d9488"/>
          <circle cx="32" cy="36" r="1.5" fill="#fbbf24"/>
          <circle cx="37" cy="36" r="1.5" fill="#ef4444"/>
          <circle cx="42" cy="36" r="1.5" fill="#22c55e"/>
          <line x1="32" y1="43" x2="42" y2="43" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="32" y1="48" x2="38" y2="48" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="32" y1="53" x2="45" y2="53" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="65" cy="45" r="8" fill="#0d9488" stroke="#0f766e" strokeWidth="2"/>
          <path d="M65 37 L67 39 L71 37 L69 41 L73 41 L71 43 L73 47 L69 47 L67 51 L65 49 L63 51 L61 47 L57 47 L59 43 L57 41 L61 41 L63 37 Z" fill="#fbbf24" opacity="0.9"/>
          <rect x="45" y="65" width="10" height="4" rx="1" fill="#0f766e"/>
          <rect x="38" y="69" width="24" height="3" rx="1.5" fill="#0f766e"/>
        </svg>
      )
    },
    {
      id: 'death-survey',
      route: '/death-survey',
      label: 'मृत्यु सर्वेक्षण',
      textColor: '#4b5563',
      gradientFrom: 'from-white',
      gradientTo: 'to-gray-50',
      borderColor: 'border-gray-200',
      hoverBorderColor: 'hover:border-gray-400',
      spaceY: 'space-y-2 sm:space-y-2.5 md:space-y-3',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="35" y="45" width="30" height="40" rx="2" fill="#6b7280" stroke="#4b5563" strokeWidth="2.5"/>
          <path d="M35 45 Q50 35 65 45" stroke="#4b5563" strokeWidth="2.5" fill="#6b7280"/>
          <text x="50" y="68" textAnchor="middle" fontSize="12" fill="#ffffff" fontWeight="bold" fontFamily="Arial, sans-serif">R.I.P</text>
          <line x1="50" y1="25" x2="50" y2="45" stroke="#4b5563" strokeWidth="3" strokeLinecap="round"/>
          <line x1="42" y1="35" x2="58" y2="35" stroke="#4b5563" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="42" cy="55" r="2" fill="#9ca3af" opacity="0.6"/>
          <circle cx="58" cy="55" r="2" fill="#9ca3af" opacity="0.6"/>
          <circle cx="42" cy="75" r="2" fill="#9ca3af" opacity="0.6"/>
          <circle cx="58" cy="75" r="2" fill="#9ca3af" opacity="0.6"/>
        </svg>
      )
    },
    {
      id: 'transferred-survey',
      route: '/transferred-survey',
      label: 'स्थानांतरित सर्वेक्षण',
      textColor: '#2563eb',
      gradientFrom: 'from-white',
      gradientTo: 'to-blue-50',
      borderColor: 'border-blue-200',
      hoverBorderColor: 'hover:border-blue-400',
      spaceY: 'space-y-2 sm:space-y-2.5 md:space-y-3',
      icon: (
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="50" width="45" height="25" rx="3" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2.5"/>
          <rect x="25" y="40" width="20" height="15" rx="2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2.5"/>
          <rect x="28" y="42" width="14" height="10" rx="1.5" fill="#dbeafe" opacity="0.8"/>
          <line x1="48" y1="50" x2="48" y2="75" stroke="#1d4ed8" strokeWidth="2"/>
          <line x1="52" y1="55" x2="65" y2="55" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="52" y1="62" x2="65" y2="62" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="52" y1="68" x2="62" y2="68" stroke="#1e40af" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="35" cy="78" r="6" fill="#1e293b" stroke="#0f172a" strokeWidth="2"/>
          <circle cx="35" cy="78" r="3.5" fill="#64748b"/>
          <circle cx="55" cy="78" r="6" fill="#1e293b" stroke="#0f172a" strokeWidth="2"/>
          <circle cx="55" cy="78" r="3.5" fill="#64748b"/>
          <rect x="50" y="45" width="18" height="12" rx="1" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"/>
          <path d="M50 45 L59 38 L68 45 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5"/>
          <rect x="56" y="52" width="4" height="5" rx="0.5" fill="#78350f"/>
          <rect x="52" y="50" width="3" height="3" rx="0.5" fill="#3b82f6" opacity="0.7"/>
          <rect x="61" y="50" width="3" height="3" rx="0.5" fill="#3b82f6" opacity="0.7"/>
          <line x1="15" y1="60" x2="22" y2="60" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
          <line x1="15" y1="65" x2="22" y2="65" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
          <line x1="15" y1="70" x2="22" y2="70" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        </svg>
      )
    }
  ]

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ backgroundColor: '#e5e8ff' }}
      onScroll={(e) => {
        // React scroll event handler
        const scrollTop = e.currentTarget.scrollTop
        setScrollPosition(scrollTop)
        
        // Show scroll to top button when scrolled down more than 300px
        if (scrollTop > 300) {
          setShowScrollTop(true)
        } else {
          setShowScrollTop(false)
        }
      }}
    >
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-20 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-3.5 md:py-4 flex items-center justify-between shadow-xl" style={{ backgroundColor: '#102463' }}>
        <button
          onClick={handleBack}
          className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-all duration-200 active:scale-95 shadow-sm"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center flex-1 px-3 sm:px-4">सर्वे डेशबोर्ड</h1>
        
        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11"></div>
      </div>

      {/* Main Content Container - All Visible */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 lg:py-6 pb-6 sm:pb-8 md:pb-10 lg:pb-12 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-8 sm:p-10 md:p-12 shadow-xl w-full border border-gray-200">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2" style={{ borderColor: '#102463' }}></div>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg">डेटा लोड हो रहा है...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl w-full border-2 border-red-200">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-red-600 text-4xl sm:text-5xl">⚠️</div>
              <p className="text-red-700 text-sm sm:text-base md:text-lg font-semibold text-center">{error}</p>
              <button
                onClick={fetchSurveyDashboard}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                style={{ backgroundColor: '#102463' }}
              >
                पुनः प्रयास करें
              </button>
            </div>
          </div>
        )}


        {/* Key Metrics Card */}
        {!loading && !error && dashboardData && (
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-xl w-full border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            {/* First Row - Key Metrics */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-5 lg:gap-8 pb-2 sm:pb-3 md:pb-5 lg:pb-6 border-b-2 border-gray-200 mb-2 sm:mb-3 md:mb-5 lg:mb-6">
              <div className="text-center p-1 sm:p-1.5 md:p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                <div className="text-base sm:text-lg md:text-3xl lg:text-4xl font-extrabold break-words mb-0.5 sm:mb-1 md:mb-1.5" style={{ color: '#102463' }}>
                  {dashboardData?.total_voter ? dashboardData.total_voter.toLocaleString('en-IN') : '0'}
                </div>
                <div className="text-[10px] sm:text-xs md:text-base lg:text-lg text-gray-700 font-semibold">मतदाता</div>
              </div>
              <div className="text-center p-1 sm:p-1.5 md:p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
                <div className="text-base sm:text-lg md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 md:mb-1.5" style={{ color: '#102463' }}>
                  {dashboardData?.total_survey || '0'}
                </div>
                <div className="text-[10px] sm:text-xs md:text-base lg:text-lg text-gray-700 font-semibold">सर्वे</div>
              </div>
              <div className="text-center p-1 sm:p-1.5 md:p-3 rounded-lg hover:bg-orange-50 transition-colors duration-200">
                <div className="text-base sm:text-lg md:text-3xl lg:text-4xl font-extrabold mb-0.5 sm:mb-1 md:mb-1.5" style={{ color: '#102463' }}>
                  {dashboardData?.not_available || '0'}
                </div>
                <div className="text-[10px] sm:text-xs md:text-base lg:text-lg text-gray-700 font-semibold">अनुपलब्ध</div>
              </div>
            </div>

            {/* Second Row - Survey Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-green-700 mb-2">
                  {dashboardData?.positive || '0'}
                </div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold break-words">पॉजिटिव</div>
              </div>
              <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 hover:border-red-300 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-red-700 mb-2">
                  {dashboardData?.negative || '0'}
                </div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold break-words">नेगेटिव</div>
              </div>
              <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-orange-700 mb-2">
                  {dashboardData?.doubtful || '0'}
                </div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold break-words">डाउटफुल</div>
              </div>
              <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:scale-105" style={{ background: 'linear-gradient(to bottom right, #e5e8ff, #d1d5ff)' }}>
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2" style={{ color: '#102463' }}>
                  {dashboardData?.cant_say || dashboardData?.nothing || '0'}
                </div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold break-words">कुछ नहीं</div>
              </div>
            </div>
          </div>
        )}

        {/* Fallback for when data is not available but no error */}
        {!loading && !error && !dashboardData && (
          <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-xl w-full border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            {/* First Row - Key Metrics */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-8 pb-4 sm:pb-5 md:pb-6 border-b-2 border-gray-200 mb-4 sm:mb-5 md:mb-6">
              <div className="text-center p-2 sm:p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold break-words mb-1 sm:mb-1.5" style={{ color: '#102463' }}>51,770</div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold">मतदाता</div>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 sm:mb-1.5" style={{ color: '#102463' }}>8</div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold">सर्वे</div>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-lg hover:bg-orange-50 transition-colors duration-200">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-1 sm:mb-1.5" style={{ color: '#102463' }}>7</div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold">अनुपलब्ध</div>
              </div>
            </div>

            {/* Second Row - Survey Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-green-700 mb-2">3</div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold break-words">पॉजिटिव</div>
              </div>
              <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 hover:border-red-300 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-red-700 mb-2">2</div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold break-words">नेगेटिव</div>
              </div>
              <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-orange-700 mb-2">2</div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold break-words">डाउटफुल</div>
              </div>
              <div className="text-center p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:scale-105" style={{ background: 'linear-gradient(to bottom right, #e5e8ff, #d1d5ff)' }}>
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2" style={{ color: '#102463' }}>1</div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 font-semibold break-words">कुछ नहीं</div>
              </div>
            </div>
          </div>
        )}

        {/* Survey Report Card - Compact Design */}
        {!loading && !error && (() => {
          // Calculate percentages from API data - ensure proper number conversion
          const positive = Number(dashboardData?.positive || 0)
          const negative = Number(dashboardData?.negative || 0)
          const doubtful = Number(dashboardData?.doubtful || 0)
          const cantSay = Number(dashboardData?.cant_say || dashboardData?.nothing || 0)
          
          // Calculate total from all survey categories
          const total = positive + negative + doubtful + cantSay
          
          // Calculate percentages with proper handling for zero total
          const positivePercent = total > 0 ? parseFloat(((positive / total) * 100).toFixed(1)) : 0
          const negativePercent = total > 0 ? parseFloat(((negative / total) * 100).toFixed(1)) : 0
          const doubtfulPercent = total > 0 ? parseFloat(((doubtful / total) * 100).toFixed(1)) : 0
          const cantSayPercent = total > 0 ? parseFloat(((cantSay / total) * 100).toFixed(1)) : 0

          // Ensure percentages don't exceed 100% and handle rounding errors
          const allPercentages = [positivePercent, negativePercent, doubtfulPercent, cantSayPercent]
          const sumPercentages = allPercentages.reduce((sum, p) => sum + p, 0)
          
          // Normalize if total exceeds 100% due to rounding
          const normalizeFactor = sumPercentages > 100 ? 100 / sumPercentages : 1
          const normalizedPositive = (positivePercent * normalizeFactor).toFixed(1)
          const normalizedNegative = (negativePercent * normalizeFactor).toFixed(1)
          const normalizedDoubtful = (doubtfulPercent * normalizeFactor).toFixed(1)
          const normalizedCantSay = (cantSayPercent * normalizeFactor).toFixed(1)

          return (
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl w-full border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              {/* Header */}
              <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-bold shadow-md hover:shadow-lg transition-all duration-200" style={{ backgroundColor: '#102463', color: 'white' }}>
                  सर्वे रिपोर्ट
                </div>
              </div>

              {/* Compact Horizontal Bar Chart */}
              <div className="space-y-2.5 sm:space-y-3">
                {/* Positive - Green */}
                <div className="group/item">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 relative h-4 sm:h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-md bar-fill transition-all duration-700 ease-out"
                        style={{
                          width: `${normalizedPositive}%`,
                          minWidth: total > 0 ? '2px' : '0px'
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-700">{normalizedPositive}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Negative - Red */}
                <div className="group/item">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 relative h-4 sm:h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full shadow-md bar-fill transition-all duration-700 ease-out"
                        style={{
                          width: `${normalizedNegative}%`,
                          minWidth: total > 0 ? '2px' : '0px'
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-700">{normalizedNegative}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Doubtful - Orange */}
                <div className="group/item">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 relative h-4 sm:h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full shadow-md bar-fill transition-all duration-700 ease-out"
                        style={{
                          width: `${normalizedDoubtful}%`,
                          minWidth: total > 0 ? '2px' : '0px'
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-700">{normalizedDoubtful}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nothing - Blue */}
                <div className="group/item">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 relative h-4 sm:h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-md bar-fill transition-all duration-700 ease-out"
                        style={{
                          width: `${normalizedCantSay}%`,
                          minWidth: total > 0 ? '2px' : '0px'
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-700">{normalizedCantSay}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* CSS Animations for Horizontal Bars */}
        <style>{`
          .bar-fill {
            transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
            animation: barSlideIn 0.7s ease-out forwards;
          }
          
          @keyframes barSlideIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .group/item:hover .bar-fill {
            filter: brightness(1.15);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            transform: scaleY(1.05);
          }
          
          .group/item:hover {
            transform: translateX(2px);
          }
        `}</style>

        {/* Summary Cards - 2x2 Grid */}
        {!loading && dashboardData && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full">
            {/* बिल्डिंग प्रमुख सर्वे (AP - Address Pramukh) */}
            <div 
              onClick={() => navigate('/building-head-survey')}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg w-full border-2 border-gray-200 hover:border-blue-300 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors duration-300">
                {dashboardData?.address_pramukh || '0'}
              </div>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 break-words group-hover:text-gray-900 font-semibold transition-colors leading-tight">बिल्डिंग प्रमुख सर्वे</div>
            </div>

            {/* शक्ति केन्द्र सर्वे (SP) */}
            <div 
              onClick={() => navigate('/shakti-kendra-survey')}
              className="bg-gradient-to-br from-white to-gray-50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg w-full border-2 border-gray-200 hover:border-green-300 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2 sm:mb-3 group-hover:text-green-600 transition-colors duration-300">
                {dashboardData?.shakti_kendra || '0'}
              </div>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 break-words group-hover:text-gray-900 font-semibold transition-colors leading-tight">शक्ति केन्द्र सर्वे</div>
            </div>

            {/* बूथ प्रमुख सर्वे (BP) */}
            <div 
              onClick={() => navigate('/booth-pramukh-survey')}
              className="bg-gradient-to-br from-white to-blue-50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg w-full border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300" style={{ color: '#102463' }}>
                {dashboardData?.booth_pramukh || '0'}
              </div>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 break-words group-hover:text-gray-900 font-semibold transition-colors leading-tight">बूथ प्रमुख सर्वे</div>
            </div>

            {/* फोनबूक सर्वे (PH) */}
            <div 
              onClick={() => navigate('/phonebook-survey')}
              className="bg-gradient-to-br from-white to-purple-50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-7 shadow-lg w-full border-2 border-gray-200 hover:border-purple-300 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2 sm:mb-3 group-hover:text-purple-600 transition-colors duration-300">
                {dashboardData?.phonebook || '0'}
              </div>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 break-words group-hover:text-gray-900 font-semibold transition-colors leading-tight">फोनबूक सर्वे</div>
            </div>
          </div>
        )}

        {/* समग्र सर्वे Section */}
        <div className="mt-4 sm:mt-5 md:mt-6 lg:mt-8 w-full">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold mb-4 sm:mb-5 md:mb-6 px-2" style={{ color: '#102463' }}>सर्वे रिपोर्ट</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full">
            {surveyReportCards.map((card) => (
              <div 
                key={card.id}
                onClick={() => navigate(card.route)}
                className={`bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo} rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg cursor-pointer hover:shadow-2xl hover:scale-110 transition-all duration-300 w-full border-2 ${card.borderColor} ${card.hoverBorderColor} group`}
              >
                <div className={`flex flex-col items-center ${card.spaceY}`}>
                  <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-center break-words leading-tight" style={{ color: card.textColor }}>
                    {card.label}
                  </div>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border-2"
          style={{ borderColor: '#102463' }}
          aria-label="Scroll to top"
        >
          <svg 
            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: '#102463' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default CadreSurveyReport

