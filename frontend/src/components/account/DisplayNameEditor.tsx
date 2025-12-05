import { useState, useEffect } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { updateDisplayName } from '../../utils/accountUtils'

interface DisplayNameEditorProps {
    userId: string
    currentDisplayName: string
    onUpdate: (newName: string) => void
}

export function DisplayNameEditor({ userId, currentDisplayName, onUpdate }: DisplayNameEditorProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [displayName, setDisplayName] = useState(currentDisplayName)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Keep local input in sync if parent updates currentDisplayName
    useEffect(() => {
        if (!isEditing) setDisplayName(currentDisplayName)
    }, [currentDisplayName])

    const handleSave = async () => {
        if (!displayName.trim()) {
            setError('Display name cannot be empty')
            return
        }

        if (displayName.length > 50) {
            setError('Display name must be less than 50 characters')
            return
        }

        setSaving(true)
        setError('')

        try {
            if (!userId) {
                throw new Error('Not signed in — cannot update display name')
            }

            const success = await updateDisplayName(userId, displayName.trim())
            if (!success) {
                throw new Error('Failed to update display name')
            }

            onUpdate(displayName.trim())
            setIsEditing(false)
        } catch (err: any) {
            setError(err?.message || 'Failed to update display name')
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        setDisplayName(currentDisplayName)
        setIsEditing(false)
        setError('')
    }

    if (!isEditing) {
        return (
            <div className="flex items-center gap-3">
                <h1 className="text-heading-2 gradient-text">
                    {currentDisplayName}
                </h1>
                <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors group"
                    title="Edit display name"
                >
                    <Edit2 size={18} className="text-gray-400 group-hover:text-arthako-accent transition-colors" />
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl glass border border-white/10 focus:border-arthako-accent outline-none transition-colors text-heading-3"
                    placeholder="Enter display name"
                    maxLength={50}
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all disabled:opacity-50"
                    title="Save"
                >
                    <Check size={20} />
                </button>
                <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50"
                    title="Cancel"
                >
                    <X size={20} />
                </button>
            </div>
            {error && (
                <div className="text-sm text-red-400">
                    {error}
                </div>
            )}
        </div>
    )
}
