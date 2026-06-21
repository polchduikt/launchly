import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: number;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, photoUrl, size = 32, className = '' }) => {
  const [hasError, setHasError] = useState(!photoUrl);

  useEffect(() => {
    setHasError(!photoUrl);
  }, [photoUrl]);

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: (!hasError && photoUrl) ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
      }}
    >
      {!hasError && photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
};
