import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { isValidAvatarUrl, getInitials } from '../../../../utils/avatar';

interface ContactAvatarProps {
  photoUrl: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ContactAvatar: React.FC<ContactAvatarProps> = ({ photoUrl, name, size = 'sm' }) => {
  const [error, setError] = useState(!isValidAvatarUrl(photoUrl));

  useEffect(() => {
    setError(!isValidAvatarUrl(photoUrl));
  }, [photoUrl]);

  const initials = getInitials(name, '?');

  let sizeClasses = 'w-8 h-8 rounded-full';
  let iconSize = 16;
  if (size === 'md') {
    sizeClasses = 'w-11 h-11 rounded-full';
    iconSize = 20;
  } else if (size === 'lg') {
    sizeClasses = 'w-48 h-48 rounded-2xl';
    iconSize = 64;
  }

  if (error || !isValidAvatarUrl(photoUrl)) {
    return (
      <div className={`${sizeClasses} bg-slate-100 text-slate-500 flex items-center justify-center font-bold uppercase shadow-sm border border-slate-200 shrink-0 select-none`}>
        {size === 'lg' ? <User size={iconSize} /> : initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl!}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={`${sizeClasses} object-cover shadow-sm border border-slate-200 shrink-0 select-none`}
    />
  );
};
