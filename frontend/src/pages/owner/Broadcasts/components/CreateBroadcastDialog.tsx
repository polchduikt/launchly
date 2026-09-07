import React, { useState } from 'react';
import { AlertTriangle, Send, Loader2, X, User } from 'lucide-react';
import { t } from '../../../../i18n/config';
import type { CreateBroadcastDialogProps } from '../../../../types';
import { CustomSelect } from '../../../../components/ui/CustomSelect';

export const CreateBroadcastDialog: React.FC<CreateBroadcastDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  isCreating,
  createError,
  bots,
}) => {
  const [selectedAutomation, setSelectedAutomation] = useState<string>('ALL');

  if (!isOpen) return null;

  const connectedBots = bots.filter((b) => b.hasTelegramToken);

  const automationOptions = [
    { value: 'ALL', label: t('broadcast.dialog.all_automations') },
    ...connectedBots.map((b) => ({ value: String(b.id), label: b.name })),
  ];

  const selectedAutomationCount =
    selectedAutomation === 'ALL'
      ? connectedBots.reduce((acc, b) => acc + (b.totalUsers || 0), 0)
      : connectedBots.find((b) => String(b.id) === selectedAutomation)?.totalUsers || 0;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/50 p-4 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] rounded-2xl border-2 border-[#0A0A0A] shadow-2xl max-w-lg w-full overflow-hidden cursor-default font-['JetBrains_Mono',monospace]"
      >
        <div className="px-6 py-4 border-b-2 border-[#0A0A0A] flex items-center justify-between">
          <h3 className="font-['Anybody',sans-serif] text-lg font-black text-[#0A0A0A] uppercase tracking-tight">{t('broadcast.dialog.create_title')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {createError && (
            <div className="bg-rose-200 text-[#0A0A0A] px-4 py-3 rounded-xl text-xs font-bold border-2 border-[#0A0A0A] flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{createError.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider">{t('broadcast.dialog.campaign_name')}</label>
            <input
              type="text"
              placeholder={t('broadcast.dialog.campaign_name_placeholder')}
              {...form.register('name')}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold text-[#0A0A0A] bg-white focus:outline-none transition-all"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-rose-700 font-bold">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider">{t('broadcast.dialog.automation')}</label>
            <CustomSelect
              value={selectedAutomation}
              onChange={setSelectedAutomation}
              options={automationOptions}
            />
            <div className="flex items-center gap-1.5 px-3 py-2 bg-indigo-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] mt-1">
              <User size={13} className="text-[#0A0A0A]" />
              <span>
                {t('broadcast.dialog.subscribers_of_automation_desc', { count: selectedAutomationCount })}
              </span>
            </div>
          </div>
          <input type="hidden" value="ALL" {...form.register('filterType')} />

          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider">{t('broadcast.dialog.message_text')}</label>
            <textarea
              rows={4}
              placeholder={t('broadcast.dialog.message_placeholder')}
              {...form.register('message')}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold text-[#0A0A0A] bg-white focus:outline-none transition-all resize-none"
            />
            {form.formState.errors.message && (
              <p className="text-xs text-rose-700 font-bold">{form.formState.errors.message.message}</p>
            )}
          </div>

          <div className="pt-4 border-t-2 border-[#0A0A0A]/15 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-[#0A0A0A] hover:bg-white border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
            >
              {t('broadcast.dialog.cancel')}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] hover:bg-indigo-700 disabled:opacity-50 border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
            >
              {isCreating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>{t('broadcast.dialog.creating')}</span>
                </>
              ) : (
                <>
                  <Send size={12} />
                  <span>{t('broadcast.dialog.create_campaign')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
