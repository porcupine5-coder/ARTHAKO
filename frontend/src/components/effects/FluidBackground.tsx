import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useTheme } from '../../lib/ThemeContext'

export default function FluidBackground() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { isDark } = useTheme()
    const isDarkRef = useRef(isDark)

    // Update ref when theme changes so the animation loop can see it
    useEffect(() => {
        isDarkRef.current = isDark
    }, [isDark])

    useEffect(() => {
        if (!containerRef.current) return

        const container = containerRef.current
        const scene = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })

        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.appendChild(renderer.domElement)

        const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

        const fragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec2 uResolution;
      uniform float uMouseVelocity;
      uniform float uIsDark;
      varying vec2 vUv;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = vUv;
        vec2 mouseInfluence = uMouse;
        
        // Create flowing noise
        float noise1 = snoise(uv * 3.0 + uTime * 0.2);
        float noise2 = snoise(uv * 2.0 - uTime * 0.15);
        float noise3 = snoise(uv * 4.0 + uTime * 0.3);
        
        // Mouse interaction - create fluid distortion
        vec2 toMouse = uv - mouseInfluence;
        float mouseDist = length(toMouse);
        float mouseEffect = smoothstep(0.4, 0.0, mouseDist) * uMouseVelocity;
        
        // Distort UV coordinates based on mouse
        vec2 distortedUV = uv;
        distortedUV += normalize(toMouse) * mouseEffect * 0.3;
        distortedUV += vec2(noise1, noise2) * 0.05;
        
        // Create animated gradient with distortion
        float gradient1 = sin(distortedUV.x * 2.0 + uTime * 0.5 + noise1) * 0.5 + 0.5;
        float gradient2 = cos(distortedUV.y * 2.0 - uTime * 0.3 + noise2) * 0.5 + 0.5;
        float gradient3 = sin((distortedUV.x + distortedUV.y) * 1.5 + uTime * 0.4 + noise3) * 0.5 + 0.5;
        
        vec3 color;
        
        if (uIsDark > 0.5) {
          // Dark mode - deep blues and purples
          vec3 color1 = vec3(0.05, 0.09, 0.16); // Deep navy
          vec3 color2 = vec3(0.09, 0.18, 0.35); // Medium blue
          vec3 color3 = vec3(0.14, 0.31, 0.58); // Lighter blue
          vec3 color4 = vec3(0.23, 0.51, 0.76); // Sky blue
          
          color = mix(color1, color2, gradient1);
          color = mix(color, color3, gradient2);
          color = mix(color, color4, gradient3 * 0.5);
          
          // Add mouse glow
          color += vec3(0.2, 0.4, 0.9) * mouseEffect * 0.4;
        } else {
          // Light mode - soft pastels
          vec3 color1 = vec3(0.97, 0.98, 0.99); // Off white
          vec3 color2 = vec3(0.88, 0.95, 0.99); // Light blue
          vec3 color3 = vec3(0.78, 0.93, 0.99); // Sky blue
          vec3 color4 = vec3(0.62, 0.87, 0.98); // Cyan
          
          color = mix(color1, color2, gradient1);
          color = mix(color, color3, gradient2);
          color = mix(color, color4, gradient3 * 0.4);
          
          // Add mouse glow
          color += vec3(0.05, 0.65, 0.91) * mouseEffect * 0.3;
        }
        
        // Add subtle vignette
        float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
        color *= 0.7 + vignette * 0.3;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `

        const geometry = new THREE.PlaneGeometry(2, 2)
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uMouseVelocity: { value: 0 },
                uIsDark: { value: isDarkRef.current ? 1.0 : 0.0 }
            }
        })

        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        // Mouse tracking
        let mouseX = 0.5
        let mouseY = 0.5
        let targetMouseX = 0.5
        let targetMouseY = 0.5
        let prevMouseX = 0.5
        let prevMouseY = 0.5
        let mouseVelocity = 0
        let animationId: number

        const handleMouseMove = (e: MouseEvent) => {
            targetMouseX = e.clientX / window.innerWidth
            targetMouseY = 1.0 - (e.clientY / window.innerHeight)
        }

        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0]
            targetMouseX = touch.clientX / window.innerWidth
            targetMouseY = 1.0 - (touch.clientY / window.innerHeight)
        }

        const handleResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight)
            material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('touchmove', handleTouchMove)
        window.addEventListener('resize', handleResize)

        const animate = () => {
            animationId = requestAnimationFrame(animate)

            // Smooth mouse following
            mouseX += (targetMouseX - mouseX) * 0.1
            mouseY += (targetMouseY - mouseY) * 0.1

            // Calculate velocity
            const dx = mouseX - prevMouseX
            const dy = mouseY - prevMouseY
            const currentVelocity = Math.sqrt(dx * dx + dy * dy)
            mouseVelocity += (currentVelocity - mouseVelocity) * 0.1

            prevMouseX = mouseX
            prevMouseY = mouseY

            // Update uniforms
            material.uniforms.uTime.value += 0.01
            material.uniforms.uMouse.value.set(mouseX, mouseY)
            material.uniforms.uMouseVelocity.value = mouseVelocity * 20
            material.uniforms.uIsDark.value = isDarkRef.current ? 1.0 : 0.0

            renderer.render(scene, camera)
        }

        animate()

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(animationId)
            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement)
            }
            geometry.dispose()
            material.dispose()
            renderer.dispose()
        }
    }, []) // Empty dependency array, we use ref for theme updates

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 -z-10 w-full h-full pointer-events-none"
        />
    )
}
