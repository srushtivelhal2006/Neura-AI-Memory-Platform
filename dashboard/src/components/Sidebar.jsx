import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Brain, Search, Key, LogOut, Sparkles } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/memories', label: 'Memories', icon: Brain },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/api-keys', label: 'API Keys', icon: Key },
];

export default function Sidebar({ onLogout }) {
  const location = useLocation();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>
          <Sparkles size={22} color="#6366f1" />
        </div>
        <div>
          <h1 style={styles.logoText}>Pragma</h1>
          <span style={styles.logoSub}>Memory API</span>
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
              <Icon size={18} style={{ opacity: isActive ? 1 : 0.5 }} />
              <span>{item.label}</span>
              {isActive && <div style={styles.activeIndicator} />}
            </NavLink>
          );
        })}
      </nav>

      <div style={styles.footer}>
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
    color: 'var(--text-tertiary)',
    fontWeight: 500,
  },
  nav: {
    flex: 1,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    position: 'relative',
    cursor: 'pointer',
  },
  navItemActive: {
    color: 'var(--text-primary)',
    background: 'var(--accent-subtle)',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 3,
    height: 20,
    background: 'var(--accent)',
    borderRadius: 'var(--radius-full)',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid var(--border)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-tertiary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
