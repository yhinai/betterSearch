import React, { useState, useCallback } from 'react';
import { Attachment } from '../types';

interface DropZoneProps {
    onFilesDropped: (attachments: Attachment[]) => void;
    children: React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesDropped, children }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set dragging to false if we're leaving the drop zone entirely
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const attachments: Attachment[] = [];

        for (const file of files) {
            // Only accept images and PDFs
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                continue;
            }

            try {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const res = reader.result as string;
                        resolve(res.split(',')[1]);
                    };
                    reader.readAsDataURL(file);
                });

                attachments.push({
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    mimeType: file.type,
                    data: base64,
                    name: file.name
                });
            } catch (err) {
                console.error('Error reading file', file.name, err);
            }
        }

        if (attachments.length > 0) {
            onFilesDropped(attachments);
        }
    }, [onFilesDropped]);

    return (
        <div
            className="relative"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {children}

            {/* Drop Overlay */}
            {isDragging && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <div
                        className="p-12 rounded-lg flex flex-col items-center gap-4"
                        style={{
                            border: '3px dashed var(--accent-cyan)',
                            backgroundColor: 'var(--accent-cyan-bg)'
                        }}
                    >
                        <i
                            className="fa-solid fa-cloud-arrow-up text-5xl"
                            style={{ color: 'var(--accent-cyan)' }}
                        ></i>
                        <div className="text-center">
                            <p
                                className="text-lg font-bold uppercase tracking-widest"
                                style={{ color: 'var(--accent-cyan)' }}
                            >
                                Drop Files Here
                            </p>
                            <p
                                className="text-xs mt-2"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Images & PDFs supported
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropZone;
