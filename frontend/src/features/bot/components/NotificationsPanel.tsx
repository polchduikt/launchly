import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { updateNotificationsApi, unlinkTelegramApi } from '../../auth/api/auth';
import { TelegramLoginModal } from '../../auth/components/TelegramLoginModal';

export const NotificationsPanel: React.FC = () => {
  const { user, setUser } = useAuthStore();

  const [notifyEmail, setNotifyEmail] = useState(user?.notifyEmail ?? true);
  const [notifyTelegram, setNotifyTelegram] = useState(user?.notifyTelegram ?? false);

  const [statsNotificationsEnabled, setStatsNotificationsEnabled] = useState(user?.statsNotificationsEnabled ?? false);
  const [statsDayOfWeek, setStatsDayOfWeek] = useState(user?.statsDayOfWeek ?? 'SATURDAY');
  const [statsHour, setStatsHour] = useState(user?.statsHour ?? 10);
  const [statsDaysRange, setStatsDaysRange] = useState(user?.statsDaysRange ?? 5);
  const [statsNotifyEmail, setStatsNotifyEmail] = useState(user?.statsNotifyEmail ?? true);
  const [statsNotifyTelegram, setStatsNotifyTelegram] = useState(user?.statsNotifyTelegram ?? false);

  const [desktopMsgAssigned, setDesktopMsgAssigned] = useState(() => localStorage.getItem('desktopMsgAssigned') === 'true');
  const [desktopNewUnassigned, setDesktopNewUnassigned] = useState(() => localStorage.getItem('desktopNewUnassigned') === 'true');
  const [desktopAssignedToMe, setDesktopAssignedToMe] = useState(() => localStorage.getItem('desktopAssignedToMe') === 'true');

  const [channelAssignedToMe, setChannelAssignedToMe] = useState(() => localStorage.getItem('channelAssignedToMe') !== 'false');

  const [emailInput, setEmailInput] = useState(user?.notificationEmail || user?.email || '');
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleToggleDesktopMsgAssigned = (val: boolean) => {
    setDesktopMsgAssigned(val);
    localStorage.setItem('desktopMsgAssigned', String(val));
  };

  const handleToggleDesktopNewUnassigned = (val: boolean) => {
    setDesktopNewUnassigned(val);
    localStorage.setItem('desktopNewUnassigned', String(val));
  };

  const handleToggleDesktopAssignedToMe = (val: boolean) => {
    setDesktopAssignedToMe(val);
    localStorage.setItem('desktopAssignedToMe', String(val));
  };

  const handleToggleChannelAssignedToMe = (val: boolean) => {
    setChannelAssignedToMe(val);
    localStorage.setItem('channelAssignedToMe', String(val));
  };

  const showBanner = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  const saveSettings = async (overrides: Partial<{
    notifyEmail: boolean;
    notifyTelegram: boolean;
    notificationEmail: string | null;
    statsNotificationsEnabled: boolean;
    statsDayOfWeek: string;
    statsHour: number;
    statsDaysRange: number;
    statsNotifyEmail: boolean;
    statsNotifyTelegram: boolean;
  }>) => {
    const payload = {
      notifyEmail: overrides.notifyEmail !== undefined ? overrides.notifyEmail : notifyEmail,
      notifyTelegram: overrides.notifyTelegram !== undefined ? overrides.notifyTelegram : notifyTelegram,
      notificationEmail: overrides.notificationEmail !== undefined ? overrides.notificationEmail : (emailInput || null),
      statsNotificationsEnabled: overrides.statsNotificationsEnabled !== undefined ? overrides.statsNotificationsEnabled : statsNotificationsEnabled,
      statsDayOfWeek: overrides.statsDayOfWeek !== undefined ? overrides.statsDayOfWeek : statsDayOfWeek,
      statsHour: overrides.statsHour !== undefined ? overrides.statsHour : statsHour,
      statsDaysRange: overrides.statsDaysRange !== undefined ? overrides.statsDaysRange : statsDaysRange,
      statsNotifyEmail: overrides.statsNotifyEmail !== undefined ? overrides.statsNotifyEmail : statsNotifyEmail,
      statsNotifyTelegram: overrides.statsNotifyTelegram !== undefined ? overrides.statsNotifyTelegram : statsNotifyTelegram,
    };
    try {
      const updatedUser = await updateNotificationsApi(payload);
      setUser(updatedUser);
      if (overrides.notifyEmail !== undefined) setNotifyEmail(overrides.notifyEmail);
      if (overrides.notifyTelegram !== undefined) setNotifyTelegram(overrides.notifyTelegram);
      if (overrides.statsNotificationsEnabled !== undefined) setStatsNotificationsEnabled(overrides.statsNotificationsEnabled);
      if (overrides.statsDayOfWeek !== undefined) setStatsDayOfWeek(overrides.statsDayOfWeek);
      if (overrides.statsHour !== undefined) setStatsHour(overrides.statsHour);
      if (overrides.statsDaysRange !== undefined) setStatsDaysRange(overrides.statsDaysRange);
      if (overrides.statsNotifyEmail !== undefined) setStatsNotifyEmail(overrides.statsNotifyEmail);
      if (overrides.statsNotifyTelegram !== undefined) setStatsNotifyTelegram(overrides.statsNotifyTelegram);
      showBanner("Settings updated successfully!");
    } catch (err) {
      console.error('Failed to update notifications settings', err);
    }
  };

  const handleToggleEmail = async (val: boolean) => {
    await saveSettings({ notifyEmail: val });
  };

  const handleToggleTelegram = async (val: boolean) => {
    if (val && !user?.telegramUserId) {
      setIsTelegramModalOpen(true);
      return;
    }
    await saveSettings({ notifyTelegram: val });
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    await saveSettings({ notificationEmail: emailInput });
  };

  const handleUnsubscribeTelegram = async () => {
    try {
      await unlinkTelegramApi();
      if (user) {
        const updatedUser = {
          ...user,
          telegramUserId: null,
          telegramUsername: null,
          telegramName: null,
          telegramPhotoUrl: null,
          notifyTelegram: false,
          statsNotifyTelegram: false
        };
        setUser(updatedUser);
        setNotifyTelegram(false);
        setStatsNotifyTelegram(false);
        showBanner('Successfully unsubscribed from Telegram notifications.');
      }
    } catch (err) {
      console.error('Failed to unsubscribe Telegram', err);
    }
  };

  const isTelegramSubscribed = !!user?.telegramUserId;

  return (
    <div className="space-y-6 pb-10">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-2xl text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {successMsg}
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm divide-y divide-slate-100 overflow-hidden text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Notify Assignees Action</span>
              <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                PRO
              </span>
            </h3>
          </div>
          <div className="lg:col-span-5 space-y-3">
            <label className="flex items-center gap-3 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => handleToggleEmail(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Email</span>
            </label>
            <label className="flex items-center gap-3 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={notifyTelegram}
                onChange={(e) => handleToggleTelegram(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">Telegram</span>
                <HelpCircle size={13} className="text-slate-400 cursor-help" title="Receive alerts on your Telegram account" />
              </div>
            </label>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Enable to let Launchly send you notifications when a contact performs a specific action in your broadcasts, welcome messages, opt-in messages, etc.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Scheduled Statistics Report</span>
            </h3>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <label className="flex items-center gap-3 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={statsNotificationsEnabled}
                onChange={(e) => saveSettings({ statsNotificationsEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Enable scheduled statistics report</span>
            </label>

            {statsNotificationsEnabled && (
              <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Frequency</label>
                    <select
                      value={statsDayOfWeek}
                      onChange={(e) => saveSettings({ statsDayOfWeek: e.target.value })}
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="DAILY">Daily</option>
                      <option value="MONDAY">Every Monday</option>
                      <option value="TUESDAY">Every Tuesday</option>
                      <option value="WEDNESDAY">Every Wednesday</option>
                      <option value="THURSDAY">Every Thursday</option>
                      <option value="FRIDAY">Every Friday</option>
                      <option value="SATURDAY">Every Saturday</option>
                      <option value="SUNDAY">Every Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Time of day</label>
                    <select
                      value={statsHour}
                      onChange={(e) => saveSettings({ statsHour: parseInt(e.target.value) })}
                      className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i}>
                          {i < 10 ? `0${i}` : i}:00
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                    Data Range: {statsDaysRange} days
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={statsDaysRange}
                      onChange={(e) => setStatsDaysRange(parseInt(e.target.value))}
                      onMouseUp={() => saveSettings({ statsDaysRange })}
                      onTouchEnd={() => saveSettings({ statsDaysRange })}
                      className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600 shrink-0 min-w-[24px] text-right">{statsDaysRange}d</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Send via</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statsNotifyEmail}
                        onChange={(e) => saveSettings({ statsNotifyEmail: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-600">Email</span>
                    </label>

                    <label className="flex items-center gap-2 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={statsNotifyTelegram}
                        onChange={(e) => {
                          if (e.target.checked && !user?.telegramUserId) {
                            setIsTelegramModalOpen(true);
                            return;
                          }
                          saveSettings({ statsNotifyTelegram: e.target.checked });
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-600">Telegram</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="lg:col-span-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Configure automatic statistics reports containing your subscribers growth, active users, click metrics, top buttons clicked, and automation status, sent directly to your channels.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm divide-y divide-slate-100 overflow-hidden text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800">
              Inbox Desktop Notifications
            </h3>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                Notify me when
              </p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={desktopMsgAssigned}
                    onChange={(e) => handleToggleDesktopMsgAssigned(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 leading-normal">
                    I get a new message from a conversation assigned to me
                  </span>
                </label>
                <label className="flex items-start gap-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={desktopNewUnassigned}
                    onChange={(e) => handleToggleDesktopNewUnassigned(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 leading-normal">
                    There is a new conversation in unassigned folder
                  </span>
                </label>
                <label className="flex items-start gap-3 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={desktopAssignedToMe}
                    onChange={(e) => handleToggleDesktopAssignedToMe(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 leading-normal">
                    A conversation is assigned to me
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Enable instant popup notifications on your desktop about new messages and assigned conversations. If you don't see the notifications, check your system settings if notifications are on.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm divide-y divide-slate-100 overflow-hidden text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800">
              Inbox Channel Notifications
            </h3>
          </div>
          <div className="lg:col-span-5 space-y-4">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                Notify me when
              </p>
              <label className="flex items-start gap-3 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={channelAssignedToMe}
                  onChange={(e) => handleToggleChannelAssignedToMe(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700 leading-normal">
                  A conversation is assigned to me
                </span>
              </label>
            </div>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Inbox notifications help you support your audience and track leads across the connected channels below, like Email and Telegram.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm divide-y divide-slate-100 overflow-hidden text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-center">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800">
              My Telegram for Notifications
            </h3>
          </div>
          <div className="lg:col-span-5">
            {isTelegramSubscribed ? (
              <div className="flex items-center justify-between w-full max-w-md">
                <div className="flex items-center gap-3">
                  {user?.telegramPhotoUrl ? (
                    <img src={user.telegramPhotoUrl} alt={user.telegramName || 'Telegram User'} className="w-10 h-10 rounded-full object-cover border border-slate-100 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-bold text-sm shrink-0">
                      {user?.telegramName ? user.telegramName.charAt(0).toUpperCase() : 'T'}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs text-slate-800 leading-none mb-1">{user?.telegramName || 'Telegram User'}</span>
                    <span className="text-[10px] text-slate-400">@{user?.telegramUsername || 'unknown'}</span>
                  </div>
                </div>
                <button
                  onClick={handleUnsubscribeTelegram}
                  className="px-5 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer animate-in fade-in duration-200"
                >
                  Unsubscribe
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsTelegramModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-sm select-none w-64 animate-in fade-in duration-200"
              >
                Subscribe With Telegram
              </button>
            )}
          </div>
          <div className="lg:col-span-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Opt-in to our bot to be able to receive bot notifications in Telegram.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-center">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800">
              My Email for Notifications
            </h3>
          </div>
          <div className="lg:col-span-5">
            <form onSubmit={handleUpdateEmail} className="flex gap-2 w-64">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter email"
                className="flex-1 px-4 py-2 border border-slate-200 focus:outline-none focus:border-indigo-500 rounded-xl text-xs font-semibold bg-slate-50/20"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
              >
                Update
              </button>
            </form>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Setup a custom email address where you would like to receive administrative and flow notification alerts.
            </p>
          </div>
        </div>
      </div>

      <TelegramLoginModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        isSubscription={true}
        onSuccess={() => {
          setNotifyTelegram(true);
          showBanner('Successfully subscribed to Telegram notifications!');
        }}
      />
    </div>
  );
};
