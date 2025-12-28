import React, { useEffect, useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { AppConfig } from '../types';
import { getSignedUrl } from '../services/elevenService';
import { SOCRATIC_SYSTEM_INSTRUCTION } from '../constants';

// Voice command handlers interface - matches ChatInterface actions
export interface VoiceCommandHandlers {
  onNewSession?: () => void;
  onToggleMode?: () => void;
  onToggleTheme?: () => void;
  onToggleDeepResearch?: () => void;
  onShowHistory?: () => void;
  onShowNotes?: () => void;
  onShowSettings?: () => void;
  onShowSyllabus?: () => void;
  onShowHive?: () => void;
  onStop?: () => void;
  onSendMessage?: (message: string) => void;
  onTriggerVisual?: (concept: string) => void;
  onLogout?: () => void;
}

interface LiveInterfaceProps {
  config: AppConfig;
  onClose: () => void;
  username: string;
  handlers: VoiceCommandHandlers;
  currentMode?: 'direct' | 'socratic';
  isDeepResearch?: boolean;
}

type ConnectionStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

const LiveInterface: React.FC<LiveInterfaceProps> = ({
  config,
  onClose,
  username,
  handlers,
  currentMode,
  isDeepResearch
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastCommand, setLastCommand] = useState<string>('');

  // ElevenLabs Conversation Hook with Comprehensive Client Tools
  const conversation = useConversation({
    clientTools: {
      // === NAVIGATION COMMANDS ===

      startNewChat: async () => {
        console.log("[Voice] Starting new chat...");
        setLastCommand("Starting new chat");
        handlers.onNewSession?.();
        return "New chat session started. You're now in a fresh conversation.";
      },

      openHistory: async () => {
        console.log("[Voice] Opening history...");
        setLastCommand("Opening history");
        handlers.onShowHistory?.();
        return "Chat history is now open. You can see all your previous conversations.";
      },

      openNotes: async () => {
        console.log("[Voice] Opening notes...");
        setLastCommand("Opening notes");
        handlers.onShowNotes?.();
        return "Notes archive is now open. You can view or listen to your saved notes.";
      },

      openSettings: async () => {
        console.log("[Voice] Opening settings...");
        setLastCommand("Opening settings");
        handlers.onShowSettings?.();
        return "Settings panel is open. You can configure the app.";
      },

      openSyllabus: async () => {
        console.log("[Voice] Opening syllabus...");
        setLastCommand("Opening syllabus");
        handlers.onShowSyllabus?.();
        return "Syllabus generated and displayed.";
      },

      openHive: async () => {
        console.log("[Voice] Opening hive...");
        setLastCommand("Opening Hive");
        handlers.onShowHive?.();
        return "Hive transmissions opened. You can see messages from other users.";
      },

      // === MODE COMMANDS ===

      toggleMode: async () => {
        console.log("[Voice] Toggling mode...");
        setLastCommand("Toggling mode");
        handlers.onToggleMode?.();
        const newMode = currentMode === 'direct' ? 'socratic' : 'direct';
        return `Switched to ${newMode} mode. ${newMode === 'socratic' ? "I'll now ask guiding questions instead of direct answers." : "I'll now provide direct answers."}`;
      },

      setSocraticMode: async () => {
        console.log("[Voice] Setting Socratic mode...");
        if (currentMode !== 'socratic') {
          handlers.onToggleMode?.();
        }
        setLastCommand("Socratic Mode Enabled");
        return "Socratic mode enabled. I'll guide you with questions to help you discover answers yourself.";
      },

      setDirectMode: async () => {
        console.log("[Voice] Setting Direct mode...");
        if (currentMode !== 'direct') {
          handlers.onToggleMode?.();
        }
        setLastCommand("Direct Mode Enabled");
        return "Direct mode enabled. I'll provide straightforward answers to your questions.";
      },

      toggleDeepResearch: async () => {
        console.log("[Voice] Toggling deep research...");
        setLastCommand("Toggling Deep Research");
        handlers.onToggleDeepResearch?.();
        return isDeepResearch
          ? "Deep research mode disabled. Switching to normal responses."
          : "Deep research mode enabled. I'll now conduct multi-step research for complex questions.";
      },

      enableDeepResearch: async () => {
        console.log("[Voice] Enabling deep research...");
        setLastCommand("Deep Research Enabled");
        if (!isDeepResearch) {
          handlers.onToggleDeepResearch?.();
        }
        return "Deep research mode is now active. Ask me complex questions and I'll research thoroughly.";
      },

      disableDeepResearch: async () => {
        console.log("[Voice] Disabling deep research...");
        setLastCommand("Deep Research Disabled");
        if (isDeepResearch) {
          handlers.onToggleDeepResearch?.();
        }
        return "Deep research mode disabled. Responses will be faster and more direct.";
      },

      // === UI COMMANDS ===

      toggleTheme: async () => {
        console.log("[Voice] Toggling theme...");
        setLastCommand("Toggling theme");
        handlers.onToggleTheme?.();
        return "Theme switched. The interface colors have been updated.";
      },

      setDarkMode: async () => {
        console.log("[Voice] Setting dark mode...");
        setLastCommand("Dark Mode");
        // Will need to check current theme and only toggle if needed
        handlers.onToggleTheme?.();
        return "Dark mode activated.";
      },

      setLightMode: async () => {
        console.log("[Voice] Setting light mode...");
        setLastCommand("Light Mode");
        handlers.onToggleTheme?.();
        return "Light mode activated.";
      },

      // === CONTROL COMMANDS ===

      stopGeneration: async () => {
        console.log("[Voice] Stopping generation...");
        setLastCommand("Stopping...");
        handlers.onStop?.();
        return "Generation stopped.";
      },

      closeVoiceInterface: async () => {
        console.log("[Voice] Closing voice interface...");
        setLastCommand("Closing...");
        setTimeout(() => onClose(), 500);
        return "Closing voice interface. Goodbye!";
      },

      logout: async () => {
        console.log("[Voice] Logging out...");
        setLastCommand("Logging out...");
        handlers.onLogout?.();
        return "Logging you out. Goodbye!";
      },

      // === CONTENT COMMANDS ===

      sendMessage: async ({ message }: { message: string }) => {
        console.log("[Voice] Sending message:", message);
        setLastCommand(`Sending: ${message.substring(0, 20)}...`);
        handlers.onSendMessage?.(message);
        return "Message sent. I'll process that in the main chat.";
      },

      askQuestion: async ({ question }: { question: string }) => {
        console.log("[Voice] Asking question:", question);
        setLastCommand(`Asking: ${question.substring(0, 20)}...`);
        handlers.onSendMessage?.(question);
        return "Question submitted. Check the main chat for the response.";
      },

      // === VISUALIZATION COMMANDS ===

      triggerVisualization: async ({ concept, description }: { concept: string; description?: string }) => {
        console.log("[Voice] Triggering visualization:", concept);
        setLastCommand(`Visualizing: ${concept}`);
        handlers.onTriggerVisual?.(concept);
        return "Visualization diagram generated and displayed.";
      },

      generateDiagram: async ({ topic }: { topic: string }) => {
        console.log("[Voice] Generating diagram for:", topic);
        setLastCommand(`Diagram: ${topic}`);
        handlers.onTriggerVisual?.(topic);
        return "Diagram generated for " + topic;
      },

      // === INFO COMMANDS ===

      getStatus: async () => {
        return `Current mode: ${currentMode}. Deep research: ${isDeepResearch ? 'enabled' : 'disabled'}. Voice link: active.`;
      },

      listCommands: async () => {
        return `You can say: "start new chat", "open history", "open notes", "open settings", "switch to socratic mode", "enable deep research", "toggle theme", "send message", "generate diagram", "stop", or "close voice".`;
      },
    },

    onConnect: () => {
      console.log("[ElevenLabs] Neural Link Active");
      setStatus('connected');
      setErrorMessage('');
    },
    onDisconnect: () => {
      console.log("[ElevenLabs] Link Terminated");
      setStatus('disconnected');
    },
    onError: (error) => {
      console.error("[ElevenLabs] Error:", error);
      setStatus('error');
      setErrorMessage(error?.message || 'Connection failed');
    },
    onMessage: (message) => {
      console.log("[ElevenLabs] Message:", message);
    }
  });

  // Start the voice session
  const startSession = useCallback(async () => {
    // Use config values or fall back to environment variables
    const apiKey = config.elevenLabsApiKey || import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    const agentId = config.elevenLabsAgentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID || '';

    if (!apiKey || !agentId) {
      setStatus('error');
      setErrorMessage('ElevenLabs API Key and Agent ID required. Configure in Settings.');
      return;
    }

    setStatus('connecting');
    setErrorMessage('');

    try {
      const signedUrl = await getSignedUrl(agentId, apiKey);
      await conversation.startSession({ signedUrl });
    } catch (error: any) {
      console.error("[ElevenLabs] Failed to start session:", error);
      setStatus('error');
      setErrorMessage(error?.message || 'Failed to connect');
    }
  }, [config.elevenLabsApiKey, config.elevenLabsAgentId, conversation]);

  const stopSession = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.warn("[ElevenLabs] Error ending session:", error);
    }
    setStatus('disconnected');
  }, [conversation]);

  useEffect(() => {
    startSession();
    return () => { stopSession(); };
  }, []);

  const handleReconnect = useCallback(() => {
    stopSession();
    setTimeout(() => startSession(), 500);
  }, [startSession, stopSession]);

  const isSpeaking = conversation.isSpeaking;
  const isActive = status === 'connected';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 animate-in slide-in-from-top-4 duration-500 pointer-events-none">

      {/* Dynamic Status Island */}
      <div className="pointer-events-auto bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 shadow-2xl flex items-center gap-4 transition-all duration-300 hover:scale-105 hover:bg-black/90 group">

        {/* Status Indicator */}
        <div className="relative w-3 h-3">
          <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${isActive ? (isSpeaking ? 'bg-purple-500' : 'bg-cyan-500') :
              status === 'connecting' ? 'bg-amber-500' : 'bg-red-500'
            }`}></div>
          <div className={`relative w-3 h-3 rounded-full ${isActive ? (isSpeaking ? 'bg-purple-400' : 'bg-cyan-400') :
              status === 'connecting' ? 'bg-amber-400' : 'bg-red-500'
            }`}></div>
        </div>

        {/* Status Text */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
            {status === 'connecting' ? 'Connecting...' :
              status === 'connected' ? (isSpeaking ? 'Speaking' : 'Listening') :
                status === 'error' ? 'Error' : 'Disconnected'}
          </span>
          {lastCommand && (
            <span className="text-[8px] text-cyan-400/80 max-w-[120px] truncate animate-pulse">
              {lastCommand}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
          title="End Voice Session"
        >
          <i className="fa-solid fa-phone-slash text-xs"></i>
        </button>
      </div>

      {/* Error Toast */}
      {errorMessage && (
        <div className="pointer-events-auto px-4 py-2 bg-red-950/90 border border-red-500/30 rounded-lg text-red-200 text-xs backdrop-blur shadow-xl animate-in fade-in slide-in-from-top-2">
          {errorMessage}
        </div>
      )}

      {/* Connection Re-try */}
      {(status === 'error' || status === 'disconnected') && (
        <button
          onClick={handleReconnect}
          className="pointer-events-auto px-4 py-1.5 bg-cyan-950/80 border border-cyan-500/30 rounded-full text-cyan-400 text-[10px] uppercase font-bold hover:bg-cyan-900 transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-rotate-right"></i> Reconnect
        </button>
      )}

    </div>
  );
};

export default LiveInterface;