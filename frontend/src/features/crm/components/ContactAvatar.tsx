import React, { useState } from 'react';
import { User } from 'lucide-react';

interface ContactAvatarProps {
  photoUrl: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ContactAvatar: React.FC<ContactAvatarProps> = ({ photoUrl, name, size = 'sm' }) => {
  const [error, setError] = useState(!photoUrl);
  const initials = name ? name.substring(0, 1).toUpperCase() : '?';
  
  let sizeClasses = 'w-8 h-8 rounded-full';
  let iconSize = 16;
  if (size === 'md') {
    sizeClasses = 'w-11 h-11 rounded-full';
    iconSize = 20;
  } else if (size === 'lg') {
    sizeClasses = 'w-48 h-48 rounded-2xl';
    iconSize = 64;
  }

  if (error || !photoUrl) {
    return (
      <div className={`${sizeClasses} bg-slate-100 text-slate-400 flex items-center justify-center font-bold uppercase shadow-sm border border-slate-200 shrink-0`}>
        {size === 'lg' ? <User size={iconSize} /> : initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      onError={() => setError(true)}
      className={`${sizeClasses} object-cover shadow-sm border border-slate-200 shrink-0`}
    />
  );
};
