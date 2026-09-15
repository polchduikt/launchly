import React from 'react';
import { useEdges, useReactFlow } from '@xyflow/react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import type { SubscriptionCheckNodeEditorProps, TelegramChannelCheckItem } from '../../../../../../types/bot';
import { generateId } from '../../../../../../utils/id';
import { t } from '../../../../../../i18n/config';
import { FLOW_DEFAULTS, TIMING } from '../../../../../../const/constants';

export const SubscriptionCheckNodeEditor: React.FC<SubscriptionCheckNodeEditorProps> = ({
  nodeId: explicitNodeId,
  node,
  data,
  handleChange,
  editorState,
  onSelectNode,
}) => {
  const nodeId = explicitNodeId || node?.id;
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const { setNodes, fitView } = useReactFlow();

  const mode = (data?.mode as 'all' | 'any') || 'all';

  const rawChannels = data?.channels;
  const channels: TelegramChannelCheckItem[] = Array.isArray(rawChannels) && rawChannels.length > 0
    ? rawChannels
    : (data?.channelId || data?.channel
        ? [{ id: 'ch_0', channelId: String(data.channelId || data.channel), name: String(data.channelName || ''), isRequired: true }]
        : []);

  const handleModeChange = (newMode: 'all' | 'any') => {
    handleChange('mode', newMode);
  };

  const handleAddChannel = () => {
    const newItem: TelegramChannelCheckItem = {
      id: generateId('ch_'),
      channelId: '',
      name: '',
      url: '',
      isRequired: true,
    };
    handleChange('channels', [...channels, newItem]);
  };

  const handleRemoveChannel = (index: number) => {
    const updated = channels.filter((_, idx) => idx !== index);
    handleChange('channels', updated);
  };

  const handleUpdateChannel = (index: number, field: keyof TelegramChannelCheckItem, value: unknown) => {
    const updated = channels.map((ch, idx) => {
      if (idx === index) {
        return { ...ch, [field]: value };
      }
      return ch;
    });
    handleChange('channels', updated);
  };

  const handleJumpToNode = (targetId: string) => {
    if (onSelectNode) {
      onSelectNode(targetId);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === targetId,
        }))
      );
      setTimeout(() => {
        fitView({
          nodes: [{ id: targetId }],
          duration: FLOW_DEFAULTS.FIT_VIEW_DURATION_MS,
          padding: FLOW_DEFAULTS.FIT_VIEW_PADDING,
        });
      }, TIMING.FOCUS_DELAY_MS);
    }
  };

  const openNextStep = (handleId: string) => {
    if (editorState) {
      editorState.setNextStepSourceHandle(handleId);
      editorState.setIsNextStepDrawerOpen(true);
    }
  };

  const subscribedEdge = edges.find((e) => e.source === nodeId && (e.sourceHandle === 'subscribed' || e.sourceHandle === 'true' || e.sourceHandle === 'yes'));
  const isSubscribedConnected = !!subscribedEdge;
  const subscribedTargetId = subscribedEdge?.target;

  const notSubscribedEdge = edges.find((e) => e.source === nodeId && (e.sourceHandle === 'not_subscribed' || e.sourceHandle === 'false' || e.sourceHandle === 'no'));
  const isNotSubscribedConnected = !!notSubscribedEdge;
  const notSubscribedTargetId = notSubscribedEdge?.target;

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      {/* 1. Стратегія перевірки (Segmented Control / Toggle) */}
      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('editor.subscription_check.check_mode', 'Стратегія перевірки')}
        </label>
        <div className="grid grid-cols-2 gap-1.5 bg-white border-2 border-[#0A0A0A] p-1.5 rounded-2xl select-none shadow-xs">
          <button
            type="button"
            onClick={() => handleModeChange('all')}
            className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer border-none flex items-center justify-center text-center ${
              mode === 'all'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <span>{t('editor.subscription_check.mode_all', 'Усі канали')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('any')}
            className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer border-none flex items-center justify-center text-center ${
              mode === 'any'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <span>{t('editor.subscription_check.mode_any', 'Хоча б один')}</span>
          </button>
        </div>
      </div>

      {/* 2. Список каналів */}
      <div className="space-y-3">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.subscription_check.channels_list', 'Канали')}
        </label>

        {channels.length === 0 ? (
          <div
            onClick={handleAddChannel}
            className="border-2 border-dashed border-[#0A0A0A]/30 rounded-2xl p-4 text-center text-xs text-[#0A0A0A]/60 font-bold bg-[#F2EBDD]/40 hover:bg-[#F2EBDD]/70 cursor-pointer transition-colors"
          >
            + {t('editor.subscription_check.no_channels_added', 'Канали ще не додані. Натисніть, щоб додати')}
          </div>
        ) : (
          <div className="space-y-3">
            {channels.map((ch, idx) => (
              <div
                key={ch.id || idx}
                className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-black text-[#0A0A0A] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ch.isRequired !== false}
                      onChange={(e) => handleUpdateChannel(idx, 'isRequired', e.target.checked)}
                      className="w-3.5 h-3.5 accent-[#0A0A0A] cursor-pointer rounded"
                    />
                    <span>{t('editor.subscription_check.required', 'Обов\'язковий')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(idx)}
                    className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg border border-transparent hover:border-rose-600 transition-colors cursor-pointer"
                    title={t('common.delete', 'Видалити')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={ch.channelId || ''}
                    onChange={(e) => handleUpdateChannel(idx, 'channelId', e.target.value)}
                    placeholder="@channel або -100..."
                    className="w-full px-3 py-2 bg-white hover:bg-slate-50 focus:bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none placeholder:text-[#0A0A0A]/40"
                  />
                  <input
                    type="text"
                    value={ch.name || ''}
                    onChange={(e) => handleUpdateChannel(idx, 'name', e.target.value)}
                    placeholder={t('editor.subscription_check.channel_title_placeholder', 'Назва')}
                    className="w-full px-3 py-2 text-xs font-bold bg-[#F2EBDD]/30 border-2 border-[#0A0A0A]/40 rounded-xl focus:outline-none focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/40"
                  />
                  <input
                    type="text"
                    value={ch.url || ''}
                    onChange={(e) => handleUpdateChannel(idx, 'url', e.target.value)}
                    placeholder="https://t.me/..."
                    className="w-full px-3 py-2 text-xs font-bold bg-[#F2EBDD]/30 border-2 border-[#0A0A0A]/40 rounded-xl focus:outline-none focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/40"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddChannel}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-[#F2EBDD] border-2 border-dashed border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] transition-colors cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>{t('editor.subscription_check.btn_add', 'Додати канал')}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Маршрутизація сценарію (як у нодах Взаємодія / Пошук) */}
      <div className="space-y-2 pt-2 border-t-2 border-[#0A0A0A]/10">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.subscription_check.flow_routing', 'Маршрутизація сценарію')}
        </label>

        {/* Гілка: Підписаний */}
        <div
          onClick={() => {
            if (isSubscribedConnected && subscribedTargetId) {
              handleJumpToNode(subscribedTargetId);
            } else {
              openNextStep('subscribed');
            }
          }}
          className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-600 rounded-xl text-xs font-black text-emerald-900 flex items-center justify-between cursor-pointer transition-colors shadow-xs select-none"
        >
          <span>{t('editor.subscription_check.connect_yes', 'Підписаний')}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isSubscribedConnected && subscribedTargetId) {
                handleJumpToNode(subscribedTargetId);
              } else {
                openNextStep('subscribed');
              }
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isSubscribedConnected
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-2 border-emerald-600 cursor-pointer'
                : 'border-2 border-emerald-600/50 bg-white text-emerald-600/50 cursor-pointer'
            }`}
          >
            {isSubscribedConnected ? (
              <ArrowRight size={11} className="stroke-[2.5]" />
            ) : null}
          </button>
        </div>

        {/* Гілка: Не підписаний */}
        <div
          onClick={() => {
            if (isNotSubscribedConnected && notSubscribedTargetId) {
              handleJumpToNode(notSubscribedTargetId);
            } else {
              openNextStep('not_subscribed');
            }
          }}
          className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 border-2 border-rose-600 rounded-xl text-xs font-black text-rose-900 flex items-center justify-between cursor-pointer transition-colors shadow-xs select-none"
        >
          <span>{t('editor.subscription_check.connect_no', 'Не підписаний')}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isNotSubscribedConnected && notSubscribedTargetId) {
                handleJumpToNode(notSubscribedTargetId);
              } else {
                openNextStep('not_subscribed');
              }
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isNotSubscribedConnected
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-2 border-emerald-500 cursor-pointer'
                : 'border-2 border-rose-600/50 bg-white text-rose-600/50 cursor-pointer'
            }`}
          >
            {isNotSubscribedConnected ? (
              <ArrowRight size={11} className="stroke-[2.5]" />
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
};
