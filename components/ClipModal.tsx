
import React, { useState } from 'react';
import { GraphonSource } from '../types';

interface ClipModalProps {
    sources: GraphonSource[];
    messageText: string;
    onClose: () => void;
}

const ClipModal: React.FC<ClipModalProps> = ({ sources, messageText, onClose }) => {
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Organize sources by type
    const videoSources = sources.filter(s => s.node_type === 'video');
    const imageSources = sources.filter(s => s.node_type === 'image');
    const documentSources = sources.filter(s => s.node_type === 'document');

    // Format timestamp for display
    const formatTime = (seconds?: number) => {
        if (seconds === undefined) return '';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Generate shareable text summary
    const generateSummary = () => {
        let summary = `📋 **Clip Summary**\n\n`;
        summary += `${messageText.substring(0, 500)}${messageText.length > 500 ? '...' : ''}\n\n`;
        summary += `---\n\n`;
        summary += `📎 **Sources** (${sources.length} items)\n\n`;

        if (videoSources.length > 0) {
            summary += `🎬 **Video Clips** (${videoSources.length})\n`;
            videoSources.forEach((v, i) => {
                summary += `  ${i + 1}. ${v.video_name || 'Video'} [${formatTime(v.start_time)} - ${formatTime(v.end_time)}]\n`;
            });
            summary += '\n';
        }

        if (imageSources.length > 0) {
            summary += `🖼️ **Images** (${imageSources.length})\n`;
            imageSources.forEach((img, i) => {
                summary += `  ${i + 1}. ${img.image_name || 'Image'}\n`;
            });
            summary += '\n';
        }

        if (documentSources.length > 0) {
            summary += `📄 **Documents** (${documentSources.length})\n`;
            documentSources.forEach((doc, i) => {
                summary += `  ${i + 1}. ${doc.pdf_name || 'Document'}${doc.page_num ? ` (Page ${doc.page_num})` : ''}\n`;
            });
        }

        return summary;
    };

    const handleCopy = async () => {
        const summary = generateSummary();
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExport = () => {
        setExporting(true);
        const summary = generateSummary();
        const blob = new Blob([summary], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clip-summary-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md modal-overlay"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up"
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: '1px solid var(--border-primary)' }}
                >
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-film text-lg" style={{ color: 'var(--accent-magenta)' }}></i>
                        <span className="text-sm uppercase tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
                            Clip Compilation
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                            {sources.length} sources
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Answer Summary */}
                    <div
                        className="p-4 rounded"
                        style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}
                    >
                        <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                            Summary
                        </div>
                        <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {messageText.substring(0, 300)}{messageText.length > 300 ? '...' : ''}
                        </div>
                    </div>

                    {/* Video Clips */}
                    {videoSources.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <i className="fa-solid fa-video" style={{ color: 'var(--accent-cyan)' }}></i>
                                <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                    Video Clips [{videoSources.length}]
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {videoSources.map((src, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded overflow-hidden"
                                        style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                                    >
                                        {src.time_limited_url && (
                                            <video
                                                src={`${src.time_limited_url}#t=${src.start_time || 0}`}
                                                controls
                                                className="w-full aspect-video"
                                                preload="metadata"
                                            />
                                        )}
                                        <div className="px-3 py-2 flex items-center justify-between">
                                            <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                                {src.video_name || 'Video'}
                                            </span>
                                            <span className="text-xs" style={{ color: 'var(--accent-green)' }}>
                                                {formatTime(src.start_time)} - {formatTime(src.end_time)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Images */}
                    {imageSources.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <i className="fa-solid fa-image" style={{ color: 'var(--accent-magenta)' }}></i>
                                <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                    Images [{imageSources.length}]
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {imageSources.map((src, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded overflow-hidden aspect-square"
                                        style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                                    >
                                        {src.time_limited_url ? (
                                            <img
                                                src={src.time_limited_url}
                                                alt={src.image_name || 'Image'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                                                <i className="fa-solid fa-image text-2xl"></i>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    {documentSources.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <i className="fa-solid fa-file-pdf" style={{ color: 'var(--accent-yellow)' }}></i>
                                <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                    Documents [{documentSources.length}]
                                </span>
                            </div>
                            <div className="space-y-2">
                                {documentSources.map((src, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 rounded"
                                        style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                                                {src.pdf_name || 'Document'}
                                            </span>
                                            {src.page_num && (
                                                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
                                                    Page {src.page_num}
                                                </span>
                                            )}
                                        </div>
                                        {src.text && (
                                            <div className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                                                "{src.text.substring(0, 200)}{src.text.length > 200 ? '...' : ''}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderTop: '1px solid var(--border-primary)' }}
                >
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-info-circle mr-1"></i>
                        Powered by Graphon Multimodal Search
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCopy}
                            className="px-4 py-2 text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-all hover:opacity-80"
                            style={{
                                border: '1px solid var(--border-primary)',
                                backgroundColor: copied ? 'var(--accent-green-bg)' : 'var(--bg-primary)',
                                color: copied ? 'var(--accent-green)' : 'var(--text-primary)'
                            }}
                        >
                            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="px-4 py-2 text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-all hover:opacity-80"
                            style={{
                                backgroundColor: 'var(--accent-cyan)',
                                color: 'var(--bg-primary)'
                            }}
                        >
                            <i className={`fa-solid ${exporting ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>
                            Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClipModal;
