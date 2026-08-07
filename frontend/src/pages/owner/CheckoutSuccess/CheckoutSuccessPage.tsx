import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../../routes/paths';
import { useConfirmSessionMutation } from '../../../hooks/bot/useBillingQueries';
import { t } from '../../../i18n/config';

const CheckoutSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const confirmMutation = useConfirmSessionMutation();

  useEffect(() => {
    if (!sessionId) {
      navigate(ROUTES.HOME);
      return;
    }

    confirmMutation.mutate(sessionId);
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-[#F2EBDD] flex items-center justify-center p-6 font-['JetBrains_Mono',monospace]">
      <div className="max-w-lg w-full bg-[#F2EBDD] border-4 border-[#0A0A0A] shadow-[12px_12px_0px_#0A0A0A] rounded-3xl p-8 text-center space-y-6 text-[#0A0A0A]">
        
        <div className="w-16 h-16 bg-emerald-400 text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#0A0A0A]">
          <Check size={32} strokeWidth={3} />
        </div>

        <div className="space-y-3">
          <h1 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase tracking-tight">
            {t('checkout.success.title', 'Підписку Успішно Активовано!')}
          </h1>
          <p className="text-xs text-slate-700 font-bold leading-relaxed">
            {t(
              'checkout.success.desc',
              'Дякуємо за покупку. Ваш платіж пройшов успішно, а нові ліміти та розширений функціонал тарифу вже активовані.'
            )}
          </p>
        </div>

        {confirmMutation.isPending && (
          <div className="bg-amber-100 border-2 border-[#0A0A0A] rounded-2xl p-3 flex items-center justify-center gap-2 text-xs font-black">
            <Loader2 size={16} className="animate-spin text-[#0A0A0A]" />
            <span>{t('checkout.success.activating', 'Синхронізація підписки...')}</span>
          </div>
        )}

        {sessionId && (
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-4 text-left space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              {t('checkout.success.transaction_id', 'ID ТРАНЗАКЦІЇ STRIPE')}
            </span>
            <span className="text-[11px] font-bold text-[#0A0A0A] break-all select-all font-mono">
              {sessionId}
            </span>
          </div>
        )}

        <button
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="w-full py-3.5 px-6 bg-emerald-400 hover:bg-emerald-500 text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{t('checkout.success.btn_settings', 'Повернутися до налаштувань')}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
