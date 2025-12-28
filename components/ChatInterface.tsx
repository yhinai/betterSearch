import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient(); // Keep for mutation logic if needed, or remove if unused 
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
    // Async check in effect
    getChatSessions(username).then(sessions => {
      if (sessions.length > 0) {
        setCurrentChatId(sessions[0].id);
      } else {
        handleNewSession();
      }
    });
  }, [username]);

  const hiveMessages = useLiveQuery(() => getHiveTransmissions(username), [username]) || [];

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

  const handleNewSession = async () => {
    handleStop(); // Stop any pending generation
    const newSession = await createChatSession(username);
    setCurrentChatId(newSession.id);
    // queryClient.invalidateQueries({ queryKey: ['sessions', username] }); -> Not needed with LiveQuery
    // queryClient.setQueryData(['messages', newSession.id], []); -> Not needed
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

  // Manual trigger for Dexie updates if observability fails
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // React Live Query for Messages
  const messages = useLiveQuery(
    () => currentChatId ? getMessagesByChatId(currentChatId) : [],
    [currentChatId, updateTrigger]
  ) || [];

  // Local state for the message currently being streamed (ephemeral)
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);

  // Local state for optimistic user message display
  const [pendingUserMessage, setPendingUserMessage] = useState<Message | null>(null);

  // Clear pending message once it appears in the live query results
  useEffect(() => {
    if (pendingUserMessage && messages.some(m => m.id === pendingUserMessage.id)) {
      setPendingUserMessage(null);
    }
  }, [messages, pendingUserMessage]);

  // Combined messages for display
  const displayMessages = React.useMemo(() => {
    let combined = [...messages];

    // Add pending user message if not already in list
    if (pendingUserMessage && !combined.some(m => m.id === pendingUserMessage.id)) {
      combined.push(pendingUserMessage);
    }

    // Add streaming AI message if not already in list
    if (streamingMessage && !combined.some(m => m.id === streamingMessage.id)) {
      combined.push(streamingMessage);
    }

    return combined;
  }, [messages, streamingMessage, pendingUserMessage]);

  // --- DEEP RESEARCH LOGIC ---

  const handleDeepResearch = async (prompt: string, chatId: string, currentMsgs: Message[], signal: AbortSignal) => {
    const aiMsgId = (Date.now() + 1).toString();

    // Initial placeholder
    setStreamingMessage({
      id: aiMsgId,
      chatId,
      role: 'model',
      text: "🧠 *Deep Research Agent Initialized...*\n\n",
      timestamp: Date.now()
    });

    let fullText = "🧠 *Deep Research Agent Initialized...*\n\n";

    const updateMsg = (text: string) => {
      fullText = text;
      setStreamingMessage({
        id: aiMsgId,
        chatId,
        role: 'model',
        text: fullText,
        timestamp: Date.now()
      });
    };

    try {
      // 1. Plan
      updateMsg(fullText + "📋 *Generating Research Plan...*\n");

      const plan = await planResearch(config, prompt);
      const goalText = `\n**Plan Goal:** ${plan.goal}\n`;
      updateMsg(fullText + goalText);

      const contextForFinal: string[] = [];

      // 2. Execute Steps
      for (const step of plan.steps) {
        if (signal?.aborted) throw new Error("Aborted");
        const stepStart = `\n> **Step ${step.id}:** ${step.thought} (${step.action})...\n`;
        updateMsg(fullText + stepStart);

        const result = await executeStep(step);
        contextForFinal.push(`Step ${step.id} Result: ${result}`);

        // Show snippet
        const snippet = result.length > 200 ? result.substring(0, 200) + "..." : result;
        const stepEnd = `  *Result:* ${snippet}\n`;
        updateMsg(fullText + stepEnd);
      }

      // 3. Final Synthesis
      updateMsg(fullText + "\n✨ *Synthesizing Final Answer...*\n\n");

      const finalPrompt = `
        Research Context:
        ${contextForFinal.join('\n\n')}

        User Question: ${prompt}

        Synthesize a comprehensive answer based on the research above.
      `;

      await streamResponse(config, [], finalPrompt, (chunk) => {
        updateMsg(fullText + chunk);
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

    // Optimistically show user message immediately
    setPendingUserMessage(userMsg);

    await saveMessage(userMsg);
    setUpdateTrigger(prev => prev + 1);

    // Update Title logic
    const sessions = await getChatSessions(username);
    const currentSession = sessions.find(s => s.id === chatId);
    const isFork = currentSession?.title.startsWith('Fork:');

    if ((currentMsgs.length === 0 || isFork) && userText) {
      await updateChatTitle(chatId, userText.slice(0, 30) + (userText.length > 30 ? '...' : ''));
    }

    // Optimistic AI Msg Setup
    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: Message = {
      id: aiMsgId,
      chatId: chatId,
      role: 'model',
      text: '',
      timestamp: Date.now()
    };

    setStreamingMessage(aiMsg);

    const updatedHistory = [...currentMsgs, userMsg];

    // Handle Deep Research
    if (config.isDeepResearch) {
      const finalText = await handleDeepResearch(userText, chatId, currentMsgs, signal || new AbortController().signal);
      const finalMsg = { ...aiMsg, text: finalText };
      await saveMessage(finalMsg);
      setUpdateTrigger(prev => prev + 1);
      setStreamingMessage(null);
      return finalMsg;
    }

    // Standard Logic
    if (isCompare) {
      let fullTextA = '';
      let fullTextB = '';

      const streamA = streamResponse(config, updatedHistory, userText, (chunk) => {
        fullTextA += chunk;
        setStreamingMessage(prev => prev ? { ...prev, text: fullTextA, comparisonText: fullTextB } : null);
      }, signal);

      const streamB = streamResponse(config, updatedHistory, userText, (chunk) => {
        fullTextB += chunk;
        setStreamingMessage(prev => prev ? { ...prev, text: fullTextA, comparisonText: fullTextB } : null);
      }, signal);

      await Promise.all([streamA, streamB]);
      const finalMsg = { ...aiMsg, text: fullTextA, comparisonText: fullTextB };
      await saveMessage(finalMsg);
      setUpdateTrigger(prev => prev + 1);
      setStreamingMessage(null);
      return finalMsg;
    } else {
      let fullText = '';
      await streamResponse(config, updatedHistory, userText, (chunk) => {
        fullText += chunk;
        setStreamingMessage(prev => prev ? { ...prev, text: fullText } : null);
      }, signal);
      const finalMsg = { ...aiMsg, text: fullText };
      await saveMessage(finalMsg);
      setUpdateTrigger(prev => prev + 1);
      setStreamingMessage(null);
      return finalMsg;
    }
  };

  const chatMutation = useMutation({
    mutationFn: mutateChat,
    onError: (error: any, variables) => {
      if (error.name === 'AbortError' || error.message.includes('aborted')) return;
      // const { chatId } = variables; -> Not needed
      const errorMsg = `ERROR: ${error.message || 'CONNECTION TERMINATED.'}`;
      // Logic: Update streaming message to show error, then save it?
      setStreamingMessage(prev => prev ? { ...prev, text: errorMsg } : null);
      // We should probably save it too so it persists
      // But we don't have the message ID easily here unless we keep it in state or pass it.
      // Simplify: Just let it be ephemeral or alert.
      // For now, let's just save a new error message?
      // Or just set streaming message text.
    }
  });

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Process Timer
  const [processTime, setProcessTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (chatMutation.isPending) {
      setProcessTime(0);
      const startTime = Date.now();
      interval = setInterval(() => {
        setProcessTime((Date.now() - startTime) / 1000);
      }, 100);
    } else {
      setProcessTime(0);
    }
    return () => clearInterval(interval);
  }, [chatMutation.isPending]);

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

  const handleBranch = async (messageId: string, specificText?: string) => {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1 || !currentChatId) return;

    const sessions = await getChatSessions(username);
    const currentSession = sessions.find(s => s.id === currentChatId);
    const oldTitle = currentSession?.title || 'Session';
    const newSession = await createChatSession(username, `Fork: ${oldTitle}`);

    // Copy history up to point
    const msgsToCopy = messages.slice(0, msgIndex + 1);

    for (let idx = 0; idx < msgsToCopy.length; idx++) {
      const msg = msgsToCopy[idx];
      let textToSave = msg.text;
      if (msg.id === messageId && specificText) {
        textToSave = specificText;
      }

      await saveMessage({
        ...msg,
        id: Date.now().toString() + '_' + idx,
        chatId: newSession.id,
        text: textToSave,
        comparisonText: undefined,
        timestamp: Date.now() + idx
      });
    }

    setCurrentChatId(newSession.id);
  };

  const handleSyllabusFork = async (topicTitle: string) => {
    const newSession = await createChatSession(username, `Study: ${topicTitle}`);
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

        {/* Deep Research Toggle */}
        <button
          onClick={() => setConfig(prev => ({ ...prev, isDeepResearch: !prev.isDeepResearch }))}
          className={`h-8 px-3 rounded-full flex items-center gap-2 hover:opacity-80 transition-all ${config.isDeepResearch ? 'ring-1 ring-green-500/50' : ''}`}
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: config.isDeepResearch ? 'rgb(74, 222, 128)' : 'var(--border-primary)',
            color: config.isDeepResearch ? 'rgb(74, 222, 128)' : 'var(--text-secondary)'
          }}
          title="Toggle Deep Research"
        >
          <i className="fa-solid fa-microscope text-xs"></i>
          <span className="text-[10px] font-bold tracking-widest uppercase">DEEP</span>
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
          messages={displayMessages}
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
        processTime={processTime}
        mode={config.mode}
        onStop={handleStop}
        onRegenerate={handleRegenerate}
        hasHistory={messages.length > 0}
      />
    </div>
  );
};

export default ChatInterface;