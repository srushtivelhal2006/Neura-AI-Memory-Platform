import { NavLink, useLocation } from 'react-router-dom';
import { 
  MessageSquare, LayoutDashboard, Brain, Search, Cpu, Blocks, 
  Key, LogOut, Sparkles, Sun, Moon 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { path: '/chat', label: 'Memory Chat', icon: MessageSquare, badge: 'New' },
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/memories', label: 'Memory Library', icon: Brain },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/providers', label: 'AI Providers', icon: Cpu },
  { path: '/integrations', label: 'Integrations', icon: Blocks },
  { path: '/api-keys', label: 'API Keys', icon: Key },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <Sparkles size={22} color="#6366f1" />
        </div>
        <div>
          <h1 style={styles.logoText}>Neura</h1>
          <span style={styles.logoSub}>AI Memory Platform</span>
        </div>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              }}
            >
              <Icon size={18} style={{ opacity: isActive ? 1 : 0.6 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={styles.badge}>{item.badge}</span>
              )}
              {isActive && <div style={styles.activeIndicator} />}
            </NavLink>
          );
        })}
      </nav>

      <div style={styles.footer}>
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme} 
          style={styles.themeToggleBtn}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
        >
          {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#6366f1" />}
          <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        <button onClick={onLogout} style={styles.logoutBtn}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '24px 20px',
    borderBottom: '1px solid var(--border)',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-md)',
    background: 'var(--accent-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 'var(--text-lg)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 'var(--text-xs)',
    color: 'var(--accent)',
    fontWeight: 600,
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    transition: 'all 0.15s ease',
    position: 'relative',
  },
  navItemActive: {
    color: 'var(--text-primary)',
    background: 'var(--accent-subtle)',
    fontWeight: 600,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    borderRadius: '0 3px 3px 0',
    background: 'var(--accent)',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--accent)',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  footer: {
    padding: '16px 14px',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  themeToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'transparent',
    color: 'var(--danger)',
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
