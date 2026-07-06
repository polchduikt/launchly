import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export const NotificationsPanel: React.FC = () => {
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyTelegram, setNotifyTelegram] = useState(false);

  const [desktopMsgAssigned, setDesktopMsgAssigned] = useState(false);
  const [desktopNewUnassigned, setDesktopNewUnassigned] = useState(false);
  const [desktopAssignedToMe, setDesktopAssignedToMe] = useState(false);

  const [channelAssignedToMe, setChannelAssignedToMe] = useState(true);

  const [emailInput, setEmailInput] = useState('brawl1267@gmail.com');
  const [isTelegramSubscribed, setIsTelegramSubscribed] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const showBanner = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  const handleUpdateEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    showBanner('Email notification address successfully updated!');
  };

  const handleTelegramSubscribe = () => {
    setIsTelegramSubscribed(!isTelegramSubscribed);
    showBanner(
      !isTelegramSubscribed
        ? 'Successfully subscribed to Telegram notifications!'
        : 'Successfully unsubscribed from Telegram notifications.'
    );
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-2xl text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          {successMsg}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm divide-y divide-slate-100 overflow-hidden text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>'Notify Assignees' Action</span>
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
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Email</span>
            </label>
            <label className="flex items-center gap-3 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={notifyTelegram}
                onChange={(e) => setNotifyTelegram(e.target.checked)}
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
                    onChange={(e) => setDesktopMsgAssigned(e.target.checked)}
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
                    onChange={(e) => setDesktopNewUnassigned(e.target.checked)}
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
                    onChange={(e) => setDesktopAssignedToMe(e.target.checked)}
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
                  onChange={(e) => setChannelAssignedToMe(e.target.checked)}
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
            <button
              onClick={handleTelegramSubscribe}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm select-none w-64 ${
                isTelegramSubscribed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isTelegramSubscribed ? 'Subscribed' : 'Subscribe With Telegram'}
            </button>
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
    </div>
  );
};
