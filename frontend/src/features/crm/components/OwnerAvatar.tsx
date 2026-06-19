import React from 'react';
import { useAuthStore } from '../../../store/useAuthStore';

interface OwnerAvatarProps {
  size?: number;
}

export const OwnerAvatar: React.FC<OwnerAvatarProps> = ({ size = 28 }) => {
  const user = useAuthStore((s) => s.user);

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
      style={{ width: size, height: size, fontSize: size * 0.35, background: user?.avatar ? 'transparent' : 'linear-gradient(135deg, #64748b, #475569)' }}
    >
      {user?.avatar ? (
        <img src={user.avatar} alt="Me" className="w-full h-full object-cover" />
      ) : (
        user?.name ? user.name.substring(0, 2).toUpperCase() : 'Me'
      )}
    </div>
  );
};
