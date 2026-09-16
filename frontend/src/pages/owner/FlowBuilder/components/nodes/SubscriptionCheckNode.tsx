import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { ShieldCheck } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData, TelegramChannelCheckItem } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t, getLanguage } from '../../../../../i18n/config';

const SubscriptionCheckNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isReplyHandle = useConnection((s) => s.fromHandle?.id === 'reply');
  const isGrayedOut = isConnecting && (isSelfSource || isReplyHandle);
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const rawChannels = data?.channels;
  const channels: TelegramChannelCheckItem[] = Array.isArray(rawChannels) && rawChannels.length > 0
    ? rawChannels
    : (data?.channelId || data?.channel
        ? [{ id: 'ch_0', channelId: String(data.channelId || data.channel), name: String(data.channelName || ''), isRequired: true }]
        : []);

  const mode = (data?.mode as string) || 'all';
  const isSubscribedConnected = data?._tempSourceHandle !== 'subscribed' && sourceConns.some((c) => c.sourceHandle === 'subscribed' || c.sourceHandle === 'true' || c.sourceHandle === 'yes');
  const isNotSubscribedConnected = data?._tempSourceHandle !== 'not_subscribed' && sourceConns.some((c) => c.sourceHandle === 'not_subscribed' || c.sourceHandle === 'false' || c.sourceHandle === 'no');

  const lang = getLanguage();
  const channelsCountLabel = channels.length === 1
    ? (lang === 'en' ? '1 channel' : '1 канал')
    : `${channels.length} ${lang === 'en' ? 'channels' : 'канали'}`;

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected ? 'shadow-lg ring-2 ring-[#0A0A0A]' : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-[#DCFCE7]/90 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-green-200 text-green-800 flex items-center justify-center shrink-0 shadow-sm">
          <ShieldCheck size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-green-800/80 uppercase tracking-wider block leading-none">
            {t('node.subscription_check.category', 'Перевірка каналів')}
          </span>
          <span className="text-xs font-bold text-green-950 truncate block mt-0.5">
            {t('node.subscription_check.title', 'Перевірка підписки')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-[11px] font-bold text-green-800 flex items-center justify-between select-none">
            <span className="truncate">
              {channels.length === 0
                ? t('node.subscription_check.no_channels', 'Канали не налаштовані')
                : channelsCountLabel}
            </span>
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#0A0A0A]/60">
              <span>{t('node.subscription_check.mode', 'Режим перевірки')}:</span>
              <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[10px] font-bold text-[#0A0A0A]">
                {mode === 'any' ? t('node.subscription_check.mode_any_badge', 'Хоча б один') : t('node.subscription_check.mode_all_badge', 'Усі канали')}
              </span>
            </div>

            {channels.length === 0 ? (
              <div className="border-2 border-dashed border-[#0A0A0A]/40 rounded-xl p-2.5 text-center text-[11px] text-[#0A0A0A]/60 font-bold select-none italic bg-white/40 cursor-pointer">
                {t('node.subscription_check.click_to_add', '+ Додати канали')}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                {channels.map((ch, idx) => (
                  <div
                    key={ch.id || idx}
                    className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-white border border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A]"
                  >
                    <span className="truncate" title={ch.channelId}>
                      {ch.name || ch.channelId || (lang === 'en' ? `Channel ${idx + 1}` : `Канал ${idx + 1}`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <div className="relative flex items-center justify-between bg-slate-100 border-2 border-slate-400/60 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 select-none">
            <span>{t('node.subscription_check.handle_subscribed', 'Підписаний')}</span>
            <NodeHandle
              type="source"
              position={Position.Right}
              id="subscribed"
              isConnected={isSubscribedConnected}
              className={isSubscribedConnected ? '!bg-[#10B981] !border-[#10B981]' : '!bg-white !border-[#10B981]'}
            />
          </div>

          <div className="relative flex items-center justify-between bg-slate-100 border-2 border-slate-400/60 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 select-none">
            <span>{t('node.subscription_check.handle_not_subscribed', 'Не підписаний')}</span>
            <NodeHandle
              type="source"
              position={Position.Right}
              id="not_subscribed"
              isConnected={isNotSubscribedConnected}
              className={isNotSubscribedConnected ? '!bg-[#EF4444] !border-[#EF4444]' : '!bg-white !border-[#EF4444]'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

SubscriptionCheckNodeInner.displayName = 'SubscriptionCheckNode';
export const SubscriptionCheckNode = React.memo(SubscriptionCheckNodeInner);
