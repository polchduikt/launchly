import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { CalendarClock, Users, Tag, Cpu } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const SchedulerNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isGrayedOut = isConnecting && isSelfSource;
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const frequency = (data?.frequency as string) || (data?.scheduleType as string) || 'daily';
  const time = (data?.time as string) || '00:00';
  const daysOfWeek = (data?.daysOfWeek as string[]) || ['MONDAY'];
  const dayOfMonth = data?.dayOfMonth || 1;
  const intervalValue = data?.intervalValue || 1;
  const intervalUnit = (data?.intervalUnit as string) || 'hours';
  const cronExpression = (data?.cronExpression as string) || '0 0 9 * * *';
  const targetScope = (data?.targetScope as string) || (data?.scope as string) || 'system';
  const targetTag = (data?.targetTag as string) || '';

  const renderScheduleText = () => {
    switch (frequency) {
      case 'daily':
        return `${t('node.scheduler.daily_at', 'Щодня о')} ${time}`;
      case 'weekly': {
        const daysMap: Record<string, string> = {
          MONDAY: t('node.scheduler.day_mon', 'Пн'),
          TUESDAY: t('node.scheduler.day_tue', 'Вт'),
          WEDNESDAY: t('node.scheduler.day_wed', 'Ср'),
          THURSDAY: t('node.scheduler.day_thu', 'Чт'),
          FRIDAY: t('node.scheduler.day_fri', 'Пт'),
          SATURDAY: t('node.scheduler.day_sat', 'Сб'),
          SUNDAY: t('node.scheduler.day_sun', 'Нд'),
        };
        const daysLabel = daysOfWeek.map((d) => daysMap[d.toUpperCase()] || d).join(', ');
        return `${daysLabel || t('node.scheduler.day_mon', 'Пн')} ${t('node.scheduler.at', 'о')} ${time}`;
      }
      case 'monthly':
        return `${dayOfMonth}-${t('node.scheduler.day_of_month', 'го числа о')} ${time}`;
      case 'interval':
        return `${t('node.scheduler.every', 'Кожні')} ${intervalValue} ${
          intervalUnit === 'minutes'
            ? t('node.scheduler.unit_minutes', 'хв.')
            : intervalUnit === 'days'
            ? t('node.scheduler.unit_days', 'дн.')
            : t('node.scheduler.unit_hours', 'год.')
        }`;
      case 'cron':
        return `CRON: ${cronExpression}`;
      default:
        return `${t('node.scheduler.daily_at', 'Щодня о')} ${time}`;
    }
  };

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected
          ? 'shadow-lg ring-2 ring-[#0A0A0A]'
          : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-orange-100/90 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-orange-200/70 text-orange-900 flex items-center justify-center shrink-0">
          <CalendarClock size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-orange-800/80 uppercase tracking-wider block leading-none">
            {t('node.scheduler.category', 'Автоматизація')}
          </span>
          <span className="text-xs font-bold text-orange-950 truncate block mt-0.5">
            {t('node.title.scheduler', 'Планувальник')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-orange-900 truncate select-none">
            {renderScheduleText()}
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#0A0A0A]/60">
                {t('node.scheduler.schedule_label', 'Розклад')}
              </span>
              <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-lg text-xs font-black text-[#0A0A0A]">
                {renderScheduleText()}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#0A0A0A]/10 text-xs font-bold text-[#0A0A0A]">
              <span className="text-[10px] font-black uppercase text-[#0A0A0A]/60">
                {t('node.scheduler.target_label', 'Ціль')}
              </span>
              <div className="flex items-center gap-1">
                {targetScope === 'system' ? (
                  <>
                    <Cpu size={12} className="text-amber-600" />
                    <span>{t('node.scheduler.scope_system', 'Системне виконання')}</span>
                  </>
                ) : targetScope === 'tag' ? (
                  <>
                    <Tag size={12} className="text-indigo-600" />
                    <span>{targetTag || t('node.scheduler.any_tag', 'З тегом')}</span>
                  </>
                ) : (
                  <>
                    <Users size={12} className="text-emerald-700" />
                    <span>{t('node.scheduler.scope_all', 'Всі підписники')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-transparent select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2 select-none">
          {t('flow_builder.next_step')}
        </span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && sourceConns.some((c) => c.sourceHandle === 'next')}
        />
      </div>
    </div>
  );
};

SchedulerNodeInner.displayName = 'SchedulerNode';
export const SchedulerNode = React.memo(SchedulerNodeInner);
