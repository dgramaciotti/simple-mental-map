export interface Theme {
  id: string;
  name: string;
  variables: Record<string, string>;
  className?: string; 
  branchColors: string[]; // Custom array for Markmap colors
}

export const THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'Classic Dark',
    branchColors: ['#4f8ff7', '#8b5cf6', '#ec4899', '#f97316', '#10b981'],
    variables: {
      '--bg': '#1a1a1a',
      '--surface': '#242424',
      '--border': '#333',
      '--text': '#e0e0e0',
      '--text-muted': '#888',
      '--accent': '#4f8ff7',
      '--danger': '#e5484d',
      '--radius': '6px',
      '--font': "'Inter', sans-serif",
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    className: 'theme-cyberpunk',
    branchColors: ['#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000'],
    variables: {
      '--bg': '#050505',
      '--surface': '#000000',
      '--border': '#111',
      '--text': '#f0f0f0',
      '--text-muted': '#444',
      '--accent': '#00ff00',
      '--danger': '#ff00ff',
      '--radius': '0px',
      '--font': "'JetBrains Mono', monospace",
    }
  },
  {
    id: 'clean',
    name: 'Clean',
    branchColors: ['#3182ce', '#38a169', '#e53e3e', '#d69e2e', '#805ad5'],
    variables: {
      '--bg': '#f5f7fa',
      '--surface': '#ffffff',
      '--border': '#e2e8f0',
      '--text': '#1a202c',
      '--text-muted': '#a0aec0',
      '--accent': '#3182ce', 
      '--danger': '#e53e3e',
      '--radius': '4px',
      '--font': "'Roboto', sans-serif",
    }
  },
  {
    id: 'forest',
    name: 'Forest Calm',
    className: 'theme-forest',
    branchColors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    variables: {
      '--bg': '#1b261e',
      '--surface': '#243027',
      '--border': '#3d5a45',
      '--text': '#ecfdf5',
      '--text-muted': '#a7f3d0',
      '--accent': '#86efac',
      '--danger': '#f87171',
      '--radius': '12px',
      '--font': "'EB Garamond', serif",
    }
  }
];

export function applyTheme(themeId: string) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;

  // Apply CSS Variables
  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Apply Theme Class
  THEMES.forEach(t => {
    if (t.className) root.classList.remove(t.className);
  });
  if (theme.className) {
    root.classList.add(theme.className);
  }

  // Handle dark/light meta
  if (themeId === 'clean') {
    root.style.setProperty('color-scheme', 'light');
  } else {
    root.style.setProperty('color-scheme', 'dark');
  }
  
  return theme;
}
