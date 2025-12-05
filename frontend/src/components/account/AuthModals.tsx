import { useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md glass-strong rounded-2xl border-2 border-white/10 p-6 animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-heading-3 gradient-text">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div>{children}</div>
            </div>
        </div>
    )
}

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (newPassword: string) => Promise<void>
}

export function ChangePasswordModal({ isOpen, onClose, onSubmit }: ChangePasswordModalProps) {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await onSubmit(newPassword)
            setNewPassword('')
            setConfirmPassword('')
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to change password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-arthako-accent outline-none transition-colors"
                        placeholder="Enter new password"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-arthako-accent outline-none transition-colors"
                        placeholder="Confirm new password"
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
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl glass hover:glass-strong transition-all"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-3 rounded-xl bg-arthako-accent hover:bg-arthako-accent/80 text-arthako-dark font-semibold transition-all disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}

interface ChangeEmailModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (newEmail: string) => Promise<void>
    currentEmail: string
}

export function ChangeEmailModal({ isOpen, onClose, onSubmit, currentEmail }: ChangeEmailModalProps) {
    const [newEmail, setNewEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!newEmail.includes('@')) {
            setError('Please enter a valid email address')
            return
        }

        if (newEmail === currentEmail) {
            setError('New email must be different from current email')
            return
        }

        setLoading(true)
        try {
            await onSubmit(newEmail)
            setNewEmail('')
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to change email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Email">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Current Email</label>
                    <input
                        type="email"
                        value={currentEmail}
                        disabled
                        className="w-full px-4 py-3 rounded-xl glass border border-white/10 opacity-50"
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-400 mb-2">New Email</label>
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-arthako-accent outline-none transition-colors"
                        placeholder="Enter new email"
                        required
                    />
                </div>

                <div className="p-3 rounded-lg bg-arthako-accent/10 border border-arthako-accent/20 text-sm">
                    <p className="text-gray-300">You will receive a confirmation email at the new address.</p>
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
                        type="submit"
                        className="flex-1 px-4 py-3 rounded-xl bg-arthako-accent hover:bg-arthako-accent/80 text-arthako-dark font-semibold transition-all disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Updating...' : 'Update Email'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
