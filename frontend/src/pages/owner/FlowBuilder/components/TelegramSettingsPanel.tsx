import React from 'react';
import { useNavigate as useRoutingNavigate } from 'react-router-dom';
import { t } from '../../../../i18n/config';
import {
  Send,
  Loader2,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useTelegramSettings } from '../../../../hooks/bot/useTelegramSettings';

export const TelegramSettingsPanel: React.FC = () => {
  const navigate = useRoutingNavigate();
  const {
    bots,
    isLoading,
    getBotSettings,
    updateBotSetting,
    handleToggleBot,
    handleUpdateResponseMode,
    activeTokenBot,
    setActiveTokenBot,
    newTokenValue,
    setNewTokenValue,
    tokenError,
    setTokenError,
    activeResponseModeBot,
    setActiveResponseModeBot,
    selectedResponseMode,
    setSelectedResponseMode,
    activeDeleteBot,
    setActiveDeleteBot,
    deleteConfirmationName,
    setDeleteConfirmationName,
    activeEditAutomation,
    setActiveEditAutomation,
    showSuccessBanner,
    setShowSuccessBanner,
    handleRefreshBotToken,
    handleDeleteBot,
    updateBotMutation,
    deleteBotMutation,
  } = useTelegramSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-10 text-center max-w-lg mx-auto shadow-sm space-y-4">
        <div className="w-16 h-16 bg-white border-2 border-[#0A0A0A] rounded-full flex items-center justify-center mx-auto text-[#0A0A0A]">
          <Send size={32} />
        </div>
        <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-lg uppercase">{t('settings.telegram.no_bots_title')}</h3>
        <p className="text-xs text-slate-700 font-bold max-w-sm mx-auto leading-relaxed">
          {t('settings.telegram.no_bots_desc')}
        </p>
        <button
          onClick={() => navigate('/connect-bot')}
          className="px-6 py-2.5 bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-white text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
        >
          {t('settings.telegram.btn_connect')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full pb-20">
      {showSuccessBanner && (
        <div className="bg-emerald-200 border-2 border-[#0A0A0A] text-[#0A0A0A] p-4 rounded-2xl flex items-center justify-between shadow-[4px_4px_0px_0px_#0A0A0A] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#0A0A0A] shrink-0" />
            <span className="text-xs font-bold">{showSuccessBanner}</span>
          </div>
          <button
            onClick={() => setShowSuccessBanner(null)}
            className="text-[#0A0A0A] p-1 hover:bg-white rounded-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between bg-white border-2 border-[#0A0A0A] p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white border-2 border-[#0A0A0A] rounded-2xl flex items-center justify-center text-[#0A0A0A]">
            <Send size={24} />
          </div>
          <div>
            <h1 className="font-['Anybody',sans-serif] text-lg font-black text-[#0A0A0A] uppercase tracking-tight">{t('settings.telegram.header')}</h1>
            <p className="text-xs text-slate-700 font-bold mt-0.5">
              {t('settings.telegram.subheader')}
            </p>
          </div>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border-2 border-[#0A0A0A] flex items-center gap-3">
          <span className="text-xs font-black text-[#0A0A0A] uppercase">{t('settings.telegram.status_label')}</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-200 text-[#0A0A0A] border-2 border-[#0A0A0A]">
            {t('settings.telegram.enabled')}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {bots.map((bot, index) => {
          const username = bot.username ? `@${bot.username.replace(/^@/, '')}` : `@${bot.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_bot`;
          const isMultiple = bots.length > 1;

          return (
            <div
              key={bot.id}
              className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-6 space-y-6 shadow-sm"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] flex items-center justify-center font-black text-sm">
                    {bot.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase flex items-center gap-2">
                      {bot.name}
                      {isMultiple && (
                        <span className="text-[10px] font-black text-[#0A0A0A] bg-white border-2 border-[#0A0A0A] px-2 py-0.5 rounded-full">
                          {t('settings.telegram.bot_tag', { index: index + 1 })}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-700 font-bold">
                      {username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border-2 border-[#0A0A0A]">
                  <span className="text-xs font-black text-[#0A0A0A] uppercase">{t('settings.telegram.enabled')}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={bot.active}
                    onClick={() => handleToggleBot(bot)}
                    className={`w-11 h-6 rounded-full transition-all relative outline-none cursor-pointer border-2 border-[#0A0A0A] p-0.5 inline-flex items-center shrink-0 ${
                      bot.active ? 'bg-[#0A0A0A]' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 bg-white rounded-full transition-transform border border-[#0A0A0A] shrink-0 ${
                        bot.active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-2">

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-200 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('settings.telegram.bot_info_title')}</h4>
                  </div>
                  <div className="md:col-span-5 space-y-3">
                    <div>
                      <div className="text-[11px] font-black text-[#0A0A0A] uppercase">{t('settings.telegram.bot_name_label')}</div>
                      <div className="text-xs text-slate-800 font-bold mt-0.5">{bot.name}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-[#0A0A0A] uppercase">{t('settings.telegram.bot_username_label')}</div>
                      <a
                        href={`https://t.me/${username.startsWith('@') ? username.substring(1) : username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0A0A0A] font-bold underline mt-0.5 inline-block"
                      >
                        {username}
                      </a>
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">
                      {t('settings.telegram.bot_name_desc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-200 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('settings.telegram.response_mode_title')}</h4>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      onClick={() => {
                        setActiveResponseModeBot(bot);
                        setSelectedResponseMode(bot.responseMode || 'ALL');
                      }}
                      className="bg-white hover:bg-[#0A0A0A] hover:text-white border-2 border-[#0A0A0A] px-6 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                    >
                      {t('settings.telegram.btn_edit')}
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">
                      {t('settings.telegram.response_mode_desc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-200 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('settings.telegram.opt_in_title')}</h4>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      onClick={() => setActiveEditAutomation({ botId: bot.id, type: 'opt-in' })}
                      className="bg-white hover:bg-[#0A0A0A] hover:text-white border-2 border-[#0A0A0A] px-6 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                    >
                      {t('settings.telegram.btn_edit')}
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">
                      {t('settings.telegram.opt_in_desc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-200 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('settings.telegram.opt_out_title')}</h4>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      onClick={() => setActiveEditAutomation({ botId: bot.id, type: 'opt-out' })}
                      className="bg-white hover:bg-[#0A0A0A] hover:text-white border-2 border-[#0A0A0A] px-6 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                    >
                      {t('settings.telegram.btn_edit')}
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">
                      {t('settings.telegram.opt_out_desc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-200 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('settings.telegram.revoke_title')}</h4>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      onClick={() => {
                        setActiveTokenBot(bot);
                        setNewTokenValue('');
                        setTokenError(null);
                      }}
                      className="bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-white border-2 border-[#0A0A0A] px-6 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                    >
                      {t('settings.telegram.btn_refresh')}
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">
                      {t('settings.telegram.revoke_desc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-black text-xs text-rose-600 uppercase tracking-wider">{t('settings.telegram.remove_title')}</h4>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      onClick={() => {
                        setActiveDeleteBot(bot);
                        setDeleteConfirmationName('');
                      }}
                      className="border-2 border-rose-600 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800 px-6 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
                    >
                      {t('settings.telegram.btn_remove')}
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">
                      {t('settings.telegram.remove_desc')}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {activeTokenBot && (
        <div 
          onClick={() => setActiveTokenBot(null)}
          className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#0A0A0A] w-full max-w-md rounded-2xl p-6 shadow-sm relative space-y-4 cursor-default text-left"
          >
            <button
              onClick={() => setActiveTokenBot(null)}
              className="absolute top-4 right-4 text-[#0A0A0A] hover:bg-slate-100 p-1 rounded-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
            >
              <X size={16} />
            </button>
            <div className="space-y-1">
              <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-base uppercase">{t('settings.telegram.modal.refresh_title')}</h3>
              <p className="text-xs text-slate-700 font-bold">
                {t('settings.telegram.modal.refresh_desc', { name: activeTokenBot.name })}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#0A0A0A] uppercase">{t('settings.telegram.modal.token_label')}</label>
              <input
                type="text"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={newTokenValue}
                onChange={(e) => {
                  setNewTokenValue(e.target.value);
                  if (tokenError) setTokenError(null);
                }}
                className="w-full px-4 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs focus:outline-none font-bold text-[#0A0A0A]"
              />
              {tokenError && (
                <div className="text-xs text-rose-600 font-black flex items-center gap-1">
                  <AlertCircle size={12} />
                  <span>{tokenError}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setActiveTokenBot(null)}
                className="px-4 py-2 bg-white hover:bg-[#0A0A0A] hover:text-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
              >
                {t('settings.telegram.modal.btn_cancel')}
              </button>
              <button
                onClick={handleRefreshBotToken}
                disabled={updateBotMutation.isPending}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
              >
                {updateBotMutation.isPending ? (
                  <Loader2 className="animate-spin" size={12} />
                ) : (
                  <span>{t('settings.telegram.modal.btn_save_token')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeDeleteBot && (
        <div 
          onClick={() => setActiveDeleteBot(null)}
          className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#0A0A0A] w-full max-w-md rounded-2xl p-6 shadow-sm relative space-y-4 cursor-default text-left"
          >
            <button
              onClick={() => setActiveDeleteBot(null)}
              className="absolute top-4 right-4 text-[#0A0A0A] hover:bg-slate-100 p-1 rounded-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
            >
              <X size={16} />
            </button>
            <div className="space-y-1">
              <h3 className="font-['Anybody',sans-serif] font-black text-rose-600 text-base uppercase">{t('settings.telegram.modal.remove_title')}</h3>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                {t('settings.telegram.modal.remove_desc', { name: activeDeleteBot.name })}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#0A0A0A] uppercase">
                {t('settings.telegram.modal.remove_confirm', { name: activeDeleteBot.name })}
              </label>
              <input
                type="text"
                placeholder={activeDeleteBot.name}
                value={deleteConfirmationName}
                onChange={(e) => setDeleteConfirmationName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs focus:outline-none font-bold text-[#0A0A0A]"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
              <button
                onClick={() => setActiveDeleteBot(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-white text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                {t('settings.telegram.modal.btn_cancel')}
              </button>
              <button
                onClick={handleDeleteBot}
                disabled={
                  deleteBotMutation.isPending ||
                  deleteConfirmationName.trim().toLowerCase() !== activeDeleteBot.name.toLowerCase()
                }
                className="w-full sm:w-auto px-5 py-2.5 border-2 border-rose-600 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800 disabled:opacity-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed text-center"
              >
                {deleteBotMutation.isPending ? (
                  <Loader2 className="animate-spin" size={12} />
                ) : (
                  <span>{t('settings.telegram.modal.btn_delete_bot')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeEditAutomation && (
        <div 
          onClick={() => setActiveEditAutomation(null)}
          className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#0A0A0A] w-full max-w-md rounded-2xl p-6 shadow-sm relative space-y-4 cursor-default text-left"
          >
            <button
              onClick={() => setActiveEditAutomation(null)}
              className="absolute top-4 right-4 text-[#0A0A0A] hover:bg-slate-100 p-1 rounded-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
            >
              <X size={16} />
            </button>
            <div className="space-y-1">
              <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-base uppercase">
                {t('settings.telegram.modal.edit_opt_title', {
                  type: activeEditAutomation.type === 'opt-in' ? 'Opt-in' : 'Opt-out'
                })}
              </h3>
              <p className="text-xs text-slate-700 font-bold">
                {t('settings.telegram.modal.edit_opt_desc', {
                  action: activeEditAutomation.type === 'opt-in' 
                    ? t('settings.telegram.modal.subscription') 
                    : t('settings.telegram.modal.unsubscription')
                })}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-[#0A0A0A] uppercase">{t('settings.telegram.modal.keywords_label')}</label>
                <div className="flex gap-2 mt-1.5">
                  {(activeEditAutomation.type === 'opt-in' ? ['Start', 'Subscribe'] : ['Stop', 'Unsubscribe']).map(
                    (kw) => (
                      <span
                        key={kw}
                        className="bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs px-2.5 py-0.5 rounded-lg font-bold"
                      >
                        {kw}
                      </span>
                    )
                  )}
                </div>
                <p className="text-[10px] text-slate-700 mt-1 italic font-bold">
                  {t('settings.telegram.modal.keywords_desc')}
                </p>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-200">
                <span className="text-xs font-black text-[#0A0A0A] uppercase">{t('settings.telegram.modal.trigger_toggle')}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={getBotSettings(activeEditAutomation.botId)[
                    activeEditAutomation.type === 'opt-in' ? 'optInEnabled' : 'optOutEnabled'
                  ]}
                  onClick={() => {
                    const key =
                        activeEditAutomation.type === 'opt-in' ? 'optInEnabled' : 'optOutEnabled';
                    const cur = getBotSettings(activeEditAutomation.botId);
                    updateBotSetting(activeEditAutomation.botId, key, !cur[key]);
                  }}
                  className={`w-11 h-6 rounded-full transition-all relative outline-none cursor-pointer border-2 border-[#0A0A0A] p-0.5 inline-flex items-center shrink-0 ${
                    getBotSettings(activeEditAutomation.botId)[
                      activeEditAutomation.type === 'opt-in' ? 'optInEnabled' : 'optOutEnabled'
                    ]
                      ? 'bg-[#0A0A0A]'
                      : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`w-4 h-4 bg-white rounded-full transition-transform border border-[#0A0A0A] shrink-0 ${
                      getBotSettings(activeEditAutomation.botId)[
                        activeEditAutomation.type === 'opt-in' ? 'optInEnabled' : 'optOutEnabled'
                      ]
                        ? 'translate-x-5'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowSuccessBanner(
                    t('settings.telegram.modal.success_opt_banner', {
                      type: activeEditAutomation.type === 'opt-in' ? 'Opt-in' : 'Opt-out'
                    })
                  );
                  setActiveEditAutomation(null);
                }}
                className="px-6 py-2 bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
              >
                {t('settings.telegram.modal.btn_close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeResponseModeBot && (
        <div 
          onClick={() => setActiveResponseModeBot(null)}
          className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-[#0A0A0A] w-full max-w-md rounded-2xl p-6 shadow-sm relative space-y-5 cursor-default text-left"
          >
            <button
              onClick={() => setActiveResponseModeBot(null)}
              className="absolute top-4 right-4 text-[#0A0A0A] hover:bg-slate-100 p-1 rounded-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
            >
              <X size={16} />
            </button>
            <div className="space-y-1">
              <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-base uppercase">
                {t('settings.telegram.response_mode_title')}
              </h3>
              <p className="text-xs text-slate-700 font-bold">
                {t('settings.telegram.response_mode_desc')}
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  value: 'ALL' as const,
                  title: t('settings.telegram.response_mode_all'),
                  desc: t('settings.telegram.response_mode_all_desc'),
                },
                {
                  value: 'PRIVATE_ONLY' as const,
                  title: t('settings.telegram.response_mode_private_only'),
                  desc: t('settings.telegram.response_mode_private_only_desc'),
                },
                {
                  value: 'GROUPS_ONLY' as const,
                  title: t('settings.telegram.response_mode_groups_only'),
                  desc: t('settings.telegram.response_mode_groups_only_desc'),
                },
              ].map((opt) => {
                const isSelected = selectedResponseMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedResponseMode(opt.value)}
                    className={`w-full p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white shadow-[2px_2px_0px_0px_#0A0A0A]'
                        : 'border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black uppercase">{opt.title}</div>
                      <div className={`text-[11px] font-bold mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                        {opt.desc}
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-white bg-white' : 'border-[#0A0A0A] bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#0A0A0A]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setActiveResponseModeBot(null)}
                className="px-4 py-2 bg-white hover:bg-[#0A0A0A] hover:text-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
              >
                {t('settings.telegram.modal.btn_cancel')}
              </button>
              <button
                onClick={async () => {
                  if (activeResponseModeBot) {
                    await handleUpdateResponseMode(activeResponseModeBot, selectedResponseMode);
                    setShowSuccessBanner(t('settings.updated'));
                    setActiveResponseModeBot(null);
                  }
                }}
                disabled={updateBotMutation.isPending}
                className="px-5 py-2 bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] text-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
              >
                {updateBotMutation.isPending ? (
                  <Loader2 className="animate-spin" size={12} />
                ) : (
                  <span>{t('settings.telegram.modal.btn_save')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
