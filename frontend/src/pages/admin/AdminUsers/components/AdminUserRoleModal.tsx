import React, { useState, useEffect } from 'react';
import { Shield, X, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../../i18n/config';
import type { AdminUser } from '../../../../api/admin';

interface AdminUserRoleModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSave: (role: 'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER') => void;
  isPending?: boolean;
}

export const AdminUserRoleModal: React.FC<AdminUserRoleModalProps> = ({
  isOpen,
  user,
  onClose,
  onSave,
  isPending = false,
}) => {
  const { t } = useTranslation();
  const [newRole, setNewRole] = useState<'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER'>('ROLE_OWNER');

  useEffect(() => {
    if (user) {
      setNewRole((user.role as 'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER') || 'ROLE_OWNER');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-md p-6 space-y-6 shadow-[10px_10px_0px_#0A0A0A] text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
        <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
          <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
            <Shield size={20} className="text-[#0A0A0A]" />
            <span>{t('admin.change_role_title')}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-[#0A0A0A] font-bold">
            User: <strong className="font-black text-[#0A0A0A]">{user.email}</strong>
          </p>

          <div className="space-y-2.5">
            <label
              className={`flex items-center justify-between p-3.5 rounded-2xl border-2 border-[#0A0A0A] cursor-pointer transition ${
                newRole === 'ROLE_OWNER' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'bg-white text-[#0A0A0A]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="radio"
                  name="role"
                  value="ROLE_OWNER"
                  checked={newRole === 'ROLE_OWNER'}
                  onChange={() => setNewRole('ROLE_OWNER')}
                  className="accent-[#0A0A0A]"
                />
                <span className="text-xs uppercase font-bold">{t('admin.owners')}</span>
              </div>
            </label>

            <label
              className={`flex items-center justify-between p-3.5 rounded-2xl border-2 border-[#0A0A0A] cursor-pointer transition ${
                newRole === 'ROLE_MANAGER' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'bg-white text-[#0A0A0A]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="radio"
                  name="role"
                  value="ROLE_MANAGER"
                  checked={newRole === 'ROLE_MANAGER'}
                  onChange={() => setNewRole('ROLE_MANAGER')}
                  className="accent-[#0A0A0A]"
                />
                <span className="text-xs uppercase font-bold">{t('admin.managers')}</span>
              </div>
            </label>

            <label
              className={`flex items-center justify-between p-3.5 rounded-2xl border-2 border-[#0A0A0A] cursor-pointer transition ${
                newRole === 'ROLE_ADMIN' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'bg-white text-[#0A0A0A]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <input
                  type="radio"
                  name="role"
                  value="ROLE_ADMIN"
                  checked={newRole === 'ROLE_ADMIN'}
                  onChange={() => setNewRole('ROLE_ADMIN')}
                  className="accent-[#0A0A0A]"
                />
                <span className="text-xs uppercase font-bold">{t('admin.admins')}</span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-[#0A0A0A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#0A0A0A] border-2 border-transparent hover:border-[#0A0A0A] bg-white cursor-pointer"
          >
            {t('admin.cancel')}
          </button>
          <button
            type="button"
            onClick={() => onSave(newRole)}
            disabled={isPending}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] shadow-[2px_2px_0px_#0A0A0A] transition flex items-center gap-1.5 cursor-pointer"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            <span>{t('admin.save_role')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
