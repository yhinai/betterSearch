import React from 'react';
import { useTheme } from './ThemeProvider';

interface SvgModalProps {
  content: string;
  onClose: () => void;
}

const SvgModal: React.FC<SvgModalProps> = ({ content, onClose }) => {
  const { theme } = useTheme();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 animate-fade-in modal-overlay"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-[95vw] max-h-[95vh] rounded flex items-center justify-center p-8 overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 flex items-center gap-2 transition-colors px-3 py-1 rounded-sm uppercase text-xs tracking-widest hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-primary)'
          }}
        >
          <span>Close View</span>
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
        <div
          className={`w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full ${theme === 'light' ? 'svg-invert' : ''}`}
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <div
          className="absolute bottom-4 left-8 text-[10px] tracking-[0.2em] uppercase select-none"
          style={{ color: 'var(--text-muted)' }}
        >
          Full_Scale_Rendering_Mode
        </div>
      </div>
    </div>
  );
};

export default SvgModal;

