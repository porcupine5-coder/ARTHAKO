import { useEffect, useState, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { gsap } from 'gsap'
import ThemeSwitch from '../common/ThemeSwitch'
// import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Remove immediate ScrollTrigger registration
// if (typeof window !== 'undefined') {
//   gsap.registerPlugin(ScrollTrigger)
// }

interface NavbarProps {
  sessionEmail?: string
  onSignOut?: () => void
  dark?: boolean
  onToggleDark?: () => void
}

export default function Navbar({ sessionEmail, onSignOut, dark, onToggleDark }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const navRef = useRef<HTMLElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 20
      setIsScrolled(scrolled)

      // Calculate scroll progress
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / windowHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (progressRef.current) {
      // Dynamically import and register ScrollTrigger when needed
      import('gsap/ScrollTrigger').then((module) => {
        const ScrollTrigger = module.ScrollTrigger
        gsap.registerPlugin(ScrollTrigger)

        gsap.to(progressRef.current, {
          scaleX: scrollProgress / 100,
          duration: 0.1,
          ease: 'none',
        })
      }).catch((error) => {
        console.warn('ScrollTrigger not available for navbar:', error)
        // Fallback animation without ScrollTrigger
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${scrollProgress / 100})`
        }
      })
    }
  }, [scrollProgress])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/professional-dashboard', label: 'Pro Dashboard' },
    { to: '/companies', label: 'Companies' },
    { to: '/account', label: 'Account' },
  ]

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'glass-strong shadow-lg dark:shadow-dark-glow' : 'bg-transparent'
          }`}
      >
        {/* Scroll Progress Bar */}
        <div
          ref={progressRef}
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-neon-blue to-electric-purple origin-left w-full scroll-progress-bar"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arthako-accent to-arthako-accent-purple flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-glow-blue">
                <span className="text-arthako-dark font-bold text-sm">A</span>
              </div>
              <span className="font-display font-bold text-xl text-gradient hidden sm:block relative group">
                Arthako
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-arthako-accent to-arthako-accent-purple group-hover:w-full transition-all duration-500" />
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group overflow-hidden ${isActive
                        ? 'text-arthako-accent dark:text-arthako-accent bg-arthako-accent/10 dark:bg-arthako-accent/10'
                        : 'text-gray-600 dark:text-gray-400 hover:text-arthako-accent dark:hover:text-arthako-accent'
                      }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-arthako-accent rounded-full" />
                    )}
                    <span className="absolute inset-0 rounded-lg bg-arthako-accent/10 scale-0 group-hover:scale-100 transition-transform duration-300 origin-center" />
                  </Link>
                )
              })}
            </div>

            {/* Right Section */}
            <div className="hidden md:flex items-center space-x-4">
              {sessionEmail ? (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                    {sessionEmail}
                  </span>
                  <button
                    onClick={onSignOut}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 dark:bg-red-500/15 text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-600">Not signed in</span>
              )}

              <ThemeSwitch checked={dark || false} onChange={onToggleDark || (() => {})} />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg glass hover:glass-strong transition-all duration-300"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-arthako-border dark:border-arthako-accent/10 animate-slide-down">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive
                        ? 'bg-arthako-accent/10 text-arthako-accent'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-arthako-accent/5 dark:hover:bg-arthako-accent/5'
                      }`}
                  >
                    {link.label}
                  </Link>
                )
              })}

              <div className="pt-4 border-t border-arthako-border dark:border-arthako-accent/10 space-y-2">
                {sessionEmail ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 break-all">
                      {sessionEmail}
                    </div>
                    <button
                      onClick={onSignOut}
                      className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 dark:bg-red-500/15 text-red-500 hover:bg-red-500/20 dark:hover:bg-red-500/25 transition-all duration-300"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-600">Not signed in</div>
                )}

                <div className="w-full px-4 py-2 rounded-lg glass dark:glass-strong hover:bg-arthako-accent/10 dark:hover:bg-arthako-accent/10 transition-all duration-300 flex items-center justify-between">
                  <span className="text-sm font-medium">{dark ? 'Dark Mode' : 'Light Mode'}</span>
                  <ThemeSwitch checked={dark || false} onChange={onToggleDark || (() => {})} />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  )
}