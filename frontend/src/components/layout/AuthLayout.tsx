import React from 'react';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-surface-container-low text-on-surface font-sans min-h-screen w-full flex items-center justify-center relative p-4 md:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-pattern opacity-60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-low/50 pointer-events-none"></div>
      {children}
    </div>
  );
};
