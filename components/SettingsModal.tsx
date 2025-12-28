import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { PROVIDERS, MODELS } from '../constants';
import { getVoices, checkSubscription, Voice, Subscription } from '../services/elevenService';

interface SettingsModalProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, setConfig, onClose }) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingVoices, setLoadingVoices] = useState(false);

  // Load voices when ElevenLabs key is available
  useEffect(() => {
    const apiKey = config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      setLoadingVoices(true);
      Promise.all([
        getVoices(apiKey).catch(() => []),
        checkSubscription(apiKey).catch(() => null)
      ]).then(([voiceList, sub]) => {
        setVoices(voiceList);
        setSubscription(sub);
        setLoadingVoices(false);
      });
    }
  }, [config.elevenLabsApiKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 animate-fade-in modal-overlay"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 rounded relative animate-slide-in-right"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ background: 'var(--gradient-primary)' }}
        ></div>
        <h2
          className="text-xl mb-6 font-bold tracking-widest uppercase flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          <i className="fa-solid fa-network-wired text-sm"></i> Neural Configuration
        </h2>

        <div className="space-y-6">
          {/* === LLM SECTION === */}
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest font-bold border-b pb-2" style={{ color: 'var(--accent-cyan)', borderColor: 'var(--border-secondary)' }}>
              🧠 LLM Provider
            </div>

            <div>
              <label
                className="block text-xs uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-tertiary)' }}
              >Provider Node</label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value, apiKey: '', model: '' })}
                className="w-full p-2 text-sm outline-none rounded-sm"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value={PROVIDERS.GOOGLE}>GOOGLE GEMINI</option>
                <option value={PROVIDERS.OPENAI}>OPENAI</option>
                <option value={PROVIDERS.ANTHROPIC}>ANTHROPIC</option>
                <option value={PROVIDERS.OLLAMA}>OLLAMA (LOCAL)</option>
              </select>
            </div>

            {config.provider !== PROVIDERS.OLLAMA && (
              <div>
                <label
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >Security Key</label>
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder={config.provider === PROVIDERS.GOOGLE ? "Uses ENV if empty" : "sk-..."}
                  className="w-full p-2 text-sm outline-none rounded-sm"
                  style={{
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px solid var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}

            <div>
              <label
                className="block text-xs uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-tertiary)' }}
              >Model Designation</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                placeholder={
                  config.provider === PROVIDERS.GOOGLE ? MODELS.THINKING :
                    config.provider === PROVIDERS.OPENAI ? 'gpt-4o' :
                      config.provider === PROVIDERS.ANTHROPIC ? 'claude-3-5-sonnet-20240620' :
                        'llama3'
                }
                className="w-full p-2 text-sm outline-none rounded-sm"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {(config.provider === PROVIDERS.OPENAI || config.provider === PROVIDERS.OLLAMA) && (
              <div>
                <label
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >Base URL</label>
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  placeholder={config.provider === PROVIDERS.OLLAMA ? "http://localhost:11434" : "https://api.openai.com/v1"}
                  className="w-full p-2 text-sm outline-none rounded-sm"
                  style={{
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px solid var(--border-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}
          </div>

          {/* === ELEVENLABS SECTION === */}
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest font-bold border-b pb-2" style={{ color: 'var(--accent-purple)', borderColor: 'var(--border-secondary)' }}>
              🎙️ ElevenLabs Voice
            </div>

            <div>
              <label
                className="block text-xs uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-tertiary)' }}
              >ElevenLabs API Key</label>
              <input
                type="password"
                value={config.elevenLabsApiKey || ''}
                onChange={(e) => setConfig({ ...config, elevenLabsApiKey: e.target.value })}
                placeholder="sk_... (uses ENV if empty)"
                className="w-full p-2 text-sm outline-none rounded-sm"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label
                className="block text-xs uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-tertiary)' }}
              >Agent ID (for Voice Link)</label>
              <input
                type="text"
                value={config.elevenLabsAgentId || ''}
                onChange={(e) => setConfig({ ...config, elevenLabsAgentId: e.target.value })}
                placeholder="Your ElevenLabs Agent ID"
                className="w-full p-2 text-sm outline-none rounded-sm"
                style={{
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-secondary)',
                  color: 'var(--text-primary)'
                }}
              />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Create agent at elevenlabs.io/conversational-ai
              </p>
            </div>

            {/* Subscription Status */}
            {subscription && (
              <div
                className="p-3 rounded text-xs"
                style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-secondary)' }}
              >
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-tertiary)' }}>Tier:</span>
                  <span className="font-bold uppercase" style={{ color: 'var(--accent-cyan)' }}>{subscription.tier}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span style={{ color: 'var(--text-tertiary)' }}>Characters:</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {subscription.character_count.toLocaleString()} / {subscription.character_limit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-1 mt-2 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(subscription.character_count / subscription.character_limit) * 100}%`,
                      backgroundColor: 'var(--accent-cyan)'
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Voice Selection */}
            {voices.length > 0 && (
              <div>
                <label
                  className="block text-xs uppercase tracking-wider mb-2"
                  style={{ color: 'var(--text-tertiary)' }}
                >Available Voices ({voices.length})</label>
                <div
                  className="max-h-32 overflow-y-auto rounded text-xs space-y-1 p-2"
                  style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-secondary)' }}
                >
                  {voices.slice(0, 10).map(voice => (
                    <div
                      key={voice.voice_id}
                      className="flex justify-between items-center p-1 rounded hover:opacity-80 cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="font-mono">{voice.name}</span>
                      <span className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>
                        {voice.category || 'custom'}
                      </span>
                    </div>
                  ))}
                  {voices.length > 10 && (
                    <div className="text-center text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      +{voices.length - 10} more voices
                    </div>
                  )}
                </div>
              </div>
            )}

            {loadingVoices && (
              <div className="text-xs text-center py-2" style={{ color: 'var(--text-tertiary)' }}>
                <i className="fa-solid fa-spinner animate-spin mr-2"></i>
                Loading voices...
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 transition-all text-xs uppercase tracking-widest font-bold hover:opacity-80"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              border: '1px solid var(--text-primary)'
            }}
          >
            Confirm Sequence
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
