import { getMediaType } from '../../utils/accountUtils'
import type { MediaType } from '../../types/account'

interface ProfileAvatarProps {
    mediaUrl: string | null
    displayName: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    showOnlineIndicator?: boolean
}

const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-3xl'
}

const indicatorSizes = {
    sm: 'w-3 h-3 -bottom-0.5 -right-0.5 border-2',
    md: 'w-4 h-4 -bottom-0.5 -right-0.5 border-2',
    lg: 'w-6 h-6 -bottom-1 -right-1 border-3',
    xl: 'w-8 h-8 -bottom-1 -right-1 border-4'
}

export function ProfileAvatar({
    mediaUrl,
    displayName,
    size = 'md',
    showOnlineIndicator = false
}: ProfileAvatarProps) {
    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase()
    }

    const renderMedia = () => {
        if (!mediaUrl) {
            return (
                <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-arthako-accent to-arthako-accent-purple flex items-center justify-center font-bold text-arthako-dark animate-glow-pulse`}>
                    {getInitials(displayName || 'AR')}
                </div>
            )
        }

        const mediaType: MediaType = getMediaType(mediaUrl)

        switch (mediaType) {
            case 'video':
                return (
                    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-arthako-accent/30`}>
                        <video
                            src={mediaUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    </div>
                )
            case 'gif':
            case 'image':
                return (
                    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-arthako-accent/30`}>
                        <img
                            src={mediaUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )
        }
    }

    return (
        <div className="relative inline-block">
            {renderMedia()}
            {showOnlineIndicator && (
                <div className={`absolute ${indicatorSizes[size]} bg-green-500 rounded-full border-arthako-dark animate-pulse`} />
            )}
        </div>
    )
}
