import React, { useState, useEffect } from 'react';
import { isValidAvatarUrl, getInitials } from '../../../../utils/avatar';

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, photoUrl, size = 32, className = '' }) => {
  const [hasError, setHasError] = useState(!isValidAvatarUrl(photoUrl));

  useEffect(() => {
    setHasError(!isValidAvatarUrl(photoUrl));
  }, [photoUrl]);

  const showImage = !hasError && isValidAvatarUrl(photoUrl);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: showImage ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      }}
    >
      {showImage ? (
        <img
          src={photoUrl!}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};
