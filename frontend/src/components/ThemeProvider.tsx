'use client';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme system removed - using fixed light theme
  return <>{children}</>;
};

export default ThemeProvider;
