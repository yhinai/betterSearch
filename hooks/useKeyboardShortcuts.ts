import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
    onNewSession?: () => void;
    onToggleMode?: () => void;
    onCloseModal?: () => void;
    onFocusInput?: () => void;
    onToggleTheme?: () => void;
    onShowShortcuts?: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

        // Escape - Close modal
        if (e.key === 'Escape' && config.onCloseModal) {
            e.preventDefault();
            config.onCloseModal();
            return;
        }

        // Cmd/Ctrl + K - New session
        if (cmdOrCtrl && e.key === 'k') {
            e.preventDefault();
            config.onNewSession?.();
            return;
        }

        // Cmd/Ctrl + / - Toggle Socratic mode
        if (cmdOrCtrl && e.key === '/') {
            e.preventDefault();
            config.onToggleMode?.();
            return;
        }

        // Cmd/Ctrl + D - Toggle theme
        if (cmdOrCtrl && e.key === 'd') {
            e.preventDefault();
            config.onToggleTheme?.();
            return;
        }

        // Cmd/Ctrl + ? (Shift + /) - Show shortcuts
        if (cmdOrCtrl && e.shiftKey && e.key === '?') {
            e.preventDefault();
            config.onShowShortcuts?.();
            return;
        }

        // Cmd/Ctrl + L - Focus input
        if (cmdOrCtrl && e.key === 'l') {
            e.preventDefault();
            config.onFocusInput?.();
            return;
        }
    }, [config]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

// Keyboard shortcuts data for help display
export const KEYBOARD_SHORTCUTS = [
    { keys: ['⌘/Ctrl', 'K'], description: 'New Session' },
    { keys: ['⌘/Ctrl', '/'], description: 'Toggle Socratic Mode' },
    { keys: ['⌘/Ctrl', 'D'], description: 'Toggle Theme' },
    { keys: ['⌘/Ctrl', 'L'], description: 'Focus Input' },
    { keys: ['⌘/Ctrl', 'Enter'], description: 'Send Message' },
    { keys: ['Escape'], description: 'Close Modal' },
];

export default useKeyboardShortcuts;
