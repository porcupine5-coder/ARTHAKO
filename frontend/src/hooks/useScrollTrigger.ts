import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
// import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Remove the immediate registration which might cause issues
// if (typeof window !== 'undefined') {
//   gsap.registerPlugin(ScrollTrigger)
// }

interface ScrollTriggerOptions {
  start?: string
  end?: string
  scrub?: boolean | number
  markers?: boolean
  toggleActions?: string
}

export function useScrollTrigger<T extends HTMLElement = HTMLDivElement>(
  animationFn: (element: T) => void,
  options: ScrollTriggerOptions = {}
) {
  const elementRef = useRef<T>(null)

  useEffect(() => {
    // Only register ScrollTrigger when we're in the browser and have an element
    if (typeof window !== 'undefined' && elementRef.current) {
      // Dynamically import and register ScrollTrigger
      import('gsap/ScrollTrigger').then((module) => {
        const ScrollTrigger = module.ScrollTrigger
        gsap.registerPlugin(ScrollTrigger)
        
        const element = elementRef.current
        if (!element) return

        const ctx = gsap.context(() => {
          animationFn(element)
        }, element)

        return () => {
          ctx.revert()
          ScrollTrigger.getAll().forEach(trigger => trigger.kill())
        }
      }).catch((error) => {
        console.warn('ScrollTrigger not available:', error)
      })
    }
  }, [animationFn, options])

  return elementRef
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  speed = 0.5
) {
  return useScrollTrigger<T>((element) => {
    // Check if ScrollTrigger is available before using it
    if (typeof window !== 'undefined') {
      import('gsap/ScrollTrigger').then((module) => {
        const ScrollTrigger = module.ScrollTrigger
        gsap.registerPlugin(ScrollTrigger)
        
        gsap.to(element, {
          y: () => window.innerHeight * speed,
          ease: 'none',
          scrollTrigger: {
            trigger: element,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        })
      }).catch((error) => {
        console.warn('ScrollTrigger not available for parallax:', error)
      })
    }
  })
}

export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>(
  direction: 'up' | 'down' | 'left' | 'right' = 'up'
) {
  return useScrollTrigger<T>((element) => {
    // Check if ScrollTrigger is available before using it
    if (typeof window !== 'undefined') {
      import('gsap/ScrollTrigger').then((module) => {
        const ScrollTrigger = module.ScrollTrigger
        gsap.registerPlugin(ScrollTrigger)
        
        const transforms = {
          up: { y: 50 },
          down: { y: -50 },
          left: { x: 50 },
          right: { x: -50 },
        }

        gsap.fromTo(
          element,
          { opacity: 0, ...transforms[direction] },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }).catch((error) => {
        console.warn('ScrollTrigger not available for reveal:', error)
        // Fallback animation without ScrollTrigger
        gsap.fromTo(
          element,
          { opacity: 0, y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0, x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0 },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 1,
            ease: 'power2.out',
          }
        )
      })
    }
  })
}