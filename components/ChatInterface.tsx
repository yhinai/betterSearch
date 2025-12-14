import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_CONFIG, MODES, MODELS } from '../constants';
import { Message, AppConfig, Attachment } from '../types';
import { streamResponse, generateTitle } from '../services/llmService';
import { planResearch, executeStep, AgentStep } from '../services/agentService';
import { createChatSession, saveMessage, getMessagesByChatId, updateChatTitle, saveNote, getChatSessions, getHiveTransmissions } from '../services/dbService';
import { useTheme } from './ThemeProvider';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import MessageList from './MessageList';
import InputArea from './InputArea';
import DropZone from './DropZone';

import CommandPalette from './CommandPalette';

// Lazy load modals for better performance
const SettingsModal = lazy(() => import('./SettingsModal'));
const SvgModal = lazy(() => import('./SvgModal'));
const HistoryModal = lazy(() => import('./HistoryModal'));
const NotesModal = lazy(() => import('./NotesModal'));
const SyllabusModal = lazy(() => import('./SyllabusModal'));
const HiveModal = lazy(() => import('./HiveModal'));
const LiveInterface = lazy(() => import('./LiveInterface'));

// Loading fallback for modals
const ModalLoader = () => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md modal-overlay"
  >
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-cyan)' }}></div>
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-cyan)', animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-cyan)', animationDelay: '0.2s' }}></div>
    </div>
  </div>
);

interface ChatInterfaceProps {
  username: string;
  onLogout: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ username, onLogout }) => {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [input, setInput] = useState('');
  const [modalSvg, setModalSvg] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [showHive, setShowHive] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Abort Controller for stopping generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load config
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('bettersearch_config');
    // Ensure we start with default model if local storage is stale or empty
    const parsed = saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    // Migration: If config has old thinking model, update it? 
    // We'll let user toggle it manually or rely on default if missing.
    return parsed;
  });

  // Save config whenever it changes
  useEffect(() => {
    localStorage.setItem('bettersearch_config', JSON.stringify(config));
  }, [config]);

  // Start new session on mount if none, or if user changed
  useEffect(() => {
    // When username changes, we should look for the most recent session or create a new one
    const sessions = getChatSessions(username);
    if (sessions.length > 0) {
      setCurrentChatId(sessions[0].id);
    } else {
      handleNewSession();
    }
  }, [username]);

  // Poll for Hive Messages
  const { data: hiveMessages = [] } = useQuery({
    queryKey: ['hive', username],
    queryFn: () => getHiveTransmissions(username),
    refetchInterval: 5000
  });

  // Close any open modal
  const closeAllModals = () => {
    setShowSettings(false);
    setShowHistory(false);
    setShowNotes(false);
    setShowSyllabus(false);
    setShowHive(false);
    setShowLive(false);
    setModalSvg(null);
  };

  const handleNewSession = () => {
    handleStop(); // Stop any pending generation
    const newSession = createChatSession(username);
    setCurrentChatId(newSession.id);
    queryClient.invalidateQueries({ queryKey: ['sessions', username] });
    queryClient.setQueryData(['messages', newSession.id], []);
  };

  const handleSelectChat = (chatId: string) => {
    handleStop(); // Stop active gen
    setCurrentChatId(chatId);
  };

  const toggleMode = () => {
    setConfig(prev => ({
      ...prev,
      mode: (prev.mode === MODES.DIRECT ? MODES.SOCRATIC : MODES.DIRECT) as 'direct' | 'socratic'
    }));
  };

  const toggleModel = () => {
    setConfig(prev => ({
      ...prev,
      model: prev.model === MODELS.GEMINI_3 ? MODELS.GEMINI_2_5 : MODELS.GEMINI_3
    }));
  };

  // Keyboard shortcuts - must be after function declarations
  useKeyboardShortcuts({
    onNewSession: handleNewSession,
    onToggleMode: toggleMode,
    onToggleTheme: toggleTheme,
    onCloseModal: closeAllModals,
    onFocusInput: () => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus(),
  });

  // React Query for Messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', currentChatId],
    queryFn: () => currentChatId ? getMessagesByChatId(currentChatId) : [],
    enabled: !!currentChatId,
  });

  // --- DEEP RESEARCH LOGIC ---

  /**
   * Deep Research Orchestration
   * 1. Plan
   * 2. Execute Steps
   * 3. Final Answer
   */
  const handleDeepResearch = async (prompt: string, chatId: string, currentMsgs: Message[], signal: AbortSignal) => {
    const aiMsgId = (Date.now() + 1).toString();
    const updateMsg = (text: string) => {
      queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => {
        if (!old) return [];
        return old.map(m => m.id === aiMsgId ? { ...m, text: text } : m);
      });
    };

    let fullText = "🧠 *Deep Research Agent Initialized...*\n\n";

    try {
      // 1. Plan
      fullText += "📋 *Generating Research Plan...*\n";
      updateMsg(fullText);

      const plan = await planResearch(config, prompt);
      fullText += `\n**Plan Goal:** ${plan.goal}\n`;
      updateMsg(fullText);

      const contextForFinal: string[] = [];

      // 2. Execute Steps
      for (const step of plan.steps) {
        if (signal?.aborted) throw new Error("Aborted");
        fullText += `\n> **Step ${step.id}:** ${step.thought} (${step.action})...\n`;
        updateMsg(fullText);

        const result = await executeStep(step);
        contextForFinal.push(`Step ${step.id} Result: ${result}`);

        // Show snippet of result
        const snippet = result.length > 200 ? result.substring(0, 200) + "..." : result;
        fullText += `  *Result:* ${snippet}\n`;
        updateMsg(fullText);
      }

      // 3. Final Synthesis
      fullText += "\n✨ *Synthesizing Final Answer...*\n\n";
      updateMsg(fullText);

      const finalPrompt = `
        Research Context:
        ${contextForFinal.join('\n\n')}

        User Question: ${prompt}

        Synthesize a comprehensive answer based on the research above.
      `;

      await streamResponse(config, [], finalPrompt, (chunk) => {
        fullText += chunk;
        updateMsg(fullText);
      }, signal);

      return fullText;

    } catch (e) {
      const errText = fullText + `\n\n❌ **Research Failed:** ${(e as Error).message}`;
      updateMsg(errText);
      return errText;
    }
  };

  // --- MUTATION ---

  const mutateChat = async ({ userText, chatId, currentMsgs, isCompare, attachments, signal }: { userText: string, chatId: string, currentMsgs: Message[], isCompare?: boolean, attachments?: Attachment[], signal?: AbortSignal }) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      chatId: chatId,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
      attachments: attachments
    };

    saveMessage(userMsg);

    // Update Title logic
    const sessions = getChatSessions(username);
    const currentSession = sessions.find(s => s.id === chatId);
    const isFork = currentSession?.title.startsWith('Fork:');

    if ((currentMsgs.length === 0 || isFork) && userText) {
      updateChatTitle(chatId, userText.slice(0, 30) + (userText.length > 30 ? '...' : ''));
      queryClient.invalidateQueries({ queryKey: ['sessions', username] });
    }

    // Optimistic AI Msg
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      chatId: chatId,
      role: 'model',
      text: '',
      timestamp: Date.now()
    };

    const updatedHistory = [...currentMsgs, userMsg];
    queryClient.setQueryData(['messages', chatId], [...updatedHistory, aiMsg]);

    // Handle Deep Research
    if (config.isDeepResearch) {
      const finalText = await handleDeepResearch(userText, chatId, currentMsgs, signal || new AbortController().signal);
      const finalMsg = { ...aiMsg, text: finalText };
      saveMessage(finalMsg);
      return finalMsg;
    }

    // Standard Logic
    if (isCompare) {
      let fullTextA = '';
      let fullTextB = '';

      const streamA = streamResponse(config, updatedHistory, userText, (chunk) => {
        fullTextA += chunk;
        queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => {
          if (!old) return [];
          return old.map(m => m.id === aiMsgId ? { ...m, text: fullTextA, comparisonText: fullTextB } : m);
        });
      }, signal);

      const streamB = streamResponse(config, updatedHistory, userText, (chunk) => {
        fullTextB += chunk;
        queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => {
          if (!old) return [];
          return old.map(m => m.id === aiMsgId ? { ...m, text: fullTextA, comparisonText: fullTextB } : m);
        });
      }, signal);

      await Promise.all([streamA, streamB]);
      const finalMsg = { ...aiMsg, text: fullTextA, comparisonText: fullTextB };
      saveMessage(finalMsg);
      return finalMsg;
    } else {
      let fullText = '';
      await streamResponse(config, updatedHistory, userText, (chunk) => {
        fullText += chunk;
        queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => {
          if (!old) return [];
          return old.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m);
        });
      }, signal);
      const finalMsg = { ...aiMsg, text: fullText };
      saveMessage(finalMsg);
      return finalMsg;
    }
  };

  const chatMutation = useMutation({
    mutationFn: mutateChat,
    onError: (error: any, variables) => {
      if (error.name === 'AbortError' || error.message.includes('aborted')) return;
      const { chatId } = variables;
      const errorMsg = `ERROR: ${error.message || 'CONNECTION TERMINATED.'}`;
      queryClient.setQueryData(['messages', chatId], (old: Message[] | undefined) => {
        if (!old) return [];
        const lastMsg = old[old.length - 1];
        if (lastMsg.role === 'model') {
          saveMessage({ ...lastMsg, text: errorMsg });
          return old.map(m => m.id === lastMsg.id ? { ...m, text: errorMsg } : m);
        }
        return old;
      });
    }
  });

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleSend = async (e?: React.FormEvent, overrideText?: string, isCompare?: boolean, attachments?: Attachment[]) => {
    e?.preventDefault();
    const textToSend = overrideText !== undefined ? overrideText : input;

    handleStop();

    if ((!textToSend.trim() && (!attachments || attachments.length === 0)) || chatMutation.isPending || !currentChatId) return;

    if (!overrideText) setInput('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    chatMutation.mutate({
      userText: textToSend,
      chatId: currentChatId,
      currentMsgs: messages,
      isCompare,
      attachments,
      signal: controller.signal
    });
  };

  const handleRegenerate = (isCompareMode: boolean) => {
    if (!messages.length) return;

    // Find the last user message to resend
    // Fix: findLastIndex is not supported in all environments, use manual loop
    let lastUserMsgIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsgIndex = i;
        break;
      }
    }

    if (lastUserMsgIndex === -1) return;

    const msgToResend = messages[lastUserMsgIndex];

    // Remove any messages after this user message (e.g. the model response we want to replace)
    const msgsToKeep = messages.slice(0, lastUserMsgIndex);

    // Update UI/Cache immediately to remove old response
    queryClient.setQueryData(['messages', currentChatId], msgsToKeep);

    // Trigger send again with same text/attachments, but using the NEW isCompareMode passed from UI
    // Note: We are essentially "editing" history by truncating and re-appending
    handleSend(undefined, msgToResend.text, isCompareMode, msgToResend.attachments);
  };

  const handleArchive = async (text: string) => {
    const title = await generateTitle(config, text);
    saveNote({
      id: Date.now().toString(),
      title: title,
      content: text,
      timestamp: Date.now()
    }, username);
    queryClient.invalidateQueries({ queryKey: ['notes', username] });
  };

  const handleBranch = (messageId: string, specificText?: string) => {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1 || !currentChatId) return;

    const sessions = getChatSessions(username);
    const currentSession = sessions.find(s => s.id === currentChatId);
    const oldTitle = currentSession?.title || 'Session';
    const newSession = createChatSession(username, `Fork: ${oldTitle}`);

    // Copy history up to point
    const msgsToCopy = messages.slice(0, msgIndex + 1);

    msgsToCopy.forEach((msg, idx) => {
      let textToSave = msg.text;
      if (msg.id === messageId && specificText) {
        textToSave = specificText;
      }

      saveMessage({
        ...msg,
        id: Date.now().toString() + '_' + idx,
        chatId: newSession.id,
        text: textToSave,
        comparisonText: undefined,
        timestamp: Date.now() + idx
      });
    });

    queryClient.invalidateQueries({ queryKey: ['sessions', username] });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    setCurrentChatId(newSession.id);
  };

  const handleSyllabusFork = (topicTitle: string) => {
    const newSession = createChatSession(username, `Study: ${topicTitle}`);
    setCurrentChatId(newSession.id);
    setShowSyllabus(false);

    setTimeout(() => {
      chatMutation.mutate({
        userText: `Teach me about "${topicTitle}" in detail. Start with the core concepts.`,
        chatId: newSession.id,
        currentMsgs: []
      });
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen w-[95%] md:w-[90%] mx-auto p-4 md:p-8 font-mono relative">

      {/* Vertical Status Line */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-0 h-0 mix-blend-difference">
        <div className="-rotate-90 whitespace-nowrap text-xs text-white/30 tracking-[0.3em] select-none uppercase font-bold">
          System_Ready // {username} // {config.mode}
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        config={config}
        actions={{
          toggleTheme,
          clearChat: () => handleNewSession(), // Start new session effectively clears current view
          toggleSocratic: toggleMode,
          toggleGraphon: () => setConfig(prev => ({ ...prev, useGraphon: !prev.useGraphon })),
          toggleDeepResearch: () => setConfig(prev => ({ ...prev, isDeepResearch: !prev.isDeepResearch })),
          openSettings: () => setShowSettings(true),
          openHive: () => setShowHive(true),
          openLive: () => setShowLive(true),
        }}
      />

      {/* Minimalist Status Bar (Top Left) */}
      <div className="absolute top-4 left-4 md:left-8 z-20 flex gap-4 items-center animate-in fade-in duration-700">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tighter leading-none" style={{ color: 'var(--text-primary)' }}>BetterSearch :: GOOGLE</h1>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-50">
            <span>//</span>
            <span>GOOGLE</span>
            <span>//</span>
            <span>{config.mode}</span>
          </div>
        </div>
      </div>

      {/* Minimalist Controls (Top Right) */}
      <div className="absolute top-4 right-4 md:right-8 z-20 flex gap-2 md:gap-3 items-center">

        {/* Mode Toggle */}
        <button
          onClick={toggleMode}
          className="h-8 px-3 rounded-full flex items-center gap-2 hover:bg-white/5 transition-all"
          style={{ border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
          title="Toggle Mode"
        >
          <span className="text-[10px] font-bold tracking-widest uppercase">{config.mode === MODES.SOCRATIC ? 'SOCRATIC' : 'DIRECT'}</span>
        </button>

        {/* Hive Mind */}
        <button
          onClick={() => setShowHive(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-all text-theme-secondary hover:text-theme-primary relative"
          title="Hive Mind"
        >
          <i className="fa-solid fa-users-rays"></i>
          {hiveMessages.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent-green"></span>}
        </button>


        {/* History / Knowledge */}
        <button
          onClick={() => setShowHistory(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-all text-theme-secondary hover:text-theme-primary"
          title="History"
        >
          <i className="fa-solid fa-clock-rotate-left"></i>
        </button>

        {/* Notes (Knowledge) */}
        <button
          onClick={() => setShowNotes(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-all text-theme-secondary hover:text-theme-primary"
          title="Knowledge Notes"
        >
          <i className="fa-solid fa-book-journal-whills"></i>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-all text-theme-secondary hover:text-theme-primary"
          title="Toggle Theme"
        >
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        {/* Command Palette */}
        <button
          onClick={() => setShowCommandPalette(true)}
          className="h-8 px-2 flex items-center gap-1.5 rounded-full hover:bg-white/5 transition-all text-theme-secondary hover:text-theme-primary"
          title="Command Palette (⌘K)"
        >
          <i className="fa-solid fa-terminal text-xs"></i>
          <span className="text-[10px] font-bold tracking-wider">⌘K</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-all text-theme-secondary hover:text-theme-primary"
          title="Settings"
        >
          <i className="fa-solid fa-cog"></i>
        </button>


      </div>

      {/* Modals */}
      {/* Lazy-loaded Modals with Suspense */}
      <Suspense fallback={<ModalLoader />}>
        {showSettings && (
          <SettingsModal
            config={config}
            setConfig={setConfig}
            onClose={() => setShowSettings(false)}
          />
        )}

        {showHistory && (
          <HistoryModal
            username={username}
            onClose={() => setShowHistory(false)}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewSession}
          />
        )}

        {showNotes && (
          <NotesModal
            username={username}
            onClose={() => setShowNotes(false)}
            onSvgClick={setModalSvg}
            config={config}
          />
        )}

        {showSyllabus && (
          <SyllabusModal
            username={username}
            onClose={() => setShowSyllabus(false)}
            config={config}
            onSvgClick={setModalSvg}
            onFork={handleSyllabusFork}
          />
        )}

        {showHive && (
          <HiveModal
            username={username}
            onClose={() => setShowHive(false)}
            onSvgClick={setModalSvg}
          />
        )}

        {showLive && (
          <LiveInterface
            config={config}
            onClose={() => setShowLive(false)}
            username={username}
          />
        )}

        {modalSvg && (
          <SvgModal
            content={modalSvg}
            onClose={() => setModalSvg(null)}
          />
        )}
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto mb-16 pr-2 no-scrollbar">
        <MessageList
          messages={messages}
          isLoading={chatMutation.isPending}
          onSvgClick={setModalSvg}
          onArchive={handleArchive}
          onBranch={handleBranch}
          config={config}
        />
      </div>

      {/* Input Area */}
      <InputArea
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        isLoading={chatMutation.isPending}
        mode={config.mode}
        onStop={handleStop}
        onRegenerate={handleRegenerate}
        hasHistory={messages.length > 0}
      />
    </div>
  );
};

export default ChatInterface;