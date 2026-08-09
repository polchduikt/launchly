import React from 'react';
import { PublicHeader } from './PublicHeader';

export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-[#F2EBDD] text-[#0A0A0A] font-['Geist',sans-serif] antialiased min-h-screen w-full relative overflow-y-auto selection:bg-[#0A0A0A] selection:text-[#F2EBDD]">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none bg-[radial-gradient(#0A0A0A_1px,transparent_1px)] [background-size:18px_18px]" />
      
      <PublicHeader simple />

      <main className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

