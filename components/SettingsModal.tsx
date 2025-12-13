import React from 'react';
import { AppConfig } from '../types';
import { PROVIDERS, MODELS } from '../constants';

interface SettingsModalProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, setConfig, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 animate-fade-in modal-overlay"
    >
      <div
        className="w-full max-w-md p-8 rounded relative animate-slide-in-right"
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

        <div className="space-y-4">
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

