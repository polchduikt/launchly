import React, { useState, useRef, useEffect } from 'react';
import { useEdges, useReactFlow } from '@xyflow/react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import type { ModerationNodeEditorProps } from '../../../../../../types/bot';
import { t } from '../../../../../../i18n/config';
import { FLOW_DEFAULTS, TIMING } from '../../../../../../const/constants';
import { useClickOutside } from '../../../../../../hooks/useClickOutside';
import { textToHtml, htmlToText } from './message/contentEditableUtils';

const ACTION_OPTIONS = [
  { value: 'DELETE_AND_WARN', labelKey: 'editor.moderation.act_delete_warn', defaultLabel: 'Видалити та надіслати попередження' },
  { value: 'DELETE_ONLY', labelKey: 'editor.moderation.act_delete_only', defaultLabel: 'Тихе видалення повідомлення' },
  { value: 'DELETE_AND_MUTE', labelKey: 'editor.moderation.act_delete_mute', defaultLabel: 'Видалити та обмежити відправку' },
  { value: 'DELETE_AND_KICK', labelKey: 'editor.moderation.act_delete_kick', defaultLabel: 'Видалити та вигнати з чату' },
];

const ActionDropdown: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside([dropdownRef], () => setIsOpen(false), isOpen);

  const selectedAction = ACTION_OPTIONS.find((a) => a.value === value) || ACTION_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white hover:bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] flex items-center justify-between cursor-pointer transition-colors shadow-xs"
      >
        <span className="truncate">{t(selectedAction.labelKey, selectedAction.defaultLabel)}</span>
        <span className="p-1 rounded-lg hover:bg-[#0A0A0A]/10 transition-colors flex items-center justify-center shrink-0 ml-1">
          <ChevronDown size={14} className={`text-[#0A0A0A] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-xl overflow-hidden p-1 flex flex-col gap-0.5">
          {ACTION_OPTIONS.map((action) => {
            const isSel = action.value === value;
            return (
              <button
                key={action.value}
                type="button"
                onClick={() => {
                  onChange(action.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-left text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-between ${
                  isSel
                    ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                    : 'text-[#0A0A0A] hover:bg-[#0A0A0A]/5 bg-transparent'
                }`}
              >
                <span className="truncate">{t(action.labelKey, action.defaultLabel)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ModerationNodeEditor: React.FC<ModerationNodeEditorProps> = ({
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

  const isEnabled = data?.isEnabled !== false && data?.isActive !== false;
  const antiForward = data?.antiForwardEnabled ?? true;
  const antiLink = data?.antiLinkEnabled ?? false;
  const filterProfanity = data?.filterProfanity ?? true;
  const mediaMode = (data?.mediaMode as string) || 'ALL';
  const actionOnViolation = (data?.actionOnViolation as string) || 'DELETE_AND_WARN';
  const stopWords = Array.isArray(data?.stopWords) ? data.stopWords.join(', ') : (typeof data?.stopWords === 'string' ? data.stopWords : '');
  const whitelistedDomains = Array.isArray(data?.whitelistedDomains) ? data.whitelistedDomains.join(', ') : (typeof data?.whitelistedDomains === 'string' ? data.whitelistedDomains : '');
  
  const rawWarningTemplate = data?.warningTemplate as string | undefined;
  const warningTemplate = (rawWarningTemplate === undefined || rawWarningTemplate.startsWith('⚠️'))
    ? (rawWarningTemplate ? rawWarningTemplate.replace(/^⚠️\s*/, '').replace('{user}', '{first_name}') : '{first_name}, ваше повідомлення видалено через порушення правил чату!')
    : rawWarningTemplate;

  const warnAutoDeleteSeconds = Number(data?.warnAutoDeleteSeconds ?? 10);
  const muteDurationMinutes = Number(data?.muteDurationMinutes ?? 60);

  const [isFocused, setIsFocused] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement | null>(null);

  const handleContentEditableInput = () => {
    const el = contentEditableRef.current;
    if (el) {
      const text = htmlToText(el.innerHTML);
      handleChange('warningTemplate', text);
    }
  };

  useEffect(() => {
    const el = contentEditableRef.current;
    if (el && !isFocused) {
      const currentText = htmlToText(el.innerHTML);
      if (currentText !== warningTemplate) {
        el.innerHTML = textToHtml(warningTemplate);
      }
    }
  }, [warningTemplate, isFocused]);

  useEffect(() => {
    const el = contentEditableRef.current;
    if (el && !el.innerHTML) {
      el.innerHTML = textToHtml(warningTemplate);
    }
  }, []);

  const handleStopWordsChange = (val: string) => {
    const list = val.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    handleChange('stopWords', list);
  };

  const handleWhitelistedDomainsChange = (val: string) => {
    const list = val.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    handleChange('whitelistedDomains', list);
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

  const cleanEdge = edges.find((e) => e.source === nodeId && (e.sourceHandle === 'clean' || e.sourceHandle === 'passed' || e.sourceHandle === 'true'));
  const isCleanConnected = !!cleanEdge;
  const cleanTargetId = cleanEdge?.target;

  const violatedEdge = edges.find((e) => e.source === nodeId && (e.sourceHandle === 'violated' || e.sourceHandle === 'blocked' || e.sourceHandle === 'false'));
  const isViolatedConnected = !!violatedEdge;
  const violatedTargetId = violatedEdge?.target;

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.moderation.autonomous_mode', 'Автономна модерація чату')}
        </label>
        <div className="grid grid-cols-2 gap-1.5 bg-white border-2 border-[#0A0A0A] p-1.5 rounded-2xl select-none shadow-xs">
          <button
            type="button"
            onClick={() => {
              handleChange('isEnabled', true);
              handleChange('isActive', true);
            }}
            className={`py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              isEnabled
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <span>{t('common.enabled', 'Увімкнено')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              handleChange('isEnabled', false);
              handleChange('isActive', false);
            }}
            className={`py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              !isEnabled
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <span>{t('common.disabled', 'Вимкнено')}</span>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('editor.moderation.filters_title', 'Фільтри та правила')}
        </label>

        <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2.5 shadow-xs">
          <label className="flex items-center justify-between cursor-pointer select-none">
            <span className="text-xs font-bold text-[#0A0A0A]">
              {t('editor.moderation.anti_forward', 'Анти-форвард')}
            </span>
            <input
              type="checkbox"
              checked={antiForward}
              onChange={(e) => handleChange('antiForwardEnabled', e.target.checked)}
              className="w-4 h-4 accent-[#0A0A0A] cursor-pointer rounded"
            />
          </label>

          <hr className="border-[#0A0A0A]/10" />

          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-xs font-bold text-[#0A0A0A]">
                {t('editor.moderation.anti_link', 'Анти-посилання')}
              </span>
              <input
                type="checkbox"
                checked={antiLink}
                onChange={(e) => handleChange('antiLinkEnabled', e.target.checked)}
                className="w-4 h-4 accent-[#0A0A0A] cursor-pointer rounded"
              />
            </label>

            {antiLink && (
              <div className="pt-1">
                <input
                  type="text"
                  value={whitelistedDomains}
                  onChange={(e) => handleWhitelistedDomainsChange(e.target.value)}
                  placeholder={t('editor.moderation.whitelist_placeholder', 'Дозволені домени: t.me, youtube.com, launchly.app')}
                  className="w-full px-3 py-2 text-xs font-bold bg-[#F2EBDD]/30 border-2 border-[#0A0A0A]/40 rounded-xl focus:outline-none focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/40"
                />
              </div>
            )}
          </div>

          <hr className="border-[#0A0A0A]/10" />

          <label className="flex items-center justify-between cursor-pointer select-none">
            <span className="text-xs font-bold text-[#0A0A0A]">
              {t('editor.moderation.filter_profanity', 'Вбудований фільтр мату та спаму')}
            </span>
            <input
              type="checkbox"
              checked={filterProfanity}
              onChange={(e) => handleChange('filterProfanity', e.target.checked)}
              className="w-4 h-4 accent-[#0A0A0A] cursor-pointer rounded"
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.moderation.stop_words_title', 'Власні стоп-слова')}
        </label>
        <textarea
          rows={3}
          value={stopWords}
          onChange={(e) => handleStopWordsChange(e.target.value)}
          placeholder={t('editor.moderation.stop_words_placeholder', 'Введіть заборонені слова через кому або з нового рядка...')}
          className="w-full px-3 py-2 text-xs font-bold bg-white border-2 border-[#0A0A0A] rounded-xl focus:outline-none placeholder:text-[#0A0A0A]/40 resize-none shadow-xs"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.moderation.media_mode', 'Дозволений формат медіа')}
        </label>
        <div className="grid grid-cols-3 gap-1.5 bg-white border-2 border-[#0A0A0A] p-1.5 rounded-2xl select-none shadow-xs">
          <button
            type="button"
            onClick={() => handleChange('mediaMode', 'ALL')}
            className={`py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer border-none flex items-center justify-center text-center ${
              mediaMode === 'ALL'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <span>{t('editor.moderation.mode_all', 'Все')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('mediaMode', 'TEXT_ONLY')}
            className={`py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer border-none flex items-center justify-center text-center ${
              mediaMode === 'TEXT_ONLY'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <span>{t('editor.moderation.mode_text_only', 'Текст')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('mediaMode', 'MEDIA_ONLY')}
            className={`py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer border-none flex items-center justify-center text-center ${
              mediaMode === 'MEDIA_ONLY'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <span>{t('editor.moderation.mode_media_only', 'Медіа')}</span>
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.moderation.action_on_violation', 'Дія при виявленні порушення')}
        </label>
        <ActionDropdown
          value={actionOnViolation}
          onChange={(val) => handleChange('actionOnViolation', val)}
        />
      </div>

      {actionOnViolation === 'DELETE_AND_WARN' && (
        <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
              {t('editor.moderation.warning_template', 'Текст попередження')}
            </label>
          </div>

          <div
            className="relative w-full bg-[#F2EBDD]/30 border-2 border-[#0A0A0A]/40 rounded-xl p-3 min-h-[90px] flex flex-col justify-between cursor-text focus-within:border-[#0A0A0A]"
            onClick={() => {
              contentEditableRef.current?.focus();
              setIsFocused(true);
            }}
          >
            <div
              ref={contentEditableRef}
              contentEditable
              onInput={handleContentEditableInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              data-placeholder={t('editor.moderation.warning_placeholder', '{first_name}, ваше повідомлення видалено...')}
              className="w-full text-xs font-bold text-[#0A0A0A] focus:outline-none bg-transparent min-h-[60px] cursor-text break-words outline-none font-['JetBrains_Mono',monospace]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#0A0A0A]/10">
            <span className="text-[11px] font-bold text-[#0A0A0A]">
              {t('editor.moderation.warn_ttl', 'Автовидалення попередження, сек')}
            </span>
            <input
              type="number"
              min={0}
              max={300}
              value={warnAutoDeleteSeconds}
              onChange={(e) => handleChange('warnAutoDeleteSeconds', Number(e.target.value))}
              className="w-20 px-2 py-1 text-xs font-bold bg-[#F2EBDD]/30 border-2 border-[#0A0A0A]/40 rounded-lg text-center focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
        </div>
      )}

      {actionOnViolation === 'DELETE_AND_MUTE' && (
        <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-[#0A0A0A]">
              {t('editor.moderation.mute_duration', 'Тривалість муту, хв')}
            </span>
            <input
              type="number"
              min={1}
              max={43200}
              value={muteDurationMinutes}
              onChange={(e) => handleChange('muteDurationMinutes', Number(e.target.value))}
              className="w-20 px-2 py-1 text-xs font-bold bg-[#F2EBDD]/30 border-2 border-[#0A0A0A]/40 rounded-lg text-center focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t-2 border-[#0A0A0A]/10">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.moderation.flow_routing', 'Маршрутизація сценарію')}
        </label>

        <div
          onClick={() => {
            if (isCleanConnected && cleanTargetId) {
              handleJumpToNode(cleanTargetId);
            } else {
              openNextStep('clean');
            }
          }}
          className="w-full p-2.5 bg-[#F2EBDD]/40 hover:bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] flex items-center justify-between cursor-pointer transition-colors shadow-xs select-none"
        >
          <span>{t('editor.moderation.connect_clean', 'Дозволено')}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isCleanConnected && cleanTargetId) {
                handleJumpToNode(cleanTargetId);
              } else {
                openNextStep('clean');
              }
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 border-2 border-emerald-600 ${
              isCleanConnected
                ? 'bg-emerald-500 text-white cursor-pointer'
                : 'bg-white text-emerald-600 cursor-pointer'
            }`}
          >
            {isCleanConnected ? (
              <ArrowRight size={11} className="stroke-[2.5]" />
            ) : null}
          </button>
        </div>

        <div
          onClick={() => {
            if (isViolatedConnected && violatedTargetId) {
              handleJumpToNode(violatedTargetId);
            } else {
              openNextStep('violated');
            }
          }}
          className="w-full p-2.5 bg-[#F2EBDD]/40 hover:bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black text-[#0A0A0A] flex items-center justify-between cursor-pointer transition-colors shadow-xs select-none"
        >
          <span>{t('editor.moderation.connect_violated', 'Порушення')}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isViolatedConnected && violatedTargetId) {
                handleJumpToNode(violatedTargetId);
              } else {
                openNextStep('violated');
              }
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 border-2 border-rose-600 ${
              isViolatedConnected
                ? 'bg-rose-500 text-white cursor-pointer'
                : 'bg-white text-rose-600 cursor-pointer'
            }`}
          >
            {isViolatedConnected ? (
              <ArrowRight size={11} className="stroke-[2.5]" />
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
};

