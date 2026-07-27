import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Send, CheckCircle2, LogOut, Loader2, Mail } from 'lucide-react';
import { t } from '../../../i18n/config';
import { useAuthStore } from '../../../store/useAuthStore';
import logo from '../../../assets/logo.png';
import axios from 'axios';

export const BlockedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  const rawReason = searchParams.get('code') || searchParams.get('reason') || localStorage.getItem('launchly_block_reason') || 'admin.reason_rules';

  useEffect(() => {
    if (searchParams.get('code') || searchParams.get('reason')) {
      localStorage.setItem('launchly_block_reason', rawReason);
      window.history.replaceState(null, '', '/blocked');
    }
  }, [searchParams, rawReason]);

  const formatReason = (reasonCode: string) => {
    if (!reasonCode) return t('admin.reason_rules') !== 'admin.reason_rules' ? t('admin.reason_rules') : 'Violation of platform rules';
    const lower = reasonCode.toLowerCase();
    if (reasonCode === 'SUSPICIOUS_ACTIVITY' || lower.includes('підозріл') || lower.includes('suspicious')) {
      return t('admin.reason_suspicious') !== 'admin.reason_suspicious' ? t('admin.reason_suspicious') : 'Suspicious activity';
    }
    if (reasonCode === 'VIOLATION_OF_RULES' || lower.includes('порушенн') || lower.includes('violation')) {
      return t('admin.reason_rules') !== 'admin.reason_rules' ? t('admin.reason_rules') : 'Violation of platform rules';
    }
    if (reasonCode === 'SPAM' || lower.includes('спам') || lower.includes('spam')) {
      return t('admin.reason_spam') !== 'admin.reason_spam' ? t('admin.reason_spam') : 'Spam or unauthorized bulk messaging';
    }
    if (reasonCode === 'OTHER' || lower.includes('інша') || lower.includes('other')) {
      return t('admin.reason_other') !== 'admin.reason_other' ? t('admin.reason_other') : 'Other reason';
    }
    return t(reasonCode) !== reasonCode ? t(reasonCode) : reasonCode;
  };

  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setErrorMsg('');
    try {
      await axios.post('/api/v1/support/appeal', {
        email: email || 'user@launchly.ai',
        name: name || 'Blocked User',
        message: message.trim()
      });
      setSentSuccess(true);
      setMessage('');
    } catch (err: any) {
      setErrorMsg('Error sending appeal. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('launchly_block_reason');
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center select-none cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="Launchly Logo" className="h-10 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/register');
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-indigo-100 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
              <ShieldAlert size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">{t('blocked.title') !== 'blocked.title' ? t('blocked.title') : 'Account Blocked'}</h1>
            <p className="text-xs font-medium text-slate-500 max-w-sm">
              {t('blocked.subtitle') !== 'blocked.subtitle' ? t('blocked.subtitle') : 'Access to your account has been restricted by platform administration.'}
            </p>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-1.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700">{t('blocked.reason_title') !== 'blocked.reason_title' ? t('blocked.reason_title') : 'Reason for blocking:'}</div>
            <div className="text-xs font-semibold text-rose-900 leading-relaxed">
              {formatReason(rawReason)}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Mail size={15} className="text-indigo-600" />
                <span>{t('blocked.contact_admin') !== 'blocked.contact_admin' ? t('blocked.contact_admin') : 'Contact Administration'}</span>
              </h2>
            </div>

            {sentSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-900">{t('blocked.success_msg') !== 'blocked.success_msg' ? t('blocked.success_msg') : 'Appeal successfully submitted! A manager will review it and reply to your email.'}</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendAppeal} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('blocked.your_name') !== 'blocked.your_name' ? t('blocked.your_name') : 'Your Name'}</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('blocked.name_placeholder') !== 'blocked.name_placeholder' ? t('blocked.name_placeholder') : 'John Doe'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('blocked.your_email') !== 'blocked.your_email' ? t('blocked.your_email') : 'Your Email'}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">{t('blocked.message_label') !== 'blocked.message_label' ? t('blocked.message_label') : 'Message / Appeal'}</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('blocked.message_placeholder') !== 'blocked.message_placeholder' ? t('blocked.message_placeholder') : 'Describe your appeal in detail...'}
                    rows={3}
                    required
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                {errorMsg && (
                  <div className="text-[11px] font-semibold text-rose-600">{errorMsg}</div>
                )}

                <button
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>{t('blocked.submit_btn') !== 'blocked.submit_btn' ? t('blocked.submit_btn') : 'Submit Appeal to Manager'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              <LogOut size={15} />
              <span>{t('blocked.back_to_login') !== 'blocked.back_to_login' ? t('blocked.back_to_login') : 'Return to Sign In'}</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default BlockedPage;
