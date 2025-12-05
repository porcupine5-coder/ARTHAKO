import { useState } from 'react'
import { Modal } from './AuthModals'
import { QrCode, Shield, Check } from 'lucide-react'
import { getSupabase } from '../../lib/supabase'

interface Enable2FAModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function Enable2FAModal({ isOpen, onClose, onSuccess }: Enable2FAModalProps) {
    const [step, setStep] = useState<'setup' | 'verify'>('setup')
    const [qrCode, setQrCode] = useState('')
    const [secret, setSecret] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSetup = async () => {
        setLoading(true)
        setError('')

        try {
            const supabase = getSupabase()
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp'
            })

            if (error) throw error

            setQrCode(data.totp.qr_code)
            setSecret(data.totp.secret)
            setStep('verify')
        } catch (err: any) {
            setError(err.message || 'Failed to setup 2FA')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const supabase = getSupabase()

            // Verify the code
            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId: secret,
                code: verificationCode
            })

            if (error) throw error

            // Update user's 2FA status in database
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase
                    .from('users')
                    .update({ two_factor_enabled: true })
                    .eq('id', user.id)
            }

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Invalid verification code')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enable Two-Factor Authentication">
            {step === 'setup' ? (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-arthako-accent/10 border border-arthako-accent/20">
                        <div className="flex items-start gap-3">
                            <Shield className="text-arthako-accent mt-1" size={20} />
                            <div className="text-sm">
                                <p className="font-semibold mb-2">Enhance Your Account Security</p>
                                <p className="text-gray-400">
                                    Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-arthako-accent/20 flex items-center justify-center text-arthako-accent font-semibold">
                                1
                            </div>
                            <span>Install an authenticator app (Google Authenticator, Authy, etc.)</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-arthako-accent/20 flex items-center justify-center text-arthako-accent font-semibold">
                                2
                            </div>
                            <span>Scan the QR code with your app</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-arthako-accent/20 flex items-center justify-center text-arthako-accent font-semibold">
                                3
                            </div>
                            <span>Enter the verification code</span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl glass hover:glass-strong transition-all"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSetup}
                            className="flex-1 px-4 py-3 rounded-xl bg-arthako-accent hover:bg-arthako-accent/80 text-arthako-dark font-semibold transition-all disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Setting up...' : 'Continue'}
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                        {qrCode ? (
                            <div className="p-4 bg-white rounded-xl">
                                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                            </div>
                        ) : (
                            <div className="w-48 h-48 rounded-xl glass flex items-center justify-center">
                                <QrCode size={48} className="text-gray-400" />
                            </div>
                        )}

                        <div className="text-center">
                            <p className="text-sm text-gray-400 mb-2">Or enter this code manually:</p>
                            <code className="px-3 py-2 rounded-lg bg-white/5 text-arthako-accent font-mono text-sm">
                                {secret}
                            </code>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Verification Code</label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-arthako-accent outline-none transition-colors text-center text-2xl tracking-widest font-mono"
                            placeholder="000000"
                            maxLength={6}
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setStep('setup')}
                            className="flex-1 px-4 py-3 rounded-xl glass hover:glass-strong transition-all"
                            disabled={loading}
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 rounded-xl bg-arthako-accent hover:bg-arthako-accent/80 text-arthako-dark font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            disabled={loading || verificationCode.length !== 6}
                        >
                            {loading ? 'Verifying...' : (
                                <>
                                    <Check size={18} />
                                    Enable 2FA
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    )
}
