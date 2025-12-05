import { useState, useEffect } from 'react'
import { Modal } from './AuthModals'
import { Eye, EyeOff, Download, Trash2 } from 'lucide-react'
import type { UserPreferences } from '../../types/account'
import { getUserPreferences, updateUserPreferences, deleteUserActivity, downloadAccountData } from '../../utils/accountUtils'

interface PrivacySettingsModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
}

export function PrivacySettingsModal({ isOpen, onClose, userId }: PrivacySettingsModalProps) {
    const [preferences, setPreferences] = useState<UserPreferences | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        if (isOpen) {
            loadPreferences()
        }
    }, [isOpen, userId])

    const loadPreferences = async () => {
        setLoading(true)
        try {
            const prefs = await getUserPreferences(userId)
            setPreferences(prefs || {
                user_id: userId,
                allow_analytics: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        } catch (err: any) {
            setError(err.message || 'Failed to load preferences')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleAnalytics = async () => {
        if (!preferences) return

        setSaving(true)
        setError('')
        setSuccess('')

        try {
            const newValue = !preferences.allow_analytics
            await updateUserPreferences(userId, { allow_analytics: newValue })
            setPreferences({ ...preferences, allow_analytics: newValue })
            setSuccess('Preferences updated successfully')
        } catch (err: any) {
            setError(err.message || 'Failed to update preferences')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteActivity = async () => {
        if (!confirm('Are you sure you want to delete all your activity data? This action cannot be undone.')) {
            return
        }

        setSaving(true)
        setError('')
        setSuccess('')

        try {
            await deleteUserActivity(userId)
            setSuccess('Activity data deleted successfully')
        } catch (err: any) {
            setError(err.message || 'Failed to delete activity data')
        } finally {
            setSaving(false)
        }
    }

    const handleDownloadData = async () => {
        setSaving(true)
        setError('')
        setSuccess('')

        try {
            await downloadAccountData(userId)
            setSuccess('Account data downloaded successfully')
        } catch (err: any) {
            setError(err.message || 'Failed to download account data')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Privacy Settings">
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading preferences...</div>
                ) : (
                    <>
                        {/* Analytics Toggle */}
                        <div className="p-4 rounded-xl glass border border-white/10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {preferences?.allow_analytics ? (
                                            <Eye size={18} className="text-arthako-accent" />
                                        ) : (
                                            <EyeOff size={18} className="text-gray-400" />
                                        )}
                                        <span className="font-semibold">Analytics</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Allow us to collect anonymous usage data to improve your experience
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggleAnalytics}
                                    disabled={saving}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${preferences?.allow_analytics ? 'bg-arthako-accent' : 'bg-gray-600'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${preferences?.allow_analytics ? 'translate-x-8' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Delete Activity Data */}
                        <div className="p-4 rounded-xl glass border border-white/10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Trash2 size={18} className="text-red-400" />
                                        <span className="font-semibold">Delete Activity Data</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Permanently delete all your activity history and stats
                                    </p>
                                </div>
                                <button
                                    onClick={handleDeleteActivity}
                                    disabled={saving}
                                    className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* Download Account Data */}
                        <div className="p-4 rounded-xl glass border border-white/10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Download size={18} className="text-arthako-accent" />
                                        <span className="font-semibold">Download Your Data</span>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        Download a copy of all your account data as JSON
                                    </p>
                                </div>
                                <button
                                    onClick={handleDownloadData}
                                    disabled={saving}
                                    className="px-4 py-2 rounded-lg bg-arthako-accent/10 hover:bg-arthako-accent/20 text-arthako-accent transition-all disabled:opacity-50"
                                >
                                    Download
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                                {success}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                onClick={onClose}
                                className="w-full px-4 py-3 rounded-xl glass hover:glass-strong transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}
