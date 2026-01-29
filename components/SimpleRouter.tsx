import React, { createContext, useContext, useState } from 'react';

const RouterContext = createContext<{
  path: string;
  navigate: (to: string) => void;
}>({ path: '/', navigate: () => {} });

export const useRouter = () => useContext(RouterContext);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Using simple state for routing to work in sandboxed environments without History API support
  const [path, setPath] = useState('/');

  const navigate = (to: string) => {
    // 1. Parse the target url
    let targetPath = to;
    let targetHash = '';

    if (to.includes('#')) {
      const parts = to.split('#');
      targetPath = parts[0];
      targetHash = parts[1];
    }
    
    // Default to root if empty path
    if (targetPath === '') targetPath = '/';

    // 2. Update State (No history pushState to avoid 404s in sandbox)
    setPath(targetPath);
    window.scrollTo(0, 0);

    // 3. Handle Scrolling for anchors
    if (targetHash) {
      setTimeout(() => {
        const el = document.getElementById(targetHash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const Link: React.FC<{ 
  to: string; 
  children: React.ReactNode; 
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ to, children, className, onClick }) => {
  const { navigate } = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) onClick(e);
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};