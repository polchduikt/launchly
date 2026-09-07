import React from 'react';
import { X, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { t } from '../../../../i18n/config';
import type { BotResponse } from '../../../../types/bot';

interface EditAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  bots: BotResponse[];
  editBotId: number | null;
  name: string;
  setName: (name: string) => void;
  option: string;
  setOption: (opt: string) => void;
  botToken: string;
  setBotToken: (token: string) => void;
  desc: string;
  setDesc: (desc: string) => void;
  error: string | null;
  setError: (err: string | null) => void;
}

export const EditAutomationModal: React.FC<EditAutomationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  bots,
  editBotId,
  name,
  setName,
  option,
  setOption,
  botToken,
  setBotToken,
  desc,
  setDesc,
  error,
  setError,
}) => {
  const [isEditBotSelectOpen, setIsEditBotSelectOpen] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4 cursor-pointer font-['JetBrains_Mono',monospace]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-canvas rounded-3xl max-w-md w-full border-2 border-ink shadow-brutal-xl animate-in fade-in duration-200 cursor-default overflow-hidden"
      >
        <div className="p-6 pb-4 border-b-2 border-ink flex items-center justify-between">
          <h3 className="font-['Anybody',sans-serif] text-lg font-black uppercase text-ink">
            {t('automations.edit_modal.title')}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-ink bg-white text-ink hover:bg-ink hover:text-white transition-all cursor-pointer shadow-sm"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4 bg-white">
          <div>
            <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
              {t('automations.edit_modal.name_label')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink text-xs font-bold focus:outline-none bg-white text-ink"
              placeholder={t('automations.edit_modal.name_placeholder')}
            />
          </div>
          <div className="relative">
            <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
              {t('automations.edit_modal.bot_connection')}
            </label>
            <button
              type="button"
              onClick={() => setIsEditBotSelectOpen(!isEditBotSelectOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 border-ink text-xs font-bold bg-white text-left cursor-pointer transition-colors"
            >
              <span className="text-ink font-bold truncate">
                {(() => {
                  if (option === 'current') {
                    const currentBot = bots.find((b) => b.id === editBotId);
                    return currentBot
                      ? `${currentBot.name} ${currentBot.username ? `@${currentBot.username}` : ''}`
                      : t('automations.edit_modal.connected_bot');
                  }
                  if (option === 'nobot') return t('automations.edit_modal.without_bot');
                  if (option === 'new') return t('automations.edit_modal.connect_new_bot');
                  const selectedBot = bots.find((b) => String(b.id) === option);
                  if (selectedBot) {
                    return `${selectedBot.name} ${selectedBot.username ? `@${selectedBot.username}` : ''}`;
                  }
                  return t('automations.edit_modal.without_bot');
                })()}
              </span>
              <ChevronDown
                size={16}
                className={`text-ink transition-transform ${isEditBotSelectOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isEditBotSelectOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsEditBotSelectOpen(false)} />
                <div className="absolute left-0 right-0 mt-1 bg-canvas border-2 border-ink rounded-2xl shadow-brutal-lg z-20 max-h-60 overflow-y-auto py-1.5">
                  {(() => {
                    const currentBot = bots.find((b) => b.id === editBotId);
                    if (currentBot && currentBot.username) {
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setOption('current');
                            setError(null);
                            setIsEditBotSelectOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${
                            option === 'current'
                              ? 'bg-ink text-canvas font-black'
                              : 'text-ink hover:bg-white font-bold'
                          }`}
                        >
                          <span>{currentBot.name} @{currentBot.username}</span>
                        </button>
                      );
                    }
                    return null;
                  })()}
                  <button
                    type="button"
                    onClick={() => {
                      setOption('nobot');
                      setError(null);
                      setIsEditBotSelectOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${
                      option === 'nobot'
                        ? 'bg-ink text-canvas font-black'
                        : 'text-ink hover:bg-white font-bold'
                    }`}
                  >
                    <span>{t('automations.edit_modal.without_bot')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOption('new');
                      setError(null);
                      setIsEditBotSelectOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${
                      option === 'new'
                        ? 'bg-ink text-canvas font-black'
                        : 'text-ink hover:bg-white font-bold'
                    }`}
                  >
                    <span>{t('automations.edit_modal.connect_new_bot')}</span>
                  </button>

                  {(() => {
                    const existingRealBots = bots.filter((b) => b.id !== editBotId && b.username);
                    if (existingRealBots.length === 0) return null;
                    return (
                      <>
                        <div className="border-t-2 border-ink my-1" />
                        <div className="px-4 py-1.5 text-[10px] font-black text-ink uppercase tracking-wider">
                          {t('automations.edit_modal.use_existing_token')}
                        </div>
                        {existingRealBots.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setOption(String(b.id));
                              setError(null);
                              setIsEditBotSelectOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${
                              option === String(b.id)
                                ? 'bg-ink text-canvas font-black'
                                : 'text-ink hover:bg-white font-bold'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold">{b.name}</span>
                              {b.username && <span className="text-[10px] opacity-80">@{b.username}</span>}
                            </div>
                          </button>
                        ))}
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
          {option === 'new' && (
            <div className="animate-in slide-in-from-top-1 duration-150">
              <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
                {t('automations.edit_modal.bot_token')}
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink text-xs font-bold focus:outline-none bg-white text-ink"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-black text-ink uppercase tracking-wider mb-1">
              {t('automations.edit_modal.desc_label')}
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-ink text-xs font-bold focus:outline-none bg-white text-ink min-h-[80px] resize-none"
              placeholder={t('automations.edit_modal.desc_placeholder')}
            />
          </div>
          {error && (
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <AlertCircle size={14} />
              <span>{error}</span>
            </p>
          )}
        </div>
        <div className="p-6 pt-4 bg-canvas border-t-2 border-ink flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-black uppercase text-ink dark:text-[#E4E4E7] hover:bg-white dark:hover:bg-[#27272A] border-2 border-transparent hover:border-ink dark:hover:border-[#3F3F46] rounded-xl transition-all cursor-pointer"
          >
            {t('automations.edit_modal.cancel')}
          </button>
          <button
            onClick={onSubmit}
            disabled={isPending}
            className="px-4 py-2 text-xs font-black uppercase text-canvas bg-ink hover:bg-[#2A2A2A] border-2 border-ink rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{t('automations.edit_modal.saving')}</span>
              </>
            ) : (
              <span>{t('automations.edit_modal.save')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
