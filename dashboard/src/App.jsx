import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Memories from './pages/Memories';
import Search from './pages/Search';
import ApiKeys from './pages/ApiKeys';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('pragma_api_key'));

  const handleLogin = (key) => {
    localStorage.setItem('pragma_api_key', key);
    setApiKey(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('pragma_api_key');
    setApiKey(null);
  };

  if (!apiKey) {
    return (
      <BrowserRouter>
        <Login onLogin={handleLogin} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/search" element={<Search />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
