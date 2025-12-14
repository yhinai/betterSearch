import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useTheme } from './ThemeProvider';
import { MODELS, MODES } from '../constants';

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actions: {
        toggleTheme: () => void;
        clearChat: () => void;
        toggleSocratic: () => void;
        toggleGraphon: () => void;
        openSettings: () => void;
        openHive: () => void;
        openLive: () => void;
    };
    config: any;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange, actions, config }) => {
    const { theme } = useTheme();

    // Toggle with Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open, onOpenChange]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => onOpenChange(false)} />

            <Command
                className="relative w-full max-w-lg rounded-lg shadow-2xl overflow-hidden glass-panel border border-white/10"
                style={{
                    background: theme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(24px)'
                }}
                loop
            >
                <div className="flex items-center border-b border-white/10 px-3" cmdk-input-wrapper="">
                    <i className="fa-solid fa-search mr-2 text-white/40"></i>
                    <Command.Input
                        autoFocus
                        placeholder="Type a command or search..."
                        className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-white/40 text-theme-primary"
                    />
                    <kbd className="hidden sm:inline-block pointer-events-none h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium opacity-100 text-white/40">
                        ESC
                    </kbd>
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                    <Command.Empty className="py-6 text-center text-sm text-theme-muted">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Actions" className="text-xs text-theme-muted font-medium px-2 py-1.5 uppercase tracking-wider mb-2">
                        <Command.Item
                            onSelect={() => { actions.toggleTheme(); onOpenChange(false); }}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-theme-highlight aria-selected:text-theme-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors cursor-pointer hover:bg-white/10"
                        >
                            <i className={`mr-2 fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} w-4 text-center`}></i>
                            <span>Toggle Theme</span>
                        </Command.Item>

                        <Command.Item
                            onSelect={() => { actions.clearChat(); onOpenChange(false); }}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-theme-highlight aria-selected:text-theme-primary transition-colors cursor-pointer hover:bg-white/10"
                        >
                            <i className="mr-2 fa-solid fa-trash w-4 text-center text-red-400"></i>
                            <span>Clear Chat History</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Modes" className="text-xs text-theme-muted font-medium px-2 py-1.5 uppercase tracking-wider mb-2">
                        <Command.Item
                            onSelect={() => { actions.toggleSocratic(); onOpenChange(false); }}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-theme-highlight aria-selected:text-theme-primary transition-colors cursor-pointer hover:bg-white/10"
                        >
                            <i className={`mr-2 fa-solid fa-graduation-cap w-4 text-center ${config.mode === MODES.SOCRATIC ? 'text-cyan-400' : ''}`}></i>
                            <span>Toggle Socratic Mode</span>
                            {config.mode === MODES.SOCRATIC && <span className="ml-auto text-xs text-cyan-400">ACTIVE</span>}
                        </Command.Item>

                        <Command.Item
                            onSelect={() => { actions.toggleGraphon(); onOpenChange(false); }}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-theme-highlight aria-selected:text-theme-primary transition-colors cursor-pointer hover:bg-white/10"
                        >
                            <i className={`mr-2 fa-solid fa-brain w-4 text-center ${config.useGraphon ? 'text-purple-400' : ''}`}></i>
                            <span>Toggle Knowledge Mode</span>
                            {config.useGraphon && <span className="ml-auto text-xs text-purple-400">ACTIVE</span>}
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Navigation" className="text-xs text-theme-muted font-medium px-2 py-1.5 uppercase tracking-wider mb-2">
                        <Command.Item
                            onSelect={() => { actions.openHive(); onOpenChange(false); }}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-theme-highlight aria-selected:text-theme-primary transition-colors cursor-pointer hover:bg-white/10"
                        >
                            <i className="mr-2 fa-solid fa-database w-4 text-center"></i>
                            <span>Open Hive (Archives)</span>
                        </Command.Item>

                        <Command.Item
                            onSelect={() => { actions.openSettings(); onOpenChange(false); }}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-theme-highlight aria-selected:text-theme-primary transition-colors cursor-pointer hover:bg-white/10"
                        >
                            <i className="mr-2 fa-solid fa-cog w-4 text-center"></i>
                            <span>Settings</span>
                        </Command.Item>

                        <Command.Item
                            onSelect={() => { actions.openLive(); onOpenChange(false); }}
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-theme-highlight aria-selected:text-theme-primary transition-colors cursor-pointer hover:bg-white/10"
                        >
                            <i className="mr-2 fa-solid fa-wave-square w-4 text-center"></i>
                            <span>Start Live Session</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
};

export default CommandPalette;
