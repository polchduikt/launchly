import React, { useState } from 'react';
import { useLogoutMutation } from '../../../../hooks/auth/useLogoutMutation';
import { Loader2 } from 'lucide-react';

export const GeneralPanel: React.FC = () => {
  const [timeZone, setTimeZone] = useState('UTC+07:00');
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="space-y-4 divide-y divide-slate-100">
      <div className="pb-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Часовий пояс акаунту</h3>
        <p className="text-xs text-slate-500">Усі дані в Launchly будуть відображатися та експортуватися відповідно до цього часового поясу.</p>
        <select
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
        >
          <option value="UTC+07:00">(UTC+07:00) - Barnaul Time</option>
          <option value="UTC+03:00">(UTC+03:00) - Kyiv, Moscow Time</option>
          <option value="UTC+00:00">(UTC+00:00) - London, GMT</option>
          <option value="UTC-05:00">(UTC-05:00) - New York, EST</option>
        </select>
      </div>

      <div className="py-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Клонувати в інший акаунт</h3>
        <p className="text-xs text-slate-500">Копіювати весь вміст в інший акаунт</p>
        <button className="w-fit px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all">
          Клонувати цей акаунт
        </button>
      </div>

      <div className="py-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Використовувати як шаблон</h3>
        <p className="text-xs text-slate-500">Створити знімок цього акаунту та поділитися ним за посиланням</p>
        <button className="w-fit px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all">
          Створити шаблон акаунту
        </button>
      </div>

      <div className="py-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Залишити акаунт</h3>
        <p className="text-xs text-slate-500">Передайте право власності іншому члену команди, якщо хочете залишити цей акаунт</p>
        <button className="w-fit px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg border border-slate-200 cursor-not-allowed">
          Вийти з акаунту
        </button>
      </div>

      <div className="py-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Вийти з профілю</h3>
        <p className="text-xs text-slate-500">Вийти з акаунту Launchly на цьому пристрої</p>
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-fit px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {logoutMutation.isPending ? (
            <>
              <Loader2 className="animate-spin" size={12} />
              <span>Вихід...</span>
            </>
          ) : (
            <span>Вийти з профілю</span>
          )}
        </button>
      </div>

      <div className="pt-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-rose-600">Видалити акаунт</h3>
        <p className="text-xs text-slate-500">Продовжити видалення акаунту</p>
        <button className="w-fit px-4 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-lg transition-all">
          Видалити
        </button>
      </div>
    </div>
  );
};

