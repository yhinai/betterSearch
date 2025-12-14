import React, { useRef, useState, useEffect } from 'react';

interface VideoPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    videoSrc?: string;
    title: string;
    timestamp: number; // in seconds
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ isOpen, onClose, videoSrc, title, timestamp }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);

    // Initialize player state when opened
    useEffect(() => {
        if (isOpen && videoRef.current) {
            videoRef.current.currentTime = timestamp;
            // Auto-play when opened
            videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay prevented", e));
        }
    }, [isOpen, timestamp]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setProgress((current / total) * 100);
            setDuration(total);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const seekTime = (Number(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = seekTime;
            setProgress(Number(e.target.value));
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Player Container */}
            <div
                className="relative w-full max-w-4xl mx-4 aspect-video bg-black rounded-lg shadow-2xl overflow-hidden border border-white/10 group"
                style={{ boxShadow: '0 0 50px rgba(0, 255, 255, 0.1)' }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 text-white/50 hover:text-white bg-black/20 hover:bg-black/60 rounded-full w-8 h-8 flex items-center justify-center transition-all backdrop-blur-sm"
                >
                    <i className="fa-solid fa-times"></i>
                </button>

                {/* Video Element */}
                <video
                    ref={videoRef}
                    src={videoSrc || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} // Fallback for demo
                    className="w-full h-full object-cover"
                    onTimeUpdate={handleTimeUpdate}
                    onClick={togglePlay}
                />

                {/* Overlay Controls (Glassmorphism) */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 opacity-0 group-hover:opacity-100">

                    {/* Title & Time */}
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-cyan-400 mb-1">Deep Media Playback</div>
                            <h3 className="text-white font-medium text-lg tracking-tight">{title}</h3>
                        </div>
                        <div className="text-white/70 font-mono text-xs">
                            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration || 0)}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer mb-4 accent-cyan-400"
                    />

                    {/* Control Buttons */}
                    <div className="flex items-center gap-4 text-white">
                        <button onClick={togglePlay} className="hover:text-cyan-400 transition-colors">
                            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl`}></i>
                        </button>

                        <button className="hover:text-cyan-400 transition-colors">
                            <i className="fa-solid fa-backward-step"></i>
                        </button>
                        <button className="hover:text-cyan-400 transition-colors">
                            <i className="fa-solid fa-forward-step"></i>
                        </button>

                        <div className="flex items-center gap-2 ml-4 group/vol">
                            <button onClick={toggleMute} className="hover:text-cyan-400 w-6">
                                <i className={`fa-solid ${isMuted ? 'fa-volume-mute' : 'fa-volume-high'}`}></i>
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setVolume(val);
                                    if (videoRef.current) videoRef.current.volume = val;
                                    setIsMuted(val === 0);
                                }}
                                className="w-0 overflow-hidden group-hover/vol:w-20 transition-all h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                            />
                        </div>

                        <div className="flex-1"></div>

                        <button className="hover:text-cyan-400 transition-colors">
                            <i className="fa-solid fa-cog"></i>
                        </button>
                        <button className="hover:text-cyan-400 transition-colors">
                            <i className="fa-solid fa-expand"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
