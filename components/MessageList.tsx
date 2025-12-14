
import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { Message, AppConfig, GraphonSource } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { ThinkingIndicator } from './Skeleton';
import { MediaSourceList } from './MediaSource';

const ClipModal = lazy(() => import('./ClipModal'));

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSvgClick: (svgContent: string) => void;
  onArchive: (text: string) => void;
  onBranch: (messageId: string, specificText?: string) => void;
  config: AppConfig;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onSvgClick, onArchive, onBranch, config }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [clipModalData, setClipModalData] = useState<{ sources: GraphonSource[], text: string } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleArchiveClick = (id: string, text: string, variant?: string) => {
    onArchive(text);
    setArchivedIds(prev => new Set(prev).add(variant ? `${id}_${variant}` : id));
  };

  const isArchived = (id: string, variant?: string) => {
    return archivedIds.has(variant ? `${id}_${variant}` : id);
  };

  // Reusable Header Component for Actions
  const MessageHeader = ({ role, id, text, variant, sources }: { role: string, id: string, text: string, variant?: string, sources?: GraphonSource[] }) => (
    <div
      className="text-[10px] mb-1 tracking-wider uppercase flex items-center gap-2 justify-between"
      style={{ color: 'var(--text-muted)' }}
    >
      <span>{role === 'user' ? 'USER_01' : `SYSTEM_AI [${config.provider}]${variant ? ' // ' + variant : ''}`}</span>
      {role === 'model' && (
        <div className="flex gap-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          {/* CLIP button - only show if there are Graphon sources */}
          {sources && sources.length > 0 && (
            <button
              onClick={() => setClipModalData({ sources, text })}
              className="uppercase text-[9px] tracking-widest px-2 py-0.5 flex items-center gap-1 hover:opacity-80"
              style={{ border: '1px solid var(--accent-magenta)', color: 'var(--accent-magenta)' }}
              title="Compile Sources into Clip"
            >
              <i className="fa-solid fa-film"></i> CLIP
            </button>
          )}
          <button
            onClick={() => onBranch(id, text)}
            className="uppercase text-[9px] tracking-widest px-2 py-0.5 flex items-center gap-1 hover:opacity-80"
            style={{ border: '1px solid var(--border-secondary)', color: 'var(--text-muted)' }}
            title="Fork Conversation"
          >
            <i className="fa-solid fa-code-branch"></i> FORK
          </button>
          <button
            onClick={() => handleArchiveClick(id, text, variant)}
            disabled={isArchived(id, variant)}
            className="uppercase text-[9px] tracking-widest px-2 py-0.5"
            style={{
              border: `1px solid ${isArchived(id, variant) ? 'var(--accent-green)' : 'var(--border-secondary)'}`,
              color: isArchived(id, variant) ? 'var(--accent-green)' : 'var(--text-muted)'
            }}
          >
            {isArchived(id, variant) ? 'ARCHIVED' : '+ ARCHIVE'}
          </button>
        </div>
      )}
    </div>
  );

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center select-none">
        <div
          className="text-2xl md:text-4xl tracking-[0.2em] animate-pulse"
          style={{ color: 'var(--text-primary)' }}
        >
          HIVE_MIND :: {config.provider.toUpperCase()}
        </div>
        <div
          className="mt-4 text-xs tracking-widest text-center max-w-md leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          AWAITING INPUT STREAM<br />
        </div>
      </div>
    );
  }

  // Check if last message is still loading (empty AI response)
  const lastMsg = messages[messages.length - 1];
  const showThinking = isLoading && lastMsg?.role === 'model' && !lastMsg?.text;

  return (
    <div className="space-y-8 py-12">
      {messages.map((msg, index) => (
        <div
          key={msg.id}
          className={`flex flex-col animate-slide-up ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          style={{ animationDelay: `${index * 0.05}s` }}
        >

          {msg.comparisonText ? (
            // COMPARE MODE: Split View
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {/* Left Response */}
              <div
                className="relative group/msg pl-4 text-left"
                style={{ borderLeft: '2px solid var(--border-primary)' }}
              >
                <MessageHeader role={msg.role} id={msg.id} text={msg.text} variant="OPT_A" />
                <div
                  className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words w-full"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <MarkdownRenderer content={msg.text} onSvgClick={onSvgClick} />
                </div>
              </div>

              {/* Right Response */}
              <div
                className="relative group/msg pl-4 text-left"
                style={{ borderLeft: '2px solid var(--accent-cyan)' }}
              >
                <MessageHeader role={msg.role} id={msg.id} text={msg.comparisonText} variant="OPT_B" />
                <div
                  className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words w-full"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <MarkdownRenderer content={msg.comparisonText} onSvgClick={onSvgClick} />
                </div>
              </div>
            </div>
          ) : (
            // STANDARD MODE: Single View
            <div
              className={`max-w-[85%] md:max-w-[70%] relative group/msg ${msg.role === 'user' ? 'pr-4 text-right' : 'pl-4 text-left'}`}
              style={{
                borderRight: msg.role === 'user' ? '2px solid var(--text-primary)' : 'none',
                borderLeft: msg.role === 'model' ? '2px solid var(--border-primary)' : 'none'
              }}
            >
              <MessageHeader role={msg.role} id={msg.id} text={msg.text} sources={msg.graphonSources} />

              {/* Attachments Display */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className={`flex gap-2 mb-3 overflow-x-auto no-scrollbar ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="relative group/att rounded overflow-hidden flex-shrink-0"
                      style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-hover)' }}
                      title={att.name || att.mimeType}
                    >
                      {att.type === 'image' ? (
                        <img src={`data:${att.mimeType};base64,${att.data}`} className="h-16 w-16 object-cover" />
                      ) : (
                        <div
                          className="h-16 w-16 flex flex-col items-center justify-center p-1"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <i className="fa-solid fa-file-pdf text-xl mb-1"></i>
                          <span className="text-[8px] uppercase">{att.mimeType.split('/')[1] || 'FILE'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div
                className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words w-full"
                style={{ color: msg.role === 'model' ? 'var(--text-secondary)' : 'var(--text-primary)' }}
              >
                {msg.role === 'model' ? (
                  <MarkdownRenderer content={msg.text} onSvgClick={onSvgClick} />
                ) : (
                  msg.text
                )}
                {msg.role === 'model' && isLoading && msg.id === messages[messages.length - 1].id && msg.text && (
                  <span
                    className="inline-block w-2 h-4 ml-1 animate-pulse align-middle"
                    style={{ backgroundColor: 'var(--text-primary)' }}
                  />
                )}
              </div>

              {/* Inline Media Sources from Graphon */}
              {msg.role === 'model' && msg.graphonSources && msg.graphonSources.length > 0 && (
                <MediaSourceList sources={msg.graphonSources} />
              )}
            </div>
          )}

        </div>
      ))}

      {/* Show thinking indicator when AI is starting generation */}
      {showThinking && <ThinkingIndicator />}

      <div ref={messagesEndRef} />

      {/* Clip Modal */}
      {clipModalData && (
        <Suspense fallback={null}>
          <ClipModal
            sources={clipModalData.sources}
            messageText={clipModalData.text}
            onClose={() => setClipModalData(null)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default MessageList;

