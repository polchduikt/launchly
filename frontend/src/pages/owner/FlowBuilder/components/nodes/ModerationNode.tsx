import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { ShieldAlert } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const ModerationNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isReplyHandle = useConnection((s) => s.fromHandle?.id === 'reply');
  const isGrayedOut = isConnecting && (isSelfSource || isReplyHandle);
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const isEnabled = data?.isEnabled !== false && data?.isActive !== false;
  const antiForward = Boolean(data?.antiForwardEnabled ?? true);
  const antiLink = Boolean(data?.antiLinkEnabled ?? false);
  const mediaMode = (data?.mediaMode as string) || 'ALL';
  const actionOnViolation = (data?.actionOnViolation as string) || 'DELETE_AND_WARN';
  const captchaEnabled = Boolean(data?.captchaEnabled);
  const captchaMode = (data?.captchaMode as string) || 'BUTTON';
  const captchaTimeout = (data?.captchaTimeoutSeconds as number | string) || 60;

  const isCleanConnected = data?._tempSourceHandle !== 'clean' && sourceConns.some((c) => c.sourceHandle === 'clean' || c.sourceHandle === 'passed' || c.sourceHandle === 'true');
  const isViolatedConnected = data?._tempSourceHandle !== 'violated' && sourceConns.some((c) => c.sourceHandle === 'violated' || c.sourceHandle === 'blocked' || c.sourceHandle === 'false');

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected ? 'shadow-lg ring-2 ring-[#0A0A0A]' : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-[#FEE2E2]/90 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-red-200 text-red-800 flex items-center justify-center shrink-0 shadow-sm border border-red-300">
          <ShieldAlert size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-red-800/80 uppercase tracking-wider block leading-none">
            {t('node.moderation.category', 'Безпека та модерація')}
          </span>
          <span className="text-xs font-bold text-red-950 truncate block mt-0.5">
            {t('node.moderation.title', 'Модерація контенту')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-[11px] font-bold text-red-800 flex items-center justify-between select-none">
            <span className="truncate">
              {t('node.moderation.zoomed_desc', 'Фільтри: Стоп-слова та спам')}
            </span>
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#0A0A0A]/70">
              <span>{t('node.moderation.status_label', 'Режим')}:</span>
              <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[10px] font-bold text-[#0A0A0A]">
                {isEnabled ? t('common.active', 'Автономно') : t('common.disabled', 'Вимкнено')}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#0A0A0A]/70">
              <span>{t('node.moderation.media_mode_badge', 'Формат')}:</span>
              <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[10px] font-bold text-[#0A0A0A]">
                {mediaMode === 'TEXT_ONLY'
                  ? t('node.moderation.mode_text_only', 'Тільки текст')
                  : mediaMode === 'MEDIA_ONLY'
                  ? t('node.moderation.mode_media_only', 'Тільки медіа')
                  : t('node.moderation.mode_all', 'Всі формати')}
              </span>
            </div>

            <div className="flex items-start justify-between text-[10px] font-black uppercase text-[#0A0A0A]/70 pt-0.5">
              <span className="pt-0.5">{t('node.moderation.filters_label', 'Фільтри')}:</span>
              <div className="flex flex-col items-end gap-1.5">
                {antiForward && (
                  <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[10px] font-bold text-[#0A0A0A]">
                    {t('node.moderation.anti_forward_badge', 'Anti-Forward')}
                  </span>
                )}
                {antiLink && (
                  <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[10px] font-bold text-[#0A0A0A]">
                    {t('node.moderation.anti_link_badge', 'Anti-Link')}
                  </span>
                )}
                <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[10px] font-bold text-[#0A0A0A]">
                  {actionOnViolation === 'DELETE_ONLY'
                    ? t('node.moderation.action_delete_only', 'Тихе видалення')
                    : actionOnViolation === 'DELETE_AND_WARN'
                    ? t('node.moderation.action_delete_warn', 'Попередження')
                    : actionOnViolation === 'DELETE_AND_MUTE'
                    ? t('node.moderation.action_delete_mute', 'Мут')
                    : t('node.moderation.action_delete_kick', 'Кік')}
                </span>
              </div>
            </div>

            {captchaEnabled && (
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#0A0A0A]/70 pt-1 border-t border-[#0A0A0A]/10">
                <span>{t('node.moderation.captcha_label', 'Капча')}:</span>
                <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[10px] font-bold text-[#0A0A0A]">
                  {captchaMode === 'MATH' ? t('node.moderation.captcha_math', '3+2=5') : t('node.moderation.captcha_button', 'Кнопка')} ({captchaTimeout}s)
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <div className="relative flex items-center justify-between bg-slate-100 border-2 border-slate-400/60 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 select-none">
            <span>{t('node.moderation.handle_clean', 'Дозволено')}</span>
            <NodeHandle
              type="source"
              position={Position.Right}
              id="clean"
              isConnected={isCleanConnected}
              className={isCleanConnected ? '!bg-[#10B981] !border-[#10B981]' : '!bg-white !border-[#10B981]'}
            />
          </div>

          <div className="relative flex items-center justify-between bg-slate-100 border-2 border-slate-400/60 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 select-none">
            <span>{t('node.moderation.handle_violated', 'Порушення')}</span>
            <NodeHandle
              type="source"
              position={Position.Right}
              id="violated"
              isConnected={isViolatedConnected}
              className={isViolatedConnected ? '!bg-[#EF4444] !border-[#EF4444]' : '!bg-white !border-[#EF4444]'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

ModerationNodeInner.displayName = 'ModerationNode';
export const ModerationNode = React.memo(ModerationNodeInner);