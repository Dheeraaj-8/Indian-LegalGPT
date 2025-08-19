import React, { useEffect, useState } from 'react';

function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      style={{
        border: '1px solid var(--button-border)',
        background: 'var(--button-bg)',
        color: 'var(--button-fg)',
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 600,
        marginLeft: '0.5rem'
      }}
      title="Toggle dark mode"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}

export default ThemeToggle;
