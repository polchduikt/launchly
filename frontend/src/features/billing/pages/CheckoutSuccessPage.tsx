import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';

const CheckoutSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate(ROUTES.HOME);
    }
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl shadow-xl shadow-indigo-100/40 p-8 text-center space-y-6 transform transition-all duration-500 scale-100">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm shadow-emerald-100 animate-bounce">
          <Check size={32} strokeWidth={3} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Subscription Activated!
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Thank you for your purchase. Your payment went through successfully, and your new plan limits are now active.
          </p>
        </div>

        {sessionId && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Transaction ID
            </span>
            <span className="text-xs font-mono text-slate-600 break-all">
              {sessionId}
            </span>
          </div>
        )}

        <button
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-slate-950/10 active:scale-[0.98] cursor-pointer"
        >
          Return to Settings
        </button>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
