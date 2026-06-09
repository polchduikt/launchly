import React from 'react';
import { Bot } from 'lucide-react';

interface AuthPageLayoutProps {
  leftTitle?: string;
  leftDescription?: string;
  rightContent: React.ReactNode;
}

export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  leftTitle = 'Automate your business workflow with precision.',
  leftDescription = 'The all-in-one CRM and Telegram Bot builder for modern enterprises.',
  rightContent,
}) => {
  return (
    <div className="relative z-10 w-full max-w-5xl bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 flex flex-col md:flex-row overflow-hidden">
      <div className="hidden md:flex md:w-1/2 p-12 lg:p-16 flex-col justify-center bg-surface/50 border-r border-outline-variant/20 relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-on-primary shadow-sm shadow-primary/10">
            <Bot size={22} />
          </div>
          <span className="font-bold text-xl text-on-surface tracking-tight">
            Launchly
          </span>
        </div>

        <h2 className="font-semibold text-2xl lg:text-3xl text-on-surface mb-4 leading-tight">
          {leftTitle}
        </h2>
        
        <p className="text-sm lg:text-base text-on-surface-variant">
          {leftDescription}
        </p>

        <div className="mt-12 flex gap-4">
          <div className="h-1 w-12 bg-primary rounded-full"></div>
          <div className="h-1 w-4 bg-tertiary-fixed-dim rounded-full opacity-60"></div>
          <div className="h-1 w-4 bg-tertiary-fixed-dim rounded-full opacity-60"></div>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-[400px]">
          {rightContent}
        </div>
      </div>
    </div>
  );
};
