import Sidebar from './Sidebar';

export default function Layout({ children, onLogout }) {
  return (
    <div style={styles.container}>
      <Sidebar onLogout={onLogout} />
      <main style={styles.main}>
        <div style={styles.content} className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    marginLeft: 'var(--sidebar-width)',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
  },
  content: {
    padding: 'var(--space-xl)',
    maxWidth: '1400px',
  },
};
