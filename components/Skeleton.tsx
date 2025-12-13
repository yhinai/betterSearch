import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'text',
    width,
    height,
    lines = 1
}) => {
    const baseStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-tertiary)',
        backgroundImage: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-hover) 50%, var(--bg-tertiary) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        width: width,
        height: height,
    };

    const getVariantClasses = () => {
        switch (variant) {
            case 'circular':
                return 'rounded-full';
            case 'rectangular':
                return 'rounded';
            case 'text':
            default:
                return 'rounded h-4';
        }
    };

    if (lines > 1) {
        return (
            <div className={`space-y-2 ${className}`}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={`${getVariantClasses()} ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                        style={{ ...baseStyle, height: height || '1rem' }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${getVariantClasses()} ${className}`}
            style={baseStyle}
        />
    );
};

// Message Skeleton for loading AI responses
export const MessageSkeleton: React.FC = () => {
    return (
        <div className="flex gap-4 p-4 animate-fade-in">
            {/* Avatar skeleton */}
            <Skeleton variant="circular" width={40} height={40} />

            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <Skeleton width={80} height={12} />
                    <Skeleton width={60} height={10} />
                </div>

                {/* Text lines */}
                <Skeleton lines={3} />

                {/* Code block skeleton */}
                <div
                    className="rounded-md p-4 mt-2"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                    <Skeleton lines={4} height={14} />
                </div>
            </div>
        </div>
    );
};

// Card Skeleton for notes/history items
export const CardSkeleton: React.FC = () => {
    return (
        <div
            className="p-4 rounded-md animate-fade-in"
            style={{ border: '1px solid var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}
        >
            <div className="flex justify-between items-start mb-3">
                <Skeleton width="60%" height={16} />
                <Skeleton width={60} height={12} />
            </div>
            <Skeleton lines={2} />
        </div>
    );
};

// Thinking Indicator for AI processing
export const ThinkingIndicator: React.FC = () => {
    return (
        <div className="flex items-center gap-3 p-4 animate-fade-in">
            <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{
                            backgroundColor: 'var(--accent-cyan)',
                            animationDelay: `${i * 0.15}s`
                        }}
                    />
                ))}
            </div>
            <span
                className="text-xs uppercase tracking-widest font-bold"
                style={{ color: 'var(--text-muted)' }}
            >
                Processing...
            </span>
        </div>
    );
};

export default Skeleton;
