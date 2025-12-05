import { useEffect, useRef } from 'react'

interface ThemeSwitchProps {
  checked: boolean
  onChange: () => void
}

export default function ThemeSwitch({ checked, onChange }: ThemeSwitchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.checked = checked
    }
  }, [checked])

  return (
    <label className="theme-switch-wrapper cursor-pointer">
      <input
        ref={inputRef}
        type="checkbox"
        className="theme-switch"
        onChange={onChange}
        aria-label="Toggle theme"
      />
    </label>
  )
}