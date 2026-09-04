import React, { useState } from 'react';
import { X, Trash2, AlertOctagon, Loader2 } from 'lucide-react';
import { useLogoutMutation } from '../../../../hooks/auth/useLogoutMutation';
import { deleteAccountApi } from '../../../../api/auth';
import { t } from '../../../../i18n/config';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const logoutMutation = useLogoutMutation();

  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const confirmDeleteWord = t('settings.delete_modal.confirm_word', 'ВИДАЛИТИ').toUpperCase();
  const userTyped = confirmText.trim().toUpperCase();
  const isConfirmed = userTyped === confirmDeleteWord || userTyped === 'ВИДАЛИТИ' || userTyped === 'DELETE';

  const handleDeleteAccount = async () => {
    if (!isConfirmed) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await deleteAccountApi();
      logoutMutation.mutate();
    } catch (err: any) {
      logoutMutation.mutate();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/40 animate-fade-in font-['JetBrains_Mono',monospace]"
    >
      <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] shadow-[10px_10px_0px_#0A0A0A] rounded-3xl max-w-lg w-full overflow-hidden text-[#0A0A0A] relative">
        
        <div className="p-6 border-b-2 border-[#0A0A0A] flex items-center justify-between bg-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
              <AlertOctagon size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-base uppercase tracking-tight text-rose-900">
                {t('settings.delete_modal.title', 'Видалити акаунт')}
              </h2>
              <p className="text-[11px] font-bold text-rose-700">
                {t('settings.delete_modal.subtitle', 'Незворотне видалення облікового запису')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-rose-50 border-2 border-rose-600 p-5 rounded-2xl space-y-2 text-rose-900">
            <h4 className="font-black text-xs uppercase flex items-center gap-2">
              <AlertOctagon size={16} className="text-rose-600" />
              <span>{t('settings.delete_modal.warning_title', 'УВАГА! Ця дія є незворотною')}</span>
            </h4>
            <p className="text-[11.5px] font-bold text-rose-800 leading-relaxed">
              {t(
                'settings.delete_modal.warning_desc',
                'Ваш обліковий запис, усі створені боти, воронки, автоматизації, налаштування, контакти та активні підписки будуть назавжди видалені без можливості відновлення.'
              )}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-100 border-2 border-rose-600 text-rose-800 p-3 rounded-xl text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 space-y-2">
            <label className="block text-[11px] font-extrabold uppercase text-[#0A0A0A] leading-tight">
              {t('settings.delete_modal.confirm_label', 'Для підтвердження видалення введіть слово')}{' '}
              <span className="bg-rose-200 px-2 py-0.5 rounded-md border border-[#0A0A0A] font-black text-rose-900 select-all">
                {confirmDeleteWord}
              </span>:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t('settings.delete_modal.confirm_placeholder', { word: confirmDeleteWord })}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] bg-white text-xs font-black uppercase text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-slate-400 placeholder:font-bold tracking-wider"
            />
          </div>
        </div>

        <div className="p-5 border-t-2 border-[#0A0A0A] bg-white flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-[#0A0A0A] border-2 border-[#0A0A0A] text-xs font-extrabold rounded-xl transition-all cursor-pointer"
          >
            {t('common.cancel', 'Скасувати')}
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={submitting || !isConfirmed}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                <span>{t('settings.delete_modal.deleting', 'Видаляємо акаунт...')}</span>
              </>
            ) : (
              <>
                <span>{t('settings.delete_modal.btn_confirm', 'Назавжди видалити акаунт')}</span>
                <Trash2 size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
