import { useState, useEffect } from 'react'
import { Modal } from './AuthModals'
import { Smartphone, Monitor, Tablet, X } from 'lucide-react'
import type { ActiveSession } from '../../types/account'

interface ManageSessionsModalProps {
    isOpen: boolean
    onClose: () => void
    onSignOut: (sessionId: string) => Promise<void>
}

export function ManageSessionsModal({ isOpen, onClose, onSignOut }: ManageSessionsModalProps) {
    const [sessions, setSessions] = useState<ActiveSession[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            loadSessions()
        }
    }, [isOpen])

    const loadSessions = async () => {
        setLoading(true)
        setError('')
        try {
            const activeSessions = await import('../../utils/accountUtils').then(m => m.getActiveSessions())
            setSessions(activeSessions)
        } catch (err: any) {
            setError(err.message || 'Failed to load sessions')
        } finally {
            setLoading(false)
        }
    }

    const handleSignOut = async (sessionId: string) => {
        try {
            await onSignOut(sessionId)
            setSessions(sessions.filter(s => s.id !== sessionId))
        } catch (err: any) {
            setError(err.message || 'Failed to sign out')
        }
    }

    const getDeviceIcon = (userAgent?: string) => {
        if (!userAgent) return <Monitor size={20} />

        if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
            return <Smartphone size={20} />
        }
        if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
            return <Tablet size={20} />
        }
        return <Monitor size={20} />
    }

    const getDeviceName = (userAgent?: string) => {
        if (!userAgent) return 'Unknown Device'

        if (userAgent.includes('Chrome')) return 'Chrome Browser'
        if (userAgent.includes('Firefox')) return 'Firefox Browser'
        if (userAgent.includes('Safari')) return 'Safari Browser'
        if (userAgent.includes('Edge')) return 'Edge Browser'
        return 'Web Browser'
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Active Sessions">
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading sessions...</div>
                ) : error ? (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No active sessions</div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className="flex items-center gap-4 p-4 rounded-xl glass border border-white/10"
                            >
                                <div className="p-3 rounded-lg bg-arthako-accent/10 text-arthako-accent">
                                    {getDeviceIcon(session.user_agent)}
                                </div>

                                <div className="flex-1">
                                    <div className="font-semibold">{getDeviceName(session.user_agent)}</div>
                                    <div className="text-sm text-gray-400">
                                        Active since {new Date(session.created_at).toLocaleDateString()}
                                    </div>
                                    {session.id === 'current' && (
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                                            Current Session
                                        </span>
                                    )}
                                </div>

                                {session.id !== 'current' && (
                                    <button
                                        onClick={() => handleSignOut(session.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                                        title="Sign out from this device"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 rounded-xl glass hover:glass-strong transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    )
}
