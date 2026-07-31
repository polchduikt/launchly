import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { ROUTES } from '../../../routes/paths';

const CheckoutCancelPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl shadow-xl shadow-rose-100/40 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm shadow-rose-100 animate-pulse">
          <X size={32} strokeWidth={3} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Checkout Cancelled
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The transaction was cancelled or could not be processed. No charges were made to your account.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(ROUTES.SETTINGS)}
            className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-slate-950/10 active:scale-[0.98] cursor-pointer"
          >
            Try Again in Settings
          </button>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="w-full py-3 px-6 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancelPage;
