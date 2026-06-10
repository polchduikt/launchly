import React, { useState } from 'react';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [timeZone, setTimeZone] = useState('UTC+07:00');

  const sidebarSections = [
    {
      title: 'Main',
      items: [
        { id: 'general', label: 'General' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'members', label: 'Team Members' },
        { id: 'logs', label: 'Logs' },
        { id: 'display', label: 'Display' },
      ],
    },
    {
      title: 'Billing',
      items: [
        { id: 'subscriptions', label: 'Subscriptions' },
        { id: 'invoices', label: 'Invoices' },
        { id: 'payment', label: 'Payment Details' },
      ],
    },
    {
      title: 'Inbox',
      items: [
        { id: 'live-chat', label: 'Live Chat Behavior' },
        { id: 'assignment', label: 'Auto-Assignment' },
      ],
    },
    {
      title: 'Channels',
      items: [
        { id: 'instagram', label: 'Instagram' },
        { id: 'whatsapp', label: 'WhatsApp' },
        { id: 'messenger', label: 'Facebook Messenger' },
        { id: 'sms', label: 'SMS' },
        { id: 'email', label: 'Email' },
        { id: 'telegram', label: 'Telegram' },
      ],
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-screen bg-slate-50 font-sans">
        <aside className="w-60 bg-slate-50 border-r border-slate-200 p-4 shrink-0 hidden md:block overflow-y-auto max-h-screen pb-20">
          <div className="space-y-6">
            {sidebarSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 select-none">
                  {section.title}
                </h3>
                <nav className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all ${
                        activeTab === item.id
                          ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm divide-y divide-slate-100 overflow-hidden">
            {activeTab === 'general' ? (
              <>
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                  <div className="w-full md:w-1/3">
                    <h3 className="font-bold text-sm text-slate-800">Account Time Zone</h3>
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="w-full md:max-w-md px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all bg-slate-50/50"
                    >
                      <option value="UTC+07:00">(UTC+07:00) - Barnaul Time</option>
                      <option value="UTC+03:00">(UTC+03:00) - Kyiv, Moscow Time</option>
                      <option value="UTC+00:00">(UTC+00:00) - London, GMT</option>
                      <option value="UTC-05:00">(UTC-05:00) - New York, EST</option>
                    </select>
                    <div className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                      All the data in Manychat will be displayed and exported according to this timezone.{' '}
                      <button className="text-indigo-600 font-bold hover:underline">Learn more</button>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                  <div className="w-full md:w-1/3">
                    <h3 className="font-bold text-sm text-slate-800">Clone to Another Account</h3>
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100">
                      Clone This Account
                    </button>
                    <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                      Copy all content to another account
                    </p>
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                  <div className="w-full md:w-1/3">
                    <h3 className="font-bold text-sm text-slate-800">Use as Template</h3>
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100">
                      Create Account Template
                    </button>
                    <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                      Create a snapshot of this account and share it via link
                    </p>
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                  <div className="w-full md:w-1/3">
                    <h3 className="font-bold text-sm text-slate-800">Leave Account</h3>
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                    <button className="px-5 py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl transition-all select-none cursor-not-allowed border border-slate-200">
                      Leave
                    </button>
                    <p className="text-xs text-slate-450 leading-relaxed md:max-w-xs">
                      Transfer your ownership to another team member if you want to leave this account
                    </p>
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                  <div className="w-full md:w-1/3">
                    <h3 className="font-bold text-sm text-rose-600">Delete Account</h3>
                  </div>
                  <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                    <button className="px-5 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer">
                      Delete
                    </button>
                    <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                      Continue to account deletion
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-sm text-slate-400">
                This section is currently under development. Settings will be linked here soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
