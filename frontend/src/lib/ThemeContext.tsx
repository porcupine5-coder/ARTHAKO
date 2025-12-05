import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('arthako-theme')
      if (savedTheme === 'dark') {
        setIsDark(true)
        document.documentElement.classList.add('dark')
      } else if (savedTheme === 'light') {
        setIsDark(false)
        document.documentElement.classList.remove('dark')
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(prefersDark)
        if (prefersDark) {
          document.documentElement.classList.add('dark')
        }
      }
    } catch (error) {
      console.warn('Failed to initialize theme:', error)
    }
    setIsInitialized(true)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)

    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('arthako-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('arthako-theme', 'light')
    }
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
