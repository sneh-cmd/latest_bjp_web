import React, { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import logoImage from '../assets/image/ic_app_logo.png'
import backgroundImage from '../assets/image/logo-2.jpg'
import gifImage from '../assets/GIF/gif.gif'
import localStorageManager from '../utils/localStorage.js'

const BJPSplashScreen = ({ navigation }) => {
  const { navigate } = navigation
  const [isLoaded, setIsLoaded] = useState(false)
  const [showContent, setShowContent] = useState(false)
  
  // GSAP Refs
  const containerRef = useRef(null)
  const logoRef = useRef(null)
  const loadingRef = useRef(null)
  const contentRef = useRef(null)
  const buttonRef = useRef(null)
  const gifRef = useRef(null)

  useEffect(() => {
    // Check if user is already logged in - if yes, redirect to admin directly
    const existingSession = localStorageManager.getSession()
    if (existingSession) {
      console.log('Existing session found on splash screen, redirecting to admin dashboard')
      // Clear navigation state if logged in
      localStorageManager.clearNavigationState()
      navigate('/admin', {
        state: existingSession
      })
      return
    }

    // Check if there's a saved navigation state (user was in the middle of flow)
    const navigationState = localStorageManager.getNavigationState()
    if (navigationState && navigationState.path) {
      console.log('Navigation state found, restoring to:', navigationState.path)
      // Restore to the saved navigation path (should be login screen)
      navigate(navigationState.path, {
        state: navigationState.data
      })
      return
    }

    // Initial setup - hide elements that will be shown later (only if they exist)
    const elementsToHide = [contentRef.current, buttonRef.current, gifRef.current].filter(Boolean)
    if (elementsToHide.length > 0) {
      gsap.set(elementsToHide, {
        opacity: 0,
        y: 30,
        scale: 0.9
      })
    }

    if (loadingRef.current) {
      gsap.set(loadingRef.current, {
        opacity: 1,
        scale: 1
      })
    }

    // Create main timeline
    const tl = gsap.timeline()

    // Background fade in
    tl.fromTo(containerRef.current, 
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: "power2.out" }
    )

    // User-friendly loading animation (only if loading element exists)
    if (loadingRef.current) {
      const pulseElement = loadingRef.current.querySelector('.animate-pulse')
      if (pulseElement) {
        tl.to(pulseElement, {
          scaleX: 1,
          duration: 0.8,
          ease: "power2.out",
          transformOrigin: "left center"
        }, "-=0.6")
      }

      // Add subtle pulsing to loading container
      tl.to(loadingRef.current, {
        scale: 1.02,
        duration: 1,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      }, "-=0.8")

      // Simulate loading progress - much faster
      tl.to({}, { duration: 0.8 })

      // Hide loading with better animation
      tl.to(loadingRef.current, {
        opacity: 0,
        scale: 0.3,
        rotation: 720,
        duration: 0.5,
        ease: "back.in(1.7)"
      })
    } else {
      // If no loading element, just wait
      tl.to({}, { duration: 1.3 })
    }

    // Set loaded state first
    tl.call(() => {
      setIsLoaded(true)
      setShowContent(true)
    })

    return () => {
      tl.kill()
    }
  }, [navigate])

  // Separate effect for content animation after loading is complete
  useEffect(() => {
    if (isLoaded) {
      // Show content with animation (only if it exists)
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out"
        })
      }

      // Show button with animation (only if it exists)
      if (buttonRef.current) {
        gsap.to(buttonRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power2.out"
        })
      }

      // Show GIF with animation (only if it exists)
      if (gifRef.current) {
        gsap.to(gifRef.current, {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: "power2.out"
        })

        // Add continuous subtle animation to GIF
        gsap.to(gifRef.current, {
          rotation: -10,
          duration: 1.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        })
      }
    }
  }, [isLoaded])

  const handleContinue = () => {
    // Save navigation state to sessionStorage
    localStorageManager.saveNavigationState('/corporation', { screen: 'corporation' })
    
    // Enhanced button click animation (only if button exists)
    if (buttonRef.current) {
      const tl = gsap.timeline()
      
      tl.to(buttonRef.current, {
        scale: 0.9,
        duration: 0.1,
        ease: "power2.in"
      })
      .to(buttonRef.current, {
        scale: 1.1,
        duration: 0.2,
        ease: "power2.out"
      })
      .to(buttonRef.current, {
        scale: 1,
        duration: 0.1,
        ease: "power2.inOut",
        onComplete: () => {
          navigate('/corporation')
        }
      })
    } else {
      // If button doesn't exist, just navigate
      navigate('/corporation')
    }
  }

  const handleButtonHover = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1.08,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

  const handleButtonLeave = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

  return (
    <div ref={containerRef} className="relative w-screen h-screen overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute top-0 left-0 w-full h-full z-10">
        <img 
          src={backgroundImage} 
          alt="Parliament Background" 
          className="w-full h-full object-cover object-center brightness-75 contrast-120"
        />
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/15 via-white/10 to-green-500/15 backdrop-blur-[3px]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center p-8 max-w-4xl w-full">
        {/* BJP Logo - Only show after loading is complete */}
        {isLoaded && (
          <div ref={logoRef} className="mb-6">
            <img 
              src={logoImage} 
              alt="BJP Logo" 
              className="w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 object-contain drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 153, 51, 0.8)) drop-shadow(0 0 15px rgba(37, 125, 35, 0.4))'
              }}
            />
          </div>
        )}

        {/* BJP Logo-Inspired Circular Loader */}
        {!isLoaded && (
          <div ref={loadingRef} className="flex items-center justify-center mb-6">
            {/* Circular BJP Logo Loader */}
            <div className="relative w-32 h-32 md:w-36 md:h-36">
              {/* Outer Ring - Orange */}
              <div className="absolute inset-0 rounded-full border-4 border-orange-500/30"></div>
              
              {/* Middle Ring - Green */}
              <div className="absolute inset-2 rounded-full border-3 border-green-500/40"></div>
              
              {/* Animated Progress Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-green-500 animate-spin" style={{
                animationDuration: '2s'
              }}></div>
              
              {/* Inner Logo Circle */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-orange-500/30 to-green-500/30 flex items-center justify-center backdrop-blur-sm">
                {/* Lotus-like Center */}
                <div className="relative w-12 h-12 md:w-14 md:h-14">
                  {/* Center Circle */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-green-500 animate-pulse"></div>
                  
                  {/* Rotating Petals */}
                  <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-2 h-4 bg-orange-500 rounded-full animate-ping"></div>
                    <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-4 h-2 bg-green-500 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-4 bg-orange-500 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-4 h-2 bg-green-500 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
                  </div>
                </div>
              </div>
              
              {/* Rotating Corner Elements */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-orange-500 rounded-full animate-ping" style={{animationDelay: '0.9s'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {isLoaded && (
          <div ref={contentRef}>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-orange-500 mb-1 tracking-wide" style={{
              fontFamily: 'Arial, sans-serif',
              textShadow: '3px 3px 6px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)',
              letterSpacing: '1px'
            }}>
              भारतीय जनता पार्टी
            </h1>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-white mb-3" style={{
              fontFamily: 'Arial, sans-serif',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.6)',
              letterSpacing: '0.5px'
            }}>
              Bharatiya Janata Party
            </h2>
            <p className="text-base md:text-lg text-white mb-6 leading-relaxed" style={{
              fontFamily: 'Arial, sans-serif',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.7)',
              letterSpacing: '0.3px'
            }}>
              सर्वोदय से सर्वांगीण विकास तक<br/>
              From Sarvodaya to Comprehensive Development
            </p>
            <div className="relative">
              <button 
                ref={buttonRef}
                className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white border-0 px-8 py-3 text-lg font-bold rounded-full cursor-pointer shadow-2xl hover:shadow-orange-500/60 uppercase tracking-widest font-sans relative overflow-hidden group min-w-[200px]"
                onClick={handleContinue}
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
              >
                <span className="relative z-10" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)'}}>Continue</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
              </button>
              <img 
                ref={gifRef}
                src={gifImage} 
                alt="Animation" 
                className="absolute right-16 top-1/2 transform -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain z-20"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BJPSplashScreen
