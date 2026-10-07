import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ onSearch, placeholder = 'Search memories...', delay = 300 }) {
  const [value, setValue] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setValue(val);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (onSearch) onSearch(val);
    }, delay);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (onSearch) onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <Search size={18} style={styles.icon} />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="input"
        style={styles.input}
      />
    </form>
  );
}

const styles = {
  form: {
    position: 'relative',
    width: '100%',
  },
  icon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-tertiary)',
    pointerEvents: 'none',
  },
  input: {
    paddingLeft: '42px',
  },
};
