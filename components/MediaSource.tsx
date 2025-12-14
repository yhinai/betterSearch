
import React, { useState } from 'react';
import { GraphonSource } from '../types';

interface MediaSourceProps {
    source: GraphonSource;
}

const MediaSource: React.FC<MediaSourceProps> = ({ source }) => {
    const [expanded, setExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Format timestamp for display
    const formatTime = (seconds?: number) => {
        if (seconds === undefined) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Video source with playable clip
    if (source.node_type === 'video' && source.time_limited_url) {
        return (
            <div
                className="my-3 rounded overflow-hidden group"
                style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}
            >
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                    <i className="fa-solid fa-video text-xs" style={{ color: 'var(--accent-cyan)' }}></i>
                    <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {source.video_name || 'Video Clip'}
                    </span>
                    {source.start_time !== undefined && (
                        <span className="text-xs ml-auto" style={{ color: 'var(--accent-green)' }}>
                            {formatTime(source.start_time)} - {formatTime(source.end_time)}
                        </span>
                    )}
                </div>
                <div className="relative aspect-video bg-black">
                    <video
                        src={`${source.time_limited_url}#t=${source.start_time || 0}`}
                        controls
                        className="w-full h-full"
                        preload="metadata"
                    />
                </div>
            </div>
        );
    }

    // Image source with preview
    if (source.node_type === 'image' && source.time_limited_url) {
        return (
            <div
                className="my-3 rounded overflow-hidden cursor-pointer group"
                style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                    <i className="fa-solid fa-image text-xs" style={{ color: 'var(--accent-magenta)' }}></i>
                    <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {source.image_name || 'Image'}
                    </span>
                    <span className="text-[9px] ml-auto uppercase" style={{ color: 'var(--text-tertiary)' }}>
                        {expanded ? 'Click to collapse' : 'Click to expand'}
                    </span>
                </div>
                {!imageError ? (
                    <img
                        src={source.time_limited_url}
                        alt={source.image_name || 'Source image'}
                        className={`w-full object-contain transition-all duration-300 ${expanded ? 'max-h-[600px]' : 'max-h-32'}`}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="p-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                        Image failed to load
                    </div>
                )}
            </div>
        );
    }

    // Document/PDF source with text snippet
    if (source.node_type === 'document') {
        return (
            <div
                className="my-3 rounded overflow-hidden"
                style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}
            >
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border-secondary)' }}>
                    <i className="fa-solid fa-file-pdf text-xs" style={{ color: 'var(--accent-yellow)' }}></i>
                    <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {source.pdf_name || 'Document'}
                    </span>
                    {source.page_num && (
                        <span className="text-xs ml-auto px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                            Page {source.page_num}
                        </span>
                    )}
                </div>
                {source.text && (
                    <div className="px-3 py-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        "{source.text.substring(0, 300)}{source.text.length > 300 ? '...' : ''}"
                    </div>
                )}
            </div>
        );
    }

    // Fallback for unknown types
    return (
        <div
            className="my-2 px-3 py-2 rounded text-xs"
            style={{ border: '1px solid var(--border-secondary)', color: 'var(--text-muted)' }}
        >
            <i className="fa-solid fa-link mr-2"></i>
            Source: {source.node_type}
        </div>
    );
};

interface MediaSourceListProps {
    sources: GraphonSource[];
    maxSources?: number;
}

export const MediaSourceList: React.FC<MediaSourceListProps> = ({ sources, maxSources = 5 }) => {
    const [showAll, setShowAll] = useState(false);

    if (!sources || sources.length === 0) return null;

    const displayedSources = showAll ? sources : sources.slice(0, maxSources);
    const hasMore = sources.length > maxSources;

    return (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-secondary)' }}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Sources [{sources.length}]
                </span>
            </div>
            {displayedSources.map((source, index) => (
                <MediaSource key={index} source={source} />
            ))}
            {hasMore && !showAll && (
                <button
                    onClick={() => setShowAll(true)}
                    className="text-xs uppercase tracking-wider py-2 w-full text-center hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--accent-cyan)' }}
                >
                    Show {sources.length - maxSources} more sources
                </button>
            )}
        </div>
    );
};

export default MediaSource;
