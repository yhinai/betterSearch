
import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div
      className="min-h-screen w-full font-mono flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Background Decor */}
      <div className="absolute inset-0 grid-bg"></div>

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[100px] rounded-full pointer-events-none"
        style={{ backgroundColor: 'var(--bg-hover)' }}
      ></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in">
        <div className="mb-12 text-center">
          <div
            className="inline-block px-4 py-1 mb-6"
            style={{ border: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}
          >
            <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'var(--text-tertiary)' }}>System_Access_Port</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-[0.2em] mb-2">HIVE_MIND</h1>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Collaborative Cognitive Architecture</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest block pl-1" style={{ color: 'var(--text-tertiary)' }}>Identify User</label>
            <div className="relative group">
              <div
                className="absolute -inset-0.5 rounded-sm opacity-30 group-hover:opacity-100 transition duration-500 blur-sm"
                style={{ background: 'linear-gradient(to right, var(--accent-cyan), var(--text-tertiary))' }}
              ></div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="relative w-full p-4 text-center text-lg tracking-wider outline-none rounded-sm uppercase"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                placeholder="USERNAME"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full font-bold uppercase tracking-[0.2em] py-4 transition-all disabled:opacity-50 relative overflow-hidden group"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)'
            }}
          >
            <span className="relative z-10 group-hover:tracking-[0.4em] transition-all duration-300">Initialize Connection</span>
          </button>
        </form>

        <div className="mt-12 flex justify-between text-[9px] uppercase tracking-widest select-none" style={{ color: 'var(--text-disabled)' }}>
          <span>Secure_Protocol: Active</span>
          <span>Ver: 3.1.0</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

