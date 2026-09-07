import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, Send, CheckCircle2, LogOut, Loader2, Mail } from 'lucide-react';
import { t } from '../../../i18n/config';
import { useAuthStore } from '../../../store/useAuthStore';
import { PublicHeader } from '../../../components/layout/PublicHeader';
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
    } catch (err: unknown) {
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
    <div className="min-h-screen bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] antialiased flex flex-col selection:bg-[#0A0A0A] selection:text-[#F2EBDD]">
      <PublicHeader simple={true} />
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl p-6 sm:p-8 shadow-[10px_10px_0px_#0A0A0A] space-y-6 text-[#0A0A0A]">
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-200 border-2 border-[#0A0A0A] flex items-center justify-center text-rose-700 shadow-[3px_3px_0px_#0A0A0A]">
              <ShieldAlert size={32} />
            </div>
            <h1 className="font-['Anybody',sans-serif] text-2xl font-black uppercase tracking-tight text-[#0A0A0A]">
              {t('blocked.title') !== 'blocked.title' ? t('blocked.title') : 'Account Blocked'}
            </h1>
            <p className="text-xs font-bold text-slate-700 max-w-sm">
              {t('blocked.subtitle') !== 'blocked.subtitle' ? t('blocked.subtitle') : 'Access to your account has been restricted by platform administration.'}
            </p>
          </div>

          <div className="bg-rose-100 border-2 border-[#0A0A0A] rounded-2xl p-4 space-y-1.5 shadow-[3px_3px_0px_#0A0A0A]">
            <div className="font-['Anybody',sans-serif] text-[11px] font-black uppercase tracking-wider text-rose-900">
              {t('blocked.reason_title') !== 'blocked.reason_title' ? t('blocked.reason_title') : 'Reason for blocking:'}
            </div>
            <div className="text-xs font-black text-[#0A0A0A] leading-relaxed">
              {formatReason(rawReason)}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-2">
              <h2 className="font-['Anybody',sans-serif] text-xs font-black uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                <Mail size={15} className="text-[#0A0A0A]" />
                <span>{t('blocked.contact_admin') !== 'blocked.contact_admin' ? t('blocked.contact_admin') : 'Contact Administration'}</span>
              </h2>
            </div>

            {sentSuccess ? (
              <div className="bg-emerald-100 border-2 border-[#0A0A0A] rounded-2xl p-4 flex items-start gap-3 shadow-[3px_3px_0px_#0A0A0A]">
                <CheckCircle2 size={20} className="text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-black text-[#0A0A0A]">
                    {t('blocked.success_msg') !== 'blocked.success_msg' ? t('blocked.success_msg') : 'Appeal successfully submitted! A manager will review it and reply to your email.'}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendAppeal} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-[#0A0A0A] block mb-1">
                      {t('blocked.your_name') !== 'blocked.your_name' ? t('blocked.your_name') : 'Your Name'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('blocked.name_placeholder') !== 'blocked.name_placeholder' ? t('blocked.name_placeholder') : 'John Doe'}
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs text-[#0A0A0A] placeholder-slate-400 focus:outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-[#0A0A0A] block mb-1">
                      {t('blocked.your_email') !== 'blocked.your_email' ? t('blocked.your_email') : 'Your Email'}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs text-[#0A0A0A] placeholder-slate-400 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-[#0A0A0A] block mb-1">
                    {t('blocked.message_label') !== 'blocked.message_label' ? t('blocked.message_label') : 'Message / Appeal'}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('blocked.message_placeholder') !== 'blocked.message_placeholder' ? t('blocked.message_placeholder') : 'Describe your appeal in detail...'}
                    rows={3}
                    required
                    className="w-full p-3.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs text-[#0A0A0A] placeholder-slate-400 focus:outline-none font-bold"
                  />
                </div>

                {errorMsg && (
                  <div className="text-[11px] font-black text-rose-600 uppercase">{errorMsg}</div>
                )}

                <button
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="w-full py-3 px-4 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] rounded-xl text-xs font-black uppercase border-2 border-[#0A0A0A] transition flex items-center justify-center gap-2 shadow-[4px_4px_0px_#0A0A0A] cursor-pointer disabled:opacity-50"
                >
                  {isSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>{t('blocked.submit_btn') !== 'blocked.submit_btn' ? t('blocked.submit_btn') : 'Submit Appeal to Manager'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 border-t-2 border-[#0A0A0A] flex justify-center">
            <button
              onClick={handleLogout}
              className="px-4 py-2 border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-xs font-black uppercase transition-all shadow-[2px_2px_0px_#0A0A0A] cursor-pointer flex items-center gap-2"
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
