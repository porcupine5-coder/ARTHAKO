import { useMemo } from 'react'

interface PasswordStrengthProps {
  password: string
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' }
    
    let score = 0
    
    // Length check
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    
    // Character variety
    if (/[a-z]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    
    const percentage = (score / 6) * 100
    
    if (score <= 2) return { score: percentage, label: 'Weak', color: 'bg-red-500' }
    if (score <= 4) return { score: percentage, label: 'Medium', color: 'bg-yellow-500' }
    return { score: percentage, label: 'Strong', color: 'bg-green-500' }
  }, [password])

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Password Strength</span>
        <span className={`font-semibold ${
          strength.label === 'Weak' ? 'text-red-500' :
          strength.label === 'Medium' ? 'text-yellow-500' :
          'text-green-500'
        }`}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${strength.color} transition-all duration-500 ease-out`}
          style={{ width: `${strength.score}%` }}
        />
      </div>
    </div>
  )
}