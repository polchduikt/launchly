import React, { useState, useEffect } from 'react';
import { isValidAvatarUrl, getInitials } from '../../utils/avatar';

interface SafeAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

export const SafeAvatar: React.FC<SafeAvatarProps> = ({
  src,
  name,
  className = 'w-9 h-9 rounded-full object-cover',
  fallbackClassName = 'w-9 h-9 rounded-full bg-ink text-canvas font-black flex items-center justify-center text-xs shrink-0 select-none border-2 border-ink',
  alt = 'Avatar',
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const hasValidUrl = isValidAvatarUrl(src) && !imgError;

  if (hasValidUrl) {
    return (
      <img
        src={src!}
        alt={alt || name || 'Avatar'}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={className}
      />
    );
  }

  return (
    <div className={fallbackClassName}>
      {getInitials(name)}
    </div>
  );
};
