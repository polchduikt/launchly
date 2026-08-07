import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Home } from 'lucide-react';
import { ROUTES } from '../../../routes/paths';
import { t } from '../../../i18n/config';

const CheckoutCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F2EBDD] flex items-center justify-center p-6 font-['JetBrains_Mono',monospace]">
      <div className="max-w-lg w-full bg-[#F2EBDD] border-4 border-[#0A0A0A] shadow-[12px_12px_0px_#0A0A0A] rounded-3xl p-8 text-center space-y-6 text-[#0A0A0A]">
        
        <div className="w-16 h-16 bg-rose-300 text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#0A0A0A]">
          <X size={32} strokeWidth={3} />
        </div>

        <div className="space-y-3">
          <h1 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase tracking-tight">
            {t('checkout.cancel.title', 'Оплату скасовано')}
          </h1>
          <p className="text-xs text-slate-700 font-bold leading-relaxed">
            {t(
              'checkout.cancel.desc',
              'Транзакцію було скасовано або не вдалося обробити. Списання коштів з вашого рахунку не відбулося.'
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => navigate(ROUTES.SETTINGS)}
            className="w-full py-3.5 px-6 bg-amber-400 hover:bg-amber-500 text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t('checkout.cancel.btn_retry', 'Спробувати знову в налаштуваннях')}</span>
            <ArrowRight size={16} />
          </button>
          
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="w-full py-3.5 px-6 bg-white hover:bg-slate-100 text-[#0A0A0A] border-2 border-[#0A0A0A] text-xs font-extrabold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Home size={15} />
            <span>{t('checkout.cancel.btn_dashboard', 'Перейти на головну панель')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancelPage;
