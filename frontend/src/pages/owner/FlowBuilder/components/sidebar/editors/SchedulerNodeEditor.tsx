import React from 'react';
import type { SchedulerNodeEditorProps } from '../../../../../../types/bot';
import { CustomSelect } from '../../../../../../components/ui/CustomSelect';
import { useBotStore } from '../../../../../../store/useBotStore';
import { useTagsQuery } from '../../../../../../hooks/broadcast/useBroadcastQueries';
import { Users, Tag, Cpu } from 'lucide-react';
import { t } from '../../../../../../i18n/config';

interface EditorStateLocal {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}

const DAYS_OF_WEEK = [
  { id: 'MONDAY', label: 'Пн' },
  { id: 'TUESDAY', label: 'Вт' },
  { id: 'WEDNESDAY', label: 'Ср' },
  { id: 'THURSDAY', label: 'Чт' },
  { id: 'FRIDAY', label: 'Пт' },
  { id: 'SATURDAY', label: 'Сб' },
  { id: 'SUNDAY', label: 'Нд' },
];

export const SchedulerNodeEditor: React.FC<SchedulerNodeEditorProps> = ({
  data,
  handleChange,
  editorState,
}) => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: tags = [] } = useTagsQuery(activeBotId || 0);

  const frequency = (data?.frequency as string) || (data?.scheduleType as string) || 'daily';
  const time = (data?.time as string) || '00:00';
  const daysOfWeek = (data?.daysOfWeek as string[]) || ['MONDAY'];
  const dayOfMonth = typeof data?.dayOfMonth === 'number' ? data.dayOfMonth : 1;
  const intervalValue = typeof data?.intervalValue === 'number' ? data.intervalValue : 1;
  const intervalUnit = (data?.intervalUnit as string) || 'hours';
  const cronExpression = (data?.cronExpression as string) || '0 0 9 * * *';
  const targetScope = (data?.targetScope as string) || (data?.scope as string) || 'system';
  const targetTag = (data?.targetTag as string) || '';
  const [hours = '00', minutes = '00'] = (time || '00:00').split(':');

  React.useEffect(() => {
    if (!data?.timezone || data.timezone === 'UTC') {
      handleChange('timezone', 'Europe/Kyiv');
    }
  }, [data?.timezone]);

  const HOURS_OPTIONS = Array.from({ length: 24 }, (_, i) => {
    const val = String(i).padStart(2, '0');
    return { value: val, label: `${val}` };
  });

  const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, i) => {
    const val = String(i).padStart(2, '0');
    return { value: val, label: `${val}` };
  });

  const handleHourChange = (newHour: string) => {
    handleChange('time', `${newHour}:${minutes}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    handleChange('time', `${hours}:${newMinute}`);
  };

  const renderTimePicker = () => (
    <div>
      <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
        {t('editor.scheduler.time_label', 'Час запуску')}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <CustomSelect
            value={hours}
            onChange={handleHourChange}
            options={HOURS_OPTIONS}
            buttonClassName="w-full px-3 py-2 rounded-xl border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] bg-white flex items-center justify-between transition-all cursor-pointer hover:bg-[#F2EBDD]/30"
          />
        </div>
        <span className="text-sm font-black text-[#0A0A0A]">:</span>
        <div className="flex-1">
          <CustomSelect
            value={minutes}
            onChange={handleMinuteChange}
            options={MINUTES_OPTIONS}
            buttonClassName="w-full px-3 py-2 rounded-xl border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] bg-white flex items-center justify-between transition-all cursor-pointer hover:bg-[#F2EBDD]/30"
          />
        </div>
      </div>
    </div>
  );

  const frequencyOptions = [
    { value: 'daily', label: t('editor.scheduler.freq_daily', 'Щодня') },
    { value: 'weekly', label: t('editor.scheduler.freq_weekly', 'Щотижня') },
    { value: 'monthly', label: t('editor.scheduler.freq_monthly', 'Щомісяця') },
    { value: 'interval', label: t('editor.scheduler.freq_interval', 'Інтервал') },
    { value: 'cron', label: t('editor.scheduler.freq_cron', 'CRON-вираз') },
  ];

  const intervalUnitOptions = [
    { value: 'minutes', label: t('editor.scheduler.unit_minutes', 'Хвилини') },
    { value: 'hours', label: t('editor.scheduler.unit_hours', 'Години') },
    { value: 'days', label: t('editor.scheduler.unit_days', 'Дні') },
  ];

  const toggleDayOfWeek = (dayId: string) => {
    let newDays: string[];
    if (daysOfWeek.includes(dayId)) {
      newDays = daysOfWeek.filter((d) => d !== dayId);
      if (newDays.length === 0) newDays = [dayId];
    } else {
      newDays = [...daysOfWeek, dayId];
    }
    handleChange('daysOfWeek', newDays);
  };

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('editor.scheduler.frequency_label', 'Періодичність')}
        </label>
        <CustomSelect
          value={frequency}
          onChange={(val) => handleChange('frequency', val)}
          options={frequencyOptions}
          buttonClassName="w-full px-3 py-2 rounded-xl border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] bg-white flex items-center justify-between transition-all cursor-pointer hover:bg-[#F2EBDD]/30"
        />
      </div>

      {frequency === 'daily' && renderTimePicker()}

      {frequency === 'weekly' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
              {t('editor.scheduler.days_label', 'Дні тижня')}
            </label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = daysOfWeek.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDayOfWeek(d.id)}
                    className={`py-2 text-center text-xs font-black rounded-lg border-2 border-[#0A0A0A] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0A0A0A] text-white shadow-sm'
                        : 'bg-white text-[#0A0A0A] hover:bg-slate-100'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {renderTimePicker()}
        </div>
      )}

      {frequency === 'monthly' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
              {t('editor.scheduler.day_of_month_label', 'День місяця (1-31)')}
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => handleChange('dayOfMonth', Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
              className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] focus:outline-none"
            />
          </div>

          {renderTimePicker()}
        </div>
      )}

      {frequency === 'interval' && (
        <div>
          <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
            {t('editor.scheduler.interval_label', 'Інтервал повторення')}
          </label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                value={intervalValue}
                onChange={(e) => handleChange('intervalValue', Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] focus:outline-none"
              />
            </div>
            <div className="w-32">
              <CustomSelect
                value={intervalUnit}
                onChange={(val) => handleChange('intervalUnit', val)}
                options={intervalUnitOptions}
                buttonClassName="w-full px-3 py-2 rounded-xl border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] bg-white flex items-center justify-between transition-all cursor-pointer hover:bg-[#F2EBDD]/30"
              />
            </div>
          </div>
        </div>
      )}

      {frequency === 'cron' && (
        <div>
          <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
            {t('editor.scheduler.cron_label', 'CRON-вираз')}
          </label>
          <input
            type="text"
            value={cronExpression}
            onChange={(e) => handleChange('cronExpression', e.target.value)}
            placeholder="0 0 9 * * *"
            className="w-full px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] placeholder:text-slate-400 focus:outline-none"
          />
          <span className="block text-[10px] text-slate-500 font-bold mt-1">
            {t('editor.scheduler.cron_hint', 'Формат: сек хв год день місяць день_тижня')}
          </span>
        </div>
      )}

      <div className="pt-2 border-t border-[#0A0A0A]/10">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-2">
          {t('editor.scheduler.target_scope_label', 'Цільова аудиторія для запуску')}
        </label>
        <div className="space-y-2">
          <label
            onClick={() => handleChange('targetScope', 'all')}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all ${
              targetScope === 'all'
                ? 'bg-[#0A0A0A] text-white shadow-sm'
                : 'bg-white text-[#0A0A0A] hover:bg-slate-50'
            }`}
          >
            <Users size={14} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black block leading-none">
                {t('editor.scheduler.scope_all', 'Усі підписники бота')}
              </span>
              <span className={`text-[10px] block mt-0.5 ${targetScope === 'all' ? 'text-white/70' : 'text-slate-500'}`}>
                {t('editor.scheduler.scope_all_desc', 'Флоу запускається окремо для кожного користувача')}
              </span>
            </div>
          </label>

          <label
            onClick={() => handleChange('targetScope', 'tag')}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all ${
              targetScope === 'tag'
                ? 'bg-[#0A0A0A] text-white shadow-sm'
                : 'bg-white text-[#0A0A0A] hover:bg-slate-50'
            }`}
          >
            <Tag size={14} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black block leading-none">
                {t('editor.scheduler.scope_tag', 'Користувачі з тегом')}
              </span>
              <span className={`text-[10px] block mt-0.5 ${targetScope === 'tag' ? 'text-white/70' : 'text-slate-500'}`}>
                {t('editor.scheduler.scope_tag_desc', 'Тільки для сегменту користувачів')}
              </span>
            </div>
          </label>

          {targetScope === 'tag' && (
            <div className="pl-6 pt-1 animate-in fade-in duration-150">
              <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1">
                {t('editor.scheduler.select_tag', 'Оберіть тег')}
              </label>
              <CustomSelect
                value={targetTag}
                onChange={(val) => handleChange('targetTag', val)}
                options={tags.map((t) => ({ value: t.name, label: t.name }))}
                buttonClassName="w-full px-3 py-2 rounded-xl border-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] bg-white flex items-center justify-between transition-all cursor-pointer hover:bg-[#F2EBDD]/30"
              />
            </div>
          )}

          <label
            onClick={() => handleChange('targetScope', 'system')}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 border-[#0A0A0A] cursor-pointer transition-all ${
              targetScope === 'system'
                ? 'bg-[#0A0A0A] text-white shadow-sm'
                : 'bg-white text-[#0A0A0A] hover:bg-slate-50'
            }`}
          >
            <Cpu size={14} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black block leading-none">
                {t('editor.scheduler.scope_system', 'Системне виконання')}
              </span>
              <span className={`text-[10px] block mt-0.5 ${targetScope === 'system' ? 'text-white/70' : 'text-slate-500'}`}>
                {t('editor.scheduler.scope_system_desc', 'Для скидання лідерборду, полів або API запитів')}
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (editorState) {
              (editorState as EditorStateLocal).setNextStepSourceHandle('next');
              (editorState as EditorStateLocal).setIsNextStepDrawerOpen(true);
            }
          }}
          className="w-full py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] border-2 border-[#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer text-center select-none shadow-[2px_2px_0px_0px_#0A0A0A] hover:shadow-none"
        >
          {t('editor.scheduler.choose_next_step', 'Обрати наступний крок')}
        </button>
      </div>
    </div>
  );
};
