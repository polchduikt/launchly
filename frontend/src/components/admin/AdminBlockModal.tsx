import React, { useState } from 'react';
import { ShieldAlert, X, Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n/config';

export interface BlockReason {
  code: string;
  label: string;
}

interface AdminBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, details?: string) => void;
  title: string;
  entityInfo: React.ReactNode;
  isPending?: boolean;
  reasons?: BlockReason[];
}

export const AdminBlockModal: React.FC<AdminBlockModalProps> = React.memo(({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityInfo,
  isPending = false,
  reasons,
}) => {
  const { t } = useTranslation();

  const defaultReasons: BlockReason[] = [
    { code: 'SUSPICIOUS_ACTIVITY', label: t('admin.reason_suspicious') !== 'admin.reason_suspicious' ? t('admin.reason_suspicious') : 'Підозріла активність' },
    { code: 'VIOLATION_OF_RULES', label: t('admin.reason_rules') !== 'admin.reason_rules' ? t('admin.reason_rules') : 'Порушення правил' },
    { code: 'SPAM', label: t('admin.reason_spam') !== 'admin.reason_spam' ? t('admin.reason_spam') : 'Спам / зловживання' },
    { code: 'OTHER', label: t('admin.reason_other') !== 'admin.reason_other' ? t('admin.reason_other') : 'Інше' },
  ];

  const reasonList = reasons || defaultReasons;

  const [selectedReason, setSelectedReason] = useState(reasonList[0]?.code || 'OTHER');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedReason, selectedReason === 'OTHER' ? customReason : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-[10px_10px_0px_#0A0A0A] text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
        <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
          <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-600" />
            <span>{title}</span>
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
          {entityInfo}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#0A0A0A] block">
              {t('admin.select_block_reason') !== 'admin.select_block_reason' ? t('admin.select_block_reason') : 'Оберіть причину блокування'}
            </label>
            {reasonList.map((r) => (
              <label
                key={r.code}
                onClick={() => setSelectedReason(r.code)}
                className={`flex items-center space-x-3 p-3.5 rounded-2xl border-2 border-[#0A0A0A] cursor-pointer transition ${
                  selectedReason === r.code
                    ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black shadow-[2px_2px_0px_#0A0A0A]'
                    : 'bg-white text-[#0A0A0A] hover:bg-amber-50'
                }`}
              >
                <input
                  type="radio"
                  name="blockReason"
                  checked={selectedReason === r.code}
                  onChange={() => setSelectedReason(r.code)}
                  className="accent-[#0A0A0A]"
                />
                <span className="text-xs uppercase font-bold">{r.label}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'OTHER' && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-black uppercase text-[#0A0A0A] block">
                {t('admin.specify_block_reason') !== 'admin.specify_block_reason' ? t('admin.specify_block_reason') : 'Вкажіть причину'}
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="..."
                rows={3}
                className="w-full p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl text-xs font-bold text-[#0A0A0A] focus:outline-none transition shadow-[2px_2px_0px_#0A0A0A]"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-[#0A0A0A]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#0A0A0A] hover:bg-white border-2 border-transparent hover:border-[#0A0A0A] transition cursor-pointer"
          >
            {t('admin.cancel') !== 'admin.cancel' ? t('admin.cancel') : 'Скасувати'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="px-5 py-2 rounded-xl text-xs font-black uppercase text-white bg-rose-700 border-2 border-[#0A0A0A] hover:bg-rose-800 shadow-[2px_2px_0px_#0A0A0A] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            <span>{t('admin.confirm_block') !== 'admin.confirm_block' ? t('admin.confirm_block') : 'Заблокувати'}</span>
          </button>
        </div>
      </div>
    </div>
  );
});
