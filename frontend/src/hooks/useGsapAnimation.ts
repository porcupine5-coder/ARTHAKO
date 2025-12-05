import { useEffect, useRef } from 'react'
// import { gsap } from 'gsap'

export function useGsapAnimation<T extends HTMLElement = HTMLDivElement>(
  animationFn: (element: T, ctx: any) => void,
  dependencies: unknown[] = []
) {
  const elementRef = useRef<T>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Dynamically import GSAP
    import('gsap').then((gsapModule) => {
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule

      const ctx = gsap.context(() => {
        animationFn(element, ctx)
      }, element)

      return () => ctx.revert()
    }).catch((error) => {
      console.warn('GSAP not available for animation:', error)
      // No fallback needed as this is just a visual enhancement
    })
  }, dependencies)

  return elementRef
}

export function useFadeIn<T extends HTMLElement = HTMLDivElement>(
  duration = 0.6,
  delay = 0
) {
  return useGsapAnimation<T>((element, ctx: any) => {
    // Dynamically import GSAP
    import('gsap').then((gsapModule) => {
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule
      gsap.fromTo(
        element,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration, delay, ease: 'power2.out' }
      )
    }).catch((error) => {
      console.warn('GSAP not available for fade in:', error)
      // Fallback without animation
      element.style.opacity = '1'
      element.style.transform = 'translateY(0)'
    })
  }, [duration, delay])
}

export function useStaggerFadeIn<T extends HTMLElement = HTMLDivElement>(
  childSelector: string,
  stagger = 0.1,
  duration = 0.6
) {
  return useGsapAnimation<T>((element, ctx: any) => {
    // Dynamically import GSAP
    import('gsap').then((gsapModule) => {
      const gsap = gsapModule.gsap || gsapModule.default || gsapModule
      const children = element.querySelectorAll(childSelector)
      gsap.fromTo(
        children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration, stagger, ease: 'power2.out' }
      )
    }).catch((error) => {
      console.warn('GSAP not available for stagger fade in:', error)
      // Fallback without animation
      const children = element.querySelectorAll(childSelector)
      children.forEach((child: Element) => {
        if (child instanceof HTMLElement) {
          child.style.opacity = '1'
          child.style.transform = 'translateY(0)'
        }
      })
    })
  }, [childSelector, stagger, duration])
}