import React from 'react';
import { useNavigate as useRoutingNavigate } from 'react-router-dom';
import { t } from '../../../i18n/config';
import {
  Send,
  Loader2,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { useTelegramSettings } from '../hooks/useTelegramSettings';

export const TelegramSettingsPanel: React.FC = () => {
  const navigate = useRoutingNavigate();
  const {
    bots,
    isLoading,
    getBotSettings,
    updateBotSetting,
    handleToggleBot,
    activeTokenBot,
    setActiveTokenBot,
    newTokenValue,
    setNewTokenValue,
    tokenError,
    setTokenError,
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
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-lg mx-auto shadow-sm space-y-4">
        <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto text-[#0088cc]">
          <Send size={32} className="fill-[#0088cc]/10" />
        </div>
        <h3 className="font-extrabold text-slate-800 text-lg">{t('settings.telegram.no_bots_title')}</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
          {t('settings.telegram.no_bots_desc')}
        </p>
        <button
          onClick={() => navigate('/connect-bot')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer"
        >
          {t('settings.telegram.btn_connect')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full pb-20">
      {showSuccessBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{showSuccessBanner}</span>
          </div>
          <button
            onClick={() => setShowSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-[#0088cc] shadow-inner">
            <Send size={24} className="fill-[#0088cc]/10" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">{t('settings.telegram.header')}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('settings.telegram.subheader')}
            </p>
          </div>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-3">
          <span className="text-xs font-extrabold text-slate-600">{t('settings.telegram.status_label')}</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
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
              className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 ${
                isMultiple ? 'relative border-l-4 border-l-sky-500/80 shadow-md shadow-slate-100/40' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc] font-extrabold text-sm shadow-inner">
                    {bot.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      {bot.name}
                      {isMultiple && (
                        <span className="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                          {t('settings.telegram.bot_tag', { index: index + 1 })}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-[#0088cc] font-semibold">
                      {username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 shadow-inner">
                  <span className="text-[11px] font-bold text-slate-500">{t('settings.telegram.enabled')}</span>
                  <button
                    onClick={() => handleToggleBot(bot)}
                    className={`w-9 h-5 rounded-full transition-all relative outline-none cursor-pointer ${
                      bot.active ? 'bg-sky-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                        bot.active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="pl-6 md:pl-10 ml-2 border-l border-slate-100 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-50 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{t('settings.telegram.bot_info_title')}</h4>
                  </div>
                  <div className="md:col-span-5 space-y-3">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">{t('settings.telegram.bot_name_label')}</div>
                      <div className="text-xs text-slate-700 font-semibold mt-0.5">{bot.name}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-400">{t('settings.telegram.bot_username_label')}</div>
                      <a
                        href={`https://t.me/${username.startsWith('@') ? username.substring(1) : username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#0088cc] font-semibold hover:underline mt-0.5 inline-block"
                      >
                        {username}
                      </a>
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('settings.telegram.bot_name_desc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-50 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{t('settings.telegram.opt_in_title')}</h4>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      onClick={() => setActiveEditAutomation({ botId: bot.id, type: 'opt-in' })}
                      className="bg-white border border-slate-200 hover:bg-slate-50 px-6 py-2 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm active:scale-98"
                    >
                      {t('settings.telegram.btn_edit')}
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('settings.telegram.opt_in_desc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-50 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{t('settings.telegram.opt_out_title')}</h4>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      onClick={() => setActiveEditAutomation({ botId: bot.id, type: 'opt-out' })}
                      className="bg-white border border-slate-200 hover:bg-slate-50 px-6 py-2 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm active:scale-98"
                    >
                      {t('settings.telegram.btn_edit')}
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('settings.telegram.opt_out_desc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 border-b border-slate-50 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{t('settings.telegram.revoke_title')}</h4>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      onClick={() => {
                        setActiveTokenBot(bot);
                        setNewTokenValue('');
                        setTokenError(null);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-indigo-100 active:scale-98"
                    >
                      {t('settings.telegram.btn_refresh')}
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {t('settings.telegram.revoke_desc')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4 items-center">
                  <div className="md:col-span-3">
                    <h4 className="font-bold text-xs text-rose-600 uppercase tracking-wider">{t('settings.telegram.remove_title')}</h4>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      onClick={() => {
                        setActiveDeleteBot(bot);
                        setDeleteConfirmationName('');
                      }}
                      className="bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-98"
                    >
                      {t('settings.telegram.btn_remove')}
                    </button>
                  </div>
                  <div className="md:col-span-4">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
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
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-xl relative space-y-4 cursor-default"
          >
            <button
              onClick={() => setActiveTokenBot(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">{t('settings.telegram.modal.refresh_title')}</h3>
              <p className="text-xs text-slate-400">
                {t('settings.telegram.modal.refresh_desc', { name: activeTokenBot.name })}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">{t('settings.telegram.modal.token_label')}</label>
              <input
                type="text"
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                value={newTokenValue}
                onChange={(e) => {
                  setNewTokenValue(e.target.value);
                  if (tokenError) setTokenError(null);
                }}
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
              {tokenError && (
                <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                  <AlertCircle size={10} />
                  <span>{tokenError}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setActiveTokenBot(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 transition-all cursor-pointer"
              >
                {t('settings.telegram.modal.btn_cancel')}
              </button>
              <button
                onClick={handleRefreshBotToken}
                disabled={updateBotMutation.isPending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75"
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
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-xl relative space-y-4 cursor-default"
          >
            <button
              onClick={() => setActiveDeleteBot(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="space-y-1">
              <h3 className="font-extrabold text-rose-600 text-base">{t('settings.telegram.modal.remove_title')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('settings.telegram.modal.remove_desc', { name: activeDeleteBot.name })}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500">
                {t('settings.telegram.modal.remove_confirm', { name: activeDeleteBot.name })}
              </label>
              <input
                type="text"
                placeholder={activeDeleteBot.name}
                value={deleteConfirmationName}
                onChange={(e) => setDeleteConfirmationName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 transition-all font-semibold"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setActiveDeleteBot(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 transition-all cursor-pointer"
              >
                {t('settings.telegram.modal.btn_cancel')}
              </button>
              <button
                onClick={handleDeleteBot}
                disabled={
                  deleteBotMutation.isPending ||
                  deleteConfirmationName.trim().toLowerCase() !== activeDeleteBot.name.toLowerCase()
                }
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
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
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-xl relative space-y-4 cursor-default"
          >
            <button
              onClick={() => setActiveEditAutomation(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">
                {t('settings.telegram.modal.edit_opt_title', {
                  type: activeEditAutomation.type === 'opt-in' ? 'Opt-in' : 'Opt-out'
                })}
              </h3>
              <p className="text-xs text-slate-400">
                {t('settings.telegram.modal.edit_opt_desc', {
                  action: activeEditAutomation.type === 'opt-in' 
                    ? t('settings.telegram.modal.subscription') 
                    : t('settings.telegram.modal.unsubscription')
                })}
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('settings.telegram.modal.keywords_label')}</label>
                <div className="flex gap-2 mt-1.5">
                  {(activeEditAutomation.type === 'opt-in' ? ['Start', 'Subscribe'] : ['Stop', 'Unsubscribe']).map(
                    (kw) => (
                      <span
                        key={kw}
                        className="bg-slate-100 border border-slate-200 text-slate-600 text-xs px-2.5 py-0.5 rounded-lg font-bold font-mono"
                      >
                        {kw}
                      </span>
                    )
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  {t('settings.telegram.modal.keywords_desc')}
                </p>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600">{t('settings.telegram.modal.trigger_toggle')}</span>
                <button
                  onClick={() => {
                    const key =
                      activeEditAutomation.type === 'opt-in' ? 'optInEnabled' : 'optOutEnabled';
                    const cur = getBotSettings(activeEditAutomation.botId);
                    updateBotSetting(activeEditAutomation.botId, key, !cur[key]);
                  }}
                  className={`w-9 h-5 rounded-full transition-all relative outline-none cursor-pointer ${
                    getBotSettings(activeEditAutomation.botId)[
                      activeEditAutomation.type === 'opt-in' ? 'optInEnabled' : 'optOutEnabled'
                    ]
                      ? 'bg-sky-500'
                      : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                      getBotSettings(activeEditAutomation.botId)[
                        activeEditAutomation.type === 'opt-in' ? 'optInEnabled' : 'optOutEnabled'
                      ]
                        ? 'translate-x-4'
                        : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowSuccessBanner(
                    t('settings.telegram.modal.success_opt_banner', {
                      type: activeEditAutomation.type === 'opt-in' ? 'Opt-in' : 'Opt-out'
                    })
                  );
                  setActiveEditAutomation(null);
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-indigo-100"
              >
                {t('settings.telegram.modal.btn_close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
