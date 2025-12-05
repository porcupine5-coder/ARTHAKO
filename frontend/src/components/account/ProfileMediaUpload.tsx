import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Film } from 'lucide-react'
import { uploadProfileMedia, updateProfileMediaUrl, getMediaType } from '../../utils/accountUtils'
import type { MediaType } from '../../types/account'

interface ProfileMediaUploadProps {
    userId: string
    currentMediaUrl: string | null
    onUpdate: (url: string) => void
}

export function ProfileMediaUpload({ userId, currentMediaUrl, onUpdate }: ProfileMediaUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [preview, setPreview] = useState<string | null>(currentMediaUrl)
    const [mediaType, setMediaType] = useState<MediaType>(
        currentMediaUrl ? getMediaType(currentMediaUrl) : 'image'
    )
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!userId) {
            setError('You must be signed in to upload profile media')
            return
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm']
        if (!validTypes.includes(file.type)) {
            setError('Please select a valid image (JPG, PNG, GIF) or video (MP4, WebM)')
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB')
            return
        }

        setError('')
        setUploading(true)

        try {
            // Create preview
            const previewUrl = URL.createObjectURL(file)
            setPreview(previewUrl)

            // Determine media type
            let type: MediaType = 'image'
            if (file.type.includes('gif')) type = 'gif'
            else if (file.type.includes('video')) type = 'video'
            setMediaType(type)

            // Upload to Supabase
            // uploadProfileMedia now throws on failure with a descriptive message
            const result = await uploadProfileMedia(userId, file)

            // Update database
            const success = await updateProfileMediaUrl(userId, result.url)
            if (!success) {
                throw new Error('Failed to save profile media URL to database')
            }

            onUpdate(result.url)
            setPreview(result.url)
            setMediaType(result.type)
        } catch (err: any) {
            setError(err?.message || 'Failed to upload media')
            setPreview(currentMediaUrl)
        } finally {
            setUploading(false)
        }
    }

    const handleRemove = async () => {
        if (!confirm('Are you sure you want to remove your profile media?')) return

        setUploading(true)
        try {
            const success = await updateProfileMediaUrl(userId, '')
            if (!success) {
                throw new Error('Failed to remove media')
            }

            setPreview(null)
            onUpdate('')
        } catch (err: any) {
            setError(err.message || 'Failed to remove media')
        } finally {
            setUploading(false)
        }
    }

    const renderMedia = () => {
        if (!preview) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={32} className="mb-2" />
                    <span className="text-sm">No media</span>
                </div>
            )
        }

        switch (mediaType) {
            case 'video':
                return (
                    <video
                        src={preview}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                )
            case 'gif':
            case 'image':
                return (
                    <img
                        src={preview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                    />
                )
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-arthako-accent/20 to-arthako-accent-purple/20 border-2 border-white/10">
                    {renderMedia()}

                    {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-arthako-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex-1 space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full px-4 py-2 rounded-xl glass hover:glass-strong transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Upload size={18} />
                        Upload Media
                    </button>

                    {preview && (
                        <button
                            onClick={handleRemove}
                            disabled={uploading}
                            className="w-full px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <X size={18} />
                            Remove
                        </button>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="p-3 rounded-lg bg-arthako-accent/10 border border-arthako-accent/20 text-sm">
                <p className="text-gray-300">
                    Supported formats: JPG, PNG, GIF, MP4, WebM (max 10MB)
                </p>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}
        </div>
    )
}
