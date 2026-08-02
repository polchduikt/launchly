import React, { useState } from 'react';
import { X, Trash2, Send, Sparkles, Globe, CreditCard, Zap, GitFork, Shuffle, Clock, Play } from 'lucide-react';
import type { EditButtonDrawerProps } from '../../../../../../types/bot';
import type { Node, Edge } from '@xyflow/react';
import { NODE_TITLES } from '../../../../../../const/nodeDisplay';
import { t } from '../../../../../../i18n/config';

const mapNodeTypeToActionType = (nodeType?: string): string => {
  switch (nodeType) {
    case 'MessageNode': return 'TELEGRAM';
    case 'AiNode': return 'AI_STEP';
    case 'ActionNode': return 'ACTIONS';
    case 'ConditionNode': return 'CONDITION';
    case 'RandomNode': return 'RANDOM';
    case 'DelayNode': return 'DELAY';
    case 'StartAutomationNode': return 'AUTOMATION';
    default: return 'TELEGRAM';
  }
};

import { useIntegrationsQuery } from '../../../../../../hooks/integration/useIntegrationQueries';
import type { IntegrationResponse } from '../../../../../../types';

export const EditButtonDrawer: React.FC<EditButtonDrawerProps> = ({
  onClose,
  button,
  onSave,
  onRemove,
  edges = [],
  nodes = [],
  nodeId,
  onUnlinkConnection,
}) => {
  const { data: integrations = [] } = useIntegrationsQuery();
  const isStripeConnected = integrations.some((i: IntegrationResponse) => i.type === 'STRIPE' && i.active);
  const isPaypalConnected = integrations.some((i: IntegrationResponse) => i.type === 'PAYPAL' && i.active);
  const isPaymentConnected = isStripeConnected || isPaypalConnected;
  const [label, setLabel] = useState('');
  const [actionType, setActionType] = useState('');
  const [actionTarget, setActionTarget] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('UAH');

  const [prevButtonValue, setPrevButtonValue] = useState<string | null>(null);
  if (button && button.value !== prevButtonValue) {
    setPrevButtonValue(button.value);
    setLabel(button.label || '');
    const connectionEdge = (edges as Edge[]).find(
      (e) => e.source === nodeId && e.sourceHandle === button.value
    );
    const targetNode = connectionEdge
      ? (nodes as Node[]).find((n) => n.id === connectionEdge.target)
      : null;
      
    let initialActionType = button.actionType || '';
    if (!initialActionType && targetNode) {
      initialActionType = mapNodeTypeToActionType(targetNode.type);
    }
    
    setActionType(initialActionType);
    setActionTarget(button.actionTarget || '');
    setProductName(button.productName || '');
    setPrice(button.price || '');
    setCurrency(button.currency || 'UAH');
  }

  const typedEdges = edges as Edge[];
  const typedNodes = nodes as Node[];

  if (!button) return null;

  const connectionEdge = typedEdges.find(
    (e) => e.source === nodeId && e.sourceHandle === button.value
  );
  const targetNode = connectionEdge
    ? typedNodes.find((n) => n.id === connectionEdge.target)
    : null;

  const getTargetNodeDisplayName = (tn: Node) => {
    const typedNodesFiltered = typedNodes.filter((n) => n.type === tn.type);
    const idx = typedNodesFiltered.findIndex((n) => n.id === tn.id);
    const baseTitle = NODE_TITLES[tn.type || ''] || tn.type || '';
    return idx !== -1 ? `${baseTitle} #${idx + 1}` : baseTitle;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    onSave({
      ...button,
      label: label.trim(),
      actionType,
      actionTarget: actionType === 'URL' ? actionTarget.trim() : '',
      productName: actionType === 'BUY' ? productName.trim() : '',
      price: actionType === 'BUY' ? price.trim() : '',
      currency: actionType === 'BUY' ? currency : 'UAH',
    });
    onClose();
  };

  const actionOptions = [
    { type: 'TELEGRAM', label: t('editor.edit_button.action.telegram', 'Telegram'), icon: Send, color: 'text-sky-600 bg-sky-100' },
    { type: 'AI_STEP', label: t('editor.edit_button.action.ai_step', 'AI step'), icon: Sparkles, color: 'text-indigo-600 bg-indigo-100' },
    { type: 'URL', label: t('editor.edit_button.action.open_website'), icon: Globe, color: 'text-emerald-600 bg-emerald-100' },
    { type: 'BUY', label: t('editor.edit_button.action.buy_button'), icon: CreditCard, color: 'text-amber-600 bg-amber-100', pro: true },
    { type: 'ACTIONS', label: t('editor.edit_button.action.perform_actions', 'Perform actions'), icon: Zap, color: 'text-purple-600 bg-purple-100' },
    { type: 'CONDITION', label: t('editor.edit_button.action.condition', 'Condition'), icon: GitFork, color: 'text-rose-600 bg-rose-100', pro: true },
    { type: 'RANDOM', label: t('editor.edit_button.action.randomizer', 'Randomizer'), icon: Shuffle, color: 'text-violet-600 bg-violet-100', pro: true },
    { type: 'DELAY', label: t('editor.edit_button.action.smart_delay', 'Smart delay'), icon: Clock, color: 'text-cyan-600 bg-cyan-100', pro: true },
    { type: 'AUTOMATION', label: t('editor.edit_button.action.start_automation'), icon: Play, color: 'text-teal-600 bg-teal-100' },
  ];



  return (
    <div className="h-full flex flex-col justify-between bg-[#F2EBDD] font-['JetBrains_Mono',monospace] w-full">
      <div className="px-5 py-4 border-b-2 border-[#0A0A0A] flex justify-between items-center bg-[#F2EBDD] select-none shrink-0">
        <h3 className="font-['Anybody',sans-serif] font-black text-xs text-[#0A0A0A] uppercase tracking-wider">{t('editor.edit_button.title')}</h3>
        <button onClick={onClose} className="text-[#0A0A0A]/55 hover:text-[#0A0A0A] hover:bg-white p-1.5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#0A0A0A]">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 pb-24 space-y-5 custom-scrollbar flex flex-col justify-between">
        <div className="space-y-5">
          <div>
            <label htmlFor="btnLabel" className="block text-[10px] font-black text-[#0A0A0A]/60 uppercase tracking-wider mb-1.5">
              {t('editor.edit_button.button_title')}
            </label>
            <div className="relative">
              <input
                id="btnLabel"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('editor.edit_button.title_placeholder')}
                maxLength={25}
                className="w-full px-4 py-2.5 pr-12 rounded-xl border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/15 text-xs font-bold transition-all bg-white text-[#0A0A0A]"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-[#0A0A0A]/45 font-bold">
                {label.length}/25
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#0A0A0A]/60 uppercase tracking-wider mb-2">
              {t('editor.edit_button.when_pressed')}
            </label>
            {targetNode ? (() => {
              const matchedOpt = actionOptions.find((o) => o.type === actionType);
              const IconComponent = matchedOpt?.icon || Send;
              const optColorClass = matchedOpt?.color || 'text-sky-500 bg-sky-50';
              const optLabel = matchedOpt?.label || t('step_option.MESSAGE.label');
              const targetNodeTitle = getTargetNodeDisplayName(targetNode);
              return (
                <div className="flex items-center justify-between p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl animate-fade-in select-none">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${optColorClass}`}>
                      <IconComponent size={14} />
                    </span>
                    <div>
                      <p className="text-[10px] font-black text-[#0A0A0A]/50 uppercase tracking-wider leading-none">
                        {optLabel}
                      </p>
                      <p className="text-xs font-bold text-[#0A0A0A] mt-1">
                        {targetNodeTitle}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUnlinkConnection && button) {
                        onUnlinkConnection(button.value);
                      }
                      setActionType('');
                    }}
                    className="p-1.5 hover:bg-[#0A0A0A] text-[#0A0A0A]/55 hover:text-[#F2EBDD] rounded-xl transition-all cursor-pointer border border-transparent hover:border-[#0A0A0A]"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })() : (
              <div className="space-y-1 bg-white border-2 border-[#0A0A0A] rounded-2xl p-1.5">
                {actionOptions.map((opt) => {
                  const IconComponent = opt.icon;
                  const isSelected = actionType === opt.type;
                  return (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => setActionType(opt.type)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all border cursor-pointer select-none group ${
                        isSelected
                          ? 'border-[#0A0A0A] bg-amber-100 text-[#0A0A0A] font-black'
                          : 'border-transparent hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] hover:border-[#0A0A0A]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${opt.color}`}>
                          <IconComponent size={13} />
                        </span>
                        <span className="text-[11px] font-bold">{opt.label}</span>
                      </div>
                      {opt.pro && (
                        <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 border border-[#0A0A0A] px-1.5 py-0.5 rounded uppercase tracking-wider">
                          PRO
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {actionType === 'URL' && (
            <div className="animate-fade-in">
              <label htmlFor="btnUrl" className="block text-[10px] font-black text-[#0A0A0A]/60 uppercase tracking-wider mb-1.5">
                {t('editor.edit_button.url_link')}
              </label>
              <input
                id="btnUrl"
                type="text"
                value={actionTarget}
                onChange={(e) => setActionTarget(e.target.value)}
                placeholder={t('editor.edit_button.url_placeholder')}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/15 text-xs font-bold transition-all bg-white text-[#0A0A0A]"
              />
            </div>
          )}

          {actionType === 'BUY' && (
            !isPaymentConnected ? (
              <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 text-center space-y-4 animate-fade-in select-none">
                <p className="text-xs text-[#0A0A0A]/70 leading-relaxed font-bold">
                  {t('editor.edit_button.stripe_paypal_error')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/settings?tab=payments';
                  }}
                  className="w-full py-2.5 bg-[#0A0A0A] hover:bg-[#F2EBDD] text-[#F2EBDD] hover:text-[#0A0A0A] text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center border-2 border-[#0A0A0A]"
                >
                  {t('editor.ai.go_to_settings')}
                </button>
              </div>
            ) : (
              <div className="animate-fade-in space-y-4">
                <div>
                  <label htmlFor="prodName" className="block text-[10px] font-black text-[#0A0A0A]/60 uppercase tracking-wider mb-1.5">
                    {t('editor.edit_button.product_name')}
                  </label>
                  <input
                    id="prodName"
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={t('editor.edit_button.product_placeholder')}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/15 text-xs font-bold transition-all bg-white text-[#0A0A0A]"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="prodPrice" className="block text-[10px] font-black text-[#0A0A0A]/60 uppercase tracking-wider mb-1.5">
                      {t('editor.edit_button.price')}
                    </label>
                    <input
                      id="prodPrice"
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder={t('editor.edit_button.price_placeholder')}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/15 text-xs font-bold transition-all bg-white text-[#0A0A0A]"
                    />
                  </div>
                  <div className="w-24">
                    <label htmlFor="prodCurrency" className="block text-[10px] font-black text-[#0A0A0A]/60 uppercase tracking-wider mb-1.5">
                      {t('editor.edit_button.currency')}
                    </label>
                    <select
                      id="prodCurrency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/15 text-xs font-bold transition-all bg-white text-[#0A0A0A] cursor-pointer"
                    >
                      <option value="UAH">UAH</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {actionType === 'BUY' && !isPaymentConnected ? (
          <div className="flex items-center justify-center pt-4 border-t-2 border-[#0A0A0A]/15 select-none shrink-0 mt-6">
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2 text-rose-700 text-xs font-black rounded-xl transition-all cursor-pointer w-full hover:bg-rose-100 border-2 border-rose-300"
            >
              <Trash2 size={14} className="text-rose-500" />
              <span>{t('editor.edit_button.remove')}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-4 border-t-2 border-[#0A0A0A]/15 select-none shrink-0 mt-6">
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-black rounded-xl transition-all border-2 border-rose-300 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>{t('editor.edit_button.remove')}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] text-[#0A0A0A] text-[11px] font-black rounded-xl transition-all cursor-pointer"
              >
                {t('editor.edit_button.cancel')}
              </button>
              <button
                 type="submit"
                 disabled={
                   !label.trim() ||
                   (actionType === 'URL' && !actionTarget.trim()) ||
                   (actionType === 'BUY' && (!productName.trim() || !price.trim()))
                 }
                 className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 disabled:opacity-50 text-[#F2EBDD] text-[11px] font-black rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed border-2 border-[#0A0A0A]"
                >
                  {t('editor.edit_button.done')}
                </button>
             </div>
           </div>
        )}
      </form>
    </div>
  );
};
