import React, { useState } from 'react';
import { useAuthStore } from '../../../../store/useAuthStore';
import { isValidAvatarUrl, getInitials } from '../../../../utils/avatar';

interface OwnerAvatarProps {
  size?: number;
}

export const OwnerAvatar: React.FC<OwnerAvatarProps> = ({ size = 28 }) => {
  const user = useAuthStore((s) => s.user);
  const [imgError, setImgError] = useState(false);

  const hasValidUrl = isValidAvatarUrl(user?.avatar) && !imgError;

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: hasValidUrl ? 'transparent' : 'linear-gradient(135deg, #64748b, #475569)',
      }}
    >
      {hasValidUrl ? (
        <img
          src={user!.avatar!}
          alt={user?.name || 'Me'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        getInitials(user?.name, 'Me')
      )}
    </div>
  );
};
