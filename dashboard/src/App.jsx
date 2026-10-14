import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Memories from './pages/Memories';
import Search from './pages/Search';
import AiProviders from './pages/AiProviders';
import Integrations from './pages/Integrations';
import ApiKeys from './pages/ApiKeys';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('neura_api_key'));

  const handleLogin = (key) => {
    localStorage.setItem('neura_api_key', key);
    setApiKey(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('neura_api_key');
    setApiKey(null);
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        {!apiKey ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Layout onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/memories" element={<Memories />} />
              <Route path="/search" element={<Search />} />
              <Route path="/providers" element={<AiProviders />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        )}
      </BrowserRouter>
    </ThemeProvider>
  );
}
