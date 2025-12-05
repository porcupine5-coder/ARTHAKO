import { useEffect, useRef, useState } from 'react'

interface Bubble {
  x: number
  y: number
  size: number
  speed: number
}

export default function FloatingBubbles() {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bubblesRef = useRef<Bubble[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize bubbles
    const bubbleCount = 15
    bubblesRef.current = Array.from({ length: bubbleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 60 + 20,
      speed: Math.random() * 0.5 + 0.2,
    }))

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      bubblesRef.current.forEach((bubble) => {
        // Move bubble up
        bubble.y -= bubble.speed

        // Reset bubble when it goes off screen
        if (bubble.y + bubble.size < 0) {
          bubble.y = canvas.height + bubble.size
          bubble.x = Math.random() * canvas.width
        }

        // Mouse interaction - repel bubbles
        const dx = mouseRef.current.x - bubble.x
        const dy = mouseRef.current.y - bubble.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDistance = 150

        if (distance < minDistance) {
          const force = (minDistance - distance) / minDistance
          bubble.x -= (dx / distance) * force * 2
          bubble.y -= (dy / distance) * force * 2
        }

        // Draw bubble with glass effect
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.size * 0.3,
          bubble.y - bubble.size * 0.3,
          0,
          bubble.x,
          bubble.y,
          bubble.size
        )
        gradient.addColorStop(0, 'rgba(0, 245, 255, 0.1)')
        gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.05)')
        gradient.addColorStop(1, 'rgba(0, 245, 255, 0)')

        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Add border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Add highlight
        const highlightGradient = ctx.createRadialGradient(
          bubble.x - bubble.size * 0.4,
          bubble.y - bubble.size * 0.4,
          0,
          bubble.x - bubble.size * 0.4,
          bubble.y - bubble.size * 0.4,
          bubble.size * 0.5
        )
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.beginPath()
        ctx.arc(
          bubble.x - bubble.size * 0.3,
          bubble.y - bubble.size * 0.3,
          bubble.size * 0.3,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = highlightGradient
        ctx.fill()
      })

      const animationFrameId = requestAnimationFrame(animate)
      animationFrameRef.current = animationFrameId
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10"
      aria-hidden="true"
    />
  )
}