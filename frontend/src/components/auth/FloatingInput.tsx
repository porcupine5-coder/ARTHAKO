import { useState, InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  showPasswordToggle?: boolean
}

export default function FloatingInput({ 
  label, 
  error, 
  showPasswordToggle,
  type = 'text',
  className = '',
  ...props 
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  const inputType = showPasswordToggle && showPassword ? 'text' : type

  return (
    <div className="relative">
      <div className="relative">
        <input
          type={inputType}
          className={`
            peer w-full px-4 py-3 rounded-xl glass-strong
            border-2 border-transparent
            bg-white/5 dark:bg-black/20
            text-gray-900 dark:text-white
            placeholder-transparent
            transition-all duration-300
            focus:outline-hidden focus:border-arthako-accent focus:bg-white/10 dark:focus:bg-black/30
            hover:bg-white/8 dark:hover:bg-black/25
            ${error ? 'border-arthako-error' : ''}
            ${className}
          `}
          placeholder={label}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false)
            setHasValue(!!e.target.value)
          }}
          onChange={(e) => setHasValue(!!e.target.value)}
          {...props}
        />
        <label
          className={`
            absolute left-4 transition-all duration-300 pointer-events-none
            ${isFocused || hasValue || props.value
              ? '-top-2.5 text-xs bg-arthako-dark dark:bg-arthako-darker px-2 text-arthako-accent'
              : 'top-3 text-base text-gray-500 dark:text-gray-400'
            }
          `}
        >
          {label}
        </label>
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-arthako-accent transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-arthako-error animate-slide-down">
          {error}
        </p>
      )}
    </div>
  )
}