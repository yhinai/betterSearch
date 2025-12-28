
import React, { useState, useRef, useEffect } from 'react';
import { MODES } from '../constants';
import { Attachment } from '../types';
import { transcribeAudio } from '../services/elevenService';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: (e?: React.FormEvent, overrideText?: string, isCompare?: boolean, attachments?: Attachment[]) => void;
  isLoading: boolean;
  processTime?: number;
  mode?: string;
  onStop?: () => void;
  onRegenerate?: (isCompare: boolean) => void;
  hasHistory?: boolean;
  elevenLabsApiKey?: string;
}

const InputArea: React.FC<InputAreaProps> = ({
  input,
  setInput,
  handleSend,
  isLoading,
  processTime,
  mode,
  onStop,
  onRegenerate,
  hasHistory,
  elevenLabsApiKey
}) => {
  const [isCompare, setIsCompare] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px height
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    handleSend(undefined, undefined, isCompare, attachments);
    setAttachments([]);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
    // Shift+Enter adds new line (default behavior)
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      const apiKey = elevenLabsApiKey || import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (!apiKey) {
        alert("ElevenLabs API Key required for voice dictation");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());

          // Show temporary loading state in input
          const originalInput = input;
          setInput(input + " (Transcribing...)");

          try {
            const text = await transcribeAudio(blob, apiKey, { languageCode: 'en' });
            setInput(originalInput + (originalInput ? " " : "") + text);
          } catch (err) {
            console.error("STT Error:", err);
            setInput(originalInput); // Revert on error
            alert("Transcription failed");
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone access denied");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const newAttachments: Attachment[] = [];

      for (const file of files) {
        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const res = reader.result as string;
              // remove data:mime/type;base64, prefix
              resolve(res.split(',')[1]);
            };
            reader.readAsDataURL(file);
          });

          newAttachments.push({
            type: file.type.startsWith('image/') ? 'image' : 'file',
            mimeType: file.type,
            data: base64,
            name: file.name
          });
        } catch (err) {
          console.error("Error reading file", file.name, err);
        }
      }
      setAttachments(prev => [...prev, ...newAttachments]);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="fixed bottom-0 left-0 w-full backdrop-blur-sm z-10"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)',
        borderTop: '1px solid var(--border-secondary)'
      }}
    >

      {/* Attachment Preview Bar */}
      {attachments.length > 0 && (
        <div
          className="w-full px-4 py-2 flex gap-4 overflow-x-auto no-scrollbar"
          style={{
            backgroundColor: 'var(--bg-hover)',
            borderBottom: '1px solid var(--border-secondary)'
          }}
        >
          {attachments.map((att, i) => (
            <div key={i} className="relative group flex-shrink-0 animate-slide-up">
              {att.type === 'image' ? (
                <div
                  className="h-16 w-16 rounded overflow-hidden"
                  style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}
                >
                  <img src={`data:${att.mimeType};base64,${att.data}`} alt="preview" className="h-full w-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div
                  className="h-16 w-16 rounded flex flex-col items-center justify-center group-hover:opacity-100 opacity-50 transition-colors"
                  style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                >
                  <i className="fa-solid fa-file-pdf text-xl mb-1"></i>
                  <span className="text-[8px] uppercase tracking-widest max-w-full truncate px-1">{att.mimeType.split('/')[1]}</span>
                </div>
              )}
              <button
                onClick={() => removeAttachment(i)}
                className="absolute -top-2 -right-2 bg-red-900/80 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-colors"
                style={{ border: '1px solid var(--border-primary)' }}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="w-[95%] md:w-[90%] mx-auto flex items-end gap-3 py-3 md:py-5">
        {/* Prompt symbol aligned with flex end for multi-line support */}
        <span
          className={`text-lg animate-pulse hidden md:block font-bold opacity-80 leading-none select-none pb-2`}
          style={{ color: mode === MODES.SOCRATIC ? 'var(--accent-amber)' : 'var(--text-primary)' }}
        >
          {mode === MODES.SOCRATIC ? '?' : '>'}
        </span>

        <form onSubmit={onSubmit} className="flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === MODES.SOCRATIC ? "Enter response... (Shift+Enter for new line)" : "Initiate command... (Shift+Enter for new line)"}
            className="w-full min-h-[40px] max-h-[200px] bg-transparent outline-none font-mono text-sm transition-all px-2 py-2 resize-none overflow-y-auto"
            style={{
              color: 'var(--text-primary)',
              borderBottom: '1px solid var(--border-primary)'
            }}
            rows={1}
            autoFocus
          />
        </form>

        {isLoading ? (
          <button
            onClick={onStop}
            className="h-10 border hover:bg-red-600 transition-all uppercase text-[10px] tracking-widest px-6 font-bold flex items-center justify-center whitespace-nowrap animate-pulse"
            style={{ backgroundColor: 'var(--accent-red-bg)', color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}
          >
            STOP {processTime !== undefined && processTime > 0 && `(${processTime.toFixed(1)}s)`}
          </button>
        ) : (
          <button
            onClick={() => onSubmit()}
            disabled={(!input.trim() && attachments.length === 0)}
            className="h-10 border disabled:opacity-50 transition-all uppercase text-[10px] tracking-widest px-6 font-bold flex items-center justify-center whitespace-nowrap hover:opacity-80"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)', borderColor: 'var(--text-primary)' }}
          >
            EXECUTE
          </button>
        )}

        {!isLoading && hasHistory && !input.trim() && (
          <button
            onClick={() => onRegenerate?.(isCompare)}
            className="h-10 w-10 flex items-center justify-center transition-all rounded-sm hover:opacity-100 opacity-50"
            style={{ border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
            title="Regenerate Last Response"
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>
        )}

        <button
          onClick={handleMicClick}
          className={`h-10 w-10 flex items-center justify-center transition-all rounded-sm ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse border-red-500' : 'hover:opacity-100 opacity-50 border-gray-700 text-gray-400'}`}
          style={{ border: isRecording ? '1px solid var(--accent-red)' : '1px solid var(--border-primary)' }}
          title={isRecording ? "Stop Recording" : "Dictate with ElevenLabs Scribe"}
        >
          <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone-lines'}`}></i>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-10 flex items-center justify-center transition-all rounded-sm hover:opacity-100 opacity-50"
          style={{ border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
          title="Attach PDF or Image"
        >
          <i className="fa-solid fa-paperclip"></i>
        </button>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf"
        />

        <button
          onClick={() => setIsCompare(!isCompare)}
          className="h-10 border transition-all uppercase text-[10px] tracking-widest px-3 font-bold flex items-center justify-center gap-2"
          style={{
            backgroundColor: isCompare ? 'var(--accent-cyan-bg)' : 'var(--bg-primary)',
            color: isCompare ? 'var(--accent-cyan)' : 'var(--text-muted)',
            borderColor: isCompare ? 'var(--accent-cyan)' : 'var(--border-primary)',
            boxShadow: isCompare ? '0 0 10px rgba(34,211,238,0.2)' : 'none'
          }}
          title="Compare Mode (Generate two responses)"
        >
          <i className="fa-solid fa-code-compare text-xs"></i>
          <span className="hidden md:inline">COMPARE</span>
        </button>

      </div>
    </div>
  );
};

export default InputArea;
