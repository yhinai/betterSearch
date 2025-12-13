
import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import LoginScreen from './components/LoginScreen';
import { ThemeProvider } from './components/ThemeProvider';
import { ensureUserExists } from './services/dbService';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(() => {
    return localStorage.getItem('bettersearch_user');
  });

  const handleLogin = (username: string) => {
    ensureUserExists(username);
    localStorage.setItem('bettersearch_user', username);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('bettersearch_user');
    setUser(null);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen w-full bg-theme-primary text-theme-primary font-mono overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {user ? (
          <ChatInterface username={user} onLogout={handleLogout} />
        ) : (
          <LoginScreen onLogin={handleLogin} />
        )}
      </div>
    </ThemeProvider>
  );
};

export default App;
