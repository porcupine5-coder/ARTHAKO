import { useEffect, useRef } from 'react'
// import { gsap } from 'gsap'

export function useCursorTrail() {
  const dotRef = useRef<HTMLDivElement>(null)
  const outlineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const outline = outlineRef.current
    if (!dot || !outline) return

    // Dynamically import GSAP
    import('gsap').then((gsapModule) => {
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule

      const moveCursor = (e: MouseEvent) => {
        gsap.to(dot, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
          ease: 'power2.out',
        })

        gsap.to(outline, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.3,
          ease: 'power2.out',
        })
      }

      const handleMouseEnter = () => {
        gsap.to(outline, {
          scale: 1.5,
          duration: 0.3,
          ease: 'power2.out',
        })
      }

      const handleMouseLeave = () => {
        gsap.to(outline, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        })
      }

      window.addEventListener('mousemove', moveCursor)
      
      // Add hover effects to interactive elements
      const interactiveElements = document.querySelectorAll('a, button, [role="button"]')
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', handleMouseEnter)
        el.addEventListener('mouseleave', handleMouseLeave)
      })

      return () => {
        window.removeEventListener('mousemove', moveCursor)
        interactiveElements.forEach(el => {
          el.removeEventListener('mouseenter', handleMouseEnter)
          el.removeEventListener('mouseleave', handleMouseLeave)
        })
      }
    }).catch((error) => {
      console.warn('GSAP not available for cursor trail:', error)
      // No fallback needed as this is just a visual enhancement
    })
  }, [])

  return { dotRef, outlineRef }
}