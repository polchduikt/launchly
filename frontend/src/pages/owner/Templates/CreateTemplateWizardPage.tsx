import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Copy,
  Shield,
  Info,
  Save,
  Loader2,
  Upload,
  Radio,
  Tag as TagIcon,
  Workflow,
  Sliders,
} from 'lucide-react';
import { useBotStore } from '../../../store/useBotStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { getCampaignsApi, getTagsApi } from '../../../api/broadcast';
import { getCustomFieldsApi } from '../../../api/bot';
import {
  createTemplateApi,
  updateTemplateApi,
  getTemplateByShareCodeApi,
  type TemplateResponse,
} from '../../../api/templateApi';
import { useTranslation } from '../../../i18n/config';
import type { CampaignResponse, TagResponse } from '../../../types';

interface SelectionItem {
  id: string;
  name: string;
  category: 'automations' | 'broadcasts' | 'fields' | 'tags';
}

export const CreateTemplateWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const routeParams = useParams<{ shareCode: string }>();
  const [searchParams] = useSearchParams();
  const editShareCode = routeParams.shareCode || searchParams.get('edit');
  const isEditMode = Boolean(editShareCode);
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);
  const activeBotId = useBotStore((s) => s.activeBotId);
  const { data: bots = [], isLoading: isLoadingBots } = useBotsQuery();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loadingRealData, setLoadingRealData] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [templateName, setTemplateName] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdTemplate, setCreatedTemplate] = useState<TemplateResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [guideUrl, setGuideUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSavedMsg, setDetailsSavedMsg] = useState(false);

  useEffect(() => {
    if (bots.length === 0) return;
    setLoadingRealData(true);

    const campaignPromises = bots.map((b) => getCampaignsApi(b.id).catch(() => []));
    const tagPromises = bots.map((b) => getTagsApi(b.id).catch(() => []));
    const fieldPromises = bots.map((b) => getCustomFieldsApi(b.id).catch(() => []));

    Promise.all([
      Promise.all(campaignPromises),
      Promise.all(tagPromises),
      Promise.all(fieldPromises),
    ])
      .then(([allCamps, allTags, allFields]) => {
        const mergedCamps: CampaignResponse[] = [];
        const campMap = new Map<number, CampaignResponse>();
        allCamps.flat().forEach((c) => {
          if (c && c.id && !campMap.has(Number(c.id))) {
            campMap.set(Number(c.id), c);
            mergedCamps.push(c);
          }
        });
        setCampaigns(mergedCamps);

        const mergedTags: TagResponse[] = [];
        const tagMap = new Map<number, TagResponse>();
        allTags.flat().forEach((tg) => {
          if (tg && tg.id && !tagMap.has(Number(tg.id))) {
            tagMap.set(Number(tg.id), tg);
            mergedTags.push(tg);
          }
        });
        setTags(mergedTags);

        const mergedFields: any[] = [];
        const seenFieldNames = new Set<string>();
        allFields.forEach((fRes) => {
          if (!fRes) return;
          let list: any[] = [];
          if (Array.isArray(fRes)) {
            list = fRes;
          } else if (typeof fRes === 'object') {
            if (Array.isArray(fRes.fields)) {
              list = [...fRes.fields];
            } else {
              Object.keys(fRes).forEach((k) => {
                if (k !== 'folders' && k !== 'archivedFields') {
                  list.push({ name: k, label: typeof fRes[k] === 'string' ? fRes[k] : k });
                }
              });
            }
          }

          list.forEach((f: any) => {
            const name = (typeof f === 'string' ? f : f?.name || f?.label || '').trim();
            if (name && !seenFieldNames.has(name.toLowerCase())) {
              seenFieldNames.add(name.toLowerCase());
              mergedFields.push(typeof f === 'string' ? { name, type: 'Text' } : f);
            }
          });
        });
        setCustomFields(mergedFields);

        setCollapsed({
          broadcasts: mergedCamps.length === 0,
          fields: mergedFields.length === 0,
          tags: mergedTags.length === 0,
        });
        if (editShareCode) {
          getTemplateByShareCodeApi(editShareCode).then((existingTpl) => {
            if (currentUser && existingTpl.creatorId && existingTpl.creatorId !== currentUser.id) {
              alert(t('template.error.not_owner', 'Ви не можете редагувати чужий шаблон. Лише власник може вносити зміни.'));
              navigate('/templates');
              return;
            }
            setTemplateName(existingTpl.name);
            setAboutText(existingTpl.description || '');
            setGuideUrl(existingTpl.guideUrl || '');
            setVideoUrl(existingTpl.videoUrl || '');
            setIsProtected(existingTpl.isProtected);
            if (existingTpl.avatarUrl) {
              setAvatarPreview(existingTpl.avatarUrl);
            }
            setCreatedTemplate(existingTpl);
            const initialSelected: string[] = [];
            if (existingTpl.selectedFlowIds && existingTpl.selectedFlowIds.length > 0) {
              initialSelected.push(...existingTpl.selectedFlowIds);
            } else {
              bots.forEach((b) => initialSelected.push(`automation_${b.id}`));
            }
            if (existingTpl.selectedBroadcastIds && existingTpl.selectedBroadcastIds.length > 0) {
              existingTpl.selectedBroadcastIds.forEach((id) => initialSelected.push(`broadcast_${id}`));
            }
            if (existingTpl.selectedFieldIds && existingTpl.selectedFieldIds.length > 0) {
              existingTpl.selectedFieldIds.forEach((id) => initialSelected.push(`field_${id}`));
            }
            if (existingTpl.selectedTagIds && existingTpl.selectedTagIds.length > 0) {
              existingTpl.selectedTagIds.forEach((id) => initialSelected.push(`tag_${id}`));
            }
            setSelectedIds(initialSelected);
          }).catch(() => {});
        }
      })
      .finally(() => setLoadingRealData(false));
  }, [bots, editShareCode, currentUser, navigate, t]);

  const automationItems: SelectionItem[] = bots.map((b) => ({
    id: `automation_${b.id}`,
    name: b.name,
    category: 'automations',
  }));

  const broadcastItems: SelectionItem[] = campaigns.map((c) => ({
    id: `broadcast_${c.id}`,
    name: c.name || `${t('template.create.fallback_broadcast', 'Розсилка')} #${c.id}`,
    category: 'broadcasts',
  }));

  const fieldItems: SelectionItem[] = customFields.map((f, idx) => ({
    id: `field_${idx}`,
    name: f.name || f.label || `${t('template.create.fallback_field', 'Поле')} #${idx + 1}`,
    category: 'fields',
  }));

  const tagItems: SelectionItem[] = tags.map((t) => ({
    id: `tag_${t.id}`,
    name: t.name,
    category: 'tags',
  }));

  const allItems: SelectionItem[] = [
    ...automationItems,
    ...broadcastItems,
    ...fieldItems,
    ...tagItems,
  ];

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(allItems.map((i) => i.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateOrUpdateTemplate = async () => {
    if (!templateName.trim()) return;
    setSubmitting(true);
    try {
      const selectedFlows = selectedIds.filter((id) => id.startsWith('automation_'));
      const selectedBroadcasts = selectedIds
        .filter((id) => id.startsWith('broadcast_'))
        .map((id) => parseInt(id.replace('broadcast_', ''), 10))
        .filter((n) => !isNaN(n));
      const selectedFields = selectedIds
        .filter((id) => id.startsWith('field_'))
        .map((id) => parseInt(id.replace('field_', ''), 10))
        .filter((n) => !isNaN(n));
      const selectedTags = selectedIds
        .filter((id) => id.startsWith('tag_'))
        .map((id) => parseInt(id.replace('tag_', ''), 10))
        .filter((n) => !isNaN(n));

      let targetSourceBotId = activeBotId;
      if (selectedFlows.length > 0) {
        const parsedId = parseInt(selectedFlows[0].replace('automation_', ''));
        if (parsedId && parsedId > 0) {
          targetSourceBotId = parsedId;
        }
      }
      if (!targetSourceBotId && bots.length > 0) {
        targetSourceBotId = bots[0].id;
      }

      if (isEditMode && editShareCode) {
        const res = await updateTemplateApi(editShareCode, {
          name: templateName,
          description: aboutText,
          avatarUrl: avatarPreview || undefined,
          isProtected,
          guideUrl,
          videoUrl,
          selectedFlowIds: selectedFlows,
          selectedBroadcastIds: selectedBroadcasts,
          selectedFieldIds: selectedFields,
          selectedTagIds: selectedTags,
        });
        setCreatedTemplate(res);
        setStep(3);
      } else {
        if (!targetSourceBotId) return;
        const res = await createTemplateApi({
          botId: targetSourceBotId,
          name: templateName,
          description: aboutText,
          avatarUrl: avatarPreview || undefined,
          isProtected,
          guideUrl,
          videoUrl,
          selectedFlowIds: selectedFlows,
          selectedBroadcastIds: selectedBroadcasts,
          selectedFieldIds: selectedFields,
          selectedTagIds: selectedTags,
        });
        setCreatedTemplate(res);
        setStep(3);
      }
    } catch (err) {
      alert(t('template.create.error_create', 'Помилка збереження шаблону. Спробуйте пізніше.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!createdTemplate?.shareCode) return;
    setSavingDetails(true);
    try {
      const updated = await updateTemplateApi(createdTemplate.shareCode, {
        name: templateName,
        description: aboutText,
        avatarUrl: avatarPreview || undefined,
        isProtected,
        guideUrl,
        videoUrl,
      });
      setCreatedTemplate(updated);
      setDetailsSavedMsg(true);
      setTimeout(() => setDetailsSavedMsg(false), 2500);
    } catch (err) {
      alert(t('template.create.error_save', 'Помилка збереження даних.'));
    } finally {
      setSavingDetails(false);
    }
  };

  const handleCopyLink = () => {
    const url = createdTemplate?.shareUrl || (createdTemplate?.shareCode ? `${window.location.origin}/templates/install/${createdTemplate.shareCode}` : '');
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full font-['JetBrains_Mono',monospace] text-[#0A0A0A] bg-[#F2EBDD]">
        <div className="w-full h-16 min-h-[64px] max-h-[64px] bg-white border-b-2 border-[#0A0A0A] px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (step > 1 ? setStep((step - 1) as any) : navigate('/templates'))}
              className="px-3 py-1.5 bg-white hover:bg-[#0A0A0A] hover:text-white border border-[#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <ChevronLeft size={15} />
              <span>{t('common.back', 'Назад')}</span>
            </button>

            <div>
              <h1 className="font-['Anybody',sans-serif] font-black text-sm uppercase tracking-tight">
                {isEditMode
                  ? `${t('template.edit.header_title', 'Редагувати шаблон')} ${templateName || createdTemplate?.name || ''}`
                  : t('template.create.header_title', 'Створення нового шаблону')}
              </h1>
            </div>
          </div>

          <div>
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={selectedIds.length === 0}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white border border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t('template.create.next_step', 'Далі')}</span>
                <ChevronRight size={15} />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={handleCreateOrUpdateTemplate}
                disabled={submitting || !templateName.trim()}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white border border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>{t('common.submitting', 'Зберігаємо...')}</span>
                  </>
                ) : (
                  <>
                    <span>{isEditMode ? t('common.update', 'Оновити') : t('template.create.create_btn', 'Створити шаблон')}</span>
                    <ChevronRight size={15} />
                  </>
                )}
              </button>
            )}
            {step === 3 && (
              <button
                onClick={() => navigate('/templates')}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-[#0A0A0A] border border-[#0A0A0A] text-xs font-black uppercase cursor-pointer"
              >
                {t('template.create.finish_btn', 'Завершити')}
              </button>
            )}
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-['Anybody',sans-serif] text-lg font-black uppercase tracking-tight">
                  {t('template.create.select_content_title', 'Виберіть елементи шаблону')}
                </h2>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <div className="xl:col-span-2 space-y-4">
                  <div className="bg-white border-2 border-[#0A0A0A] p-4 shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-slate-800 tracking-wide">
                      {t('template.create.selected_count', { count: selectedIds.length, total: allItems.length })}
                    </span>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <button onClick={handleSelectAll} className="text-indigo-600 no-underline hover:opacity-75 cursor-pointer">
                        {t('template.create.select_all', 'Вибрати все')}
                      </button>
                      <span className="text-slate-300">|</span>
                      <button onClick={handleClearAll} className="text-rose-600 no-underline hover:opacity-75 cursor-pointer">
                        {t('template.create.clear_all', 'Очистити все')}
                      </button>
                    </div>
                  </div>

                  {loadingRealData || isLoadingBots ? (
                    <div className="py-12 bg-white border-2 border-[#0A0A0A] text-center space-y-3 shadow-[2px_2px_0px_#0A0A0A]">
                      <Loader2 className="animate-spin mx-auto text-[#0A0A0A]" size={28} />
                      <span className="text-xs font-bold uppercase">{t('common.loading', 'Завантаження реальних даних...')}</span>
                    </div>
                  ) : (
                    [
                      { key: 'automations', label: t('template.create.cat_automations', 'Автоматизації'), items: automationItems, icon: <Workflow size={16} /> },
                      { key: 'broadcasts', label: t('template.create.cat_broadcasts', 'Розсилки'), items: broadcastItems, icon: <Radio size={16} /> },
                      { key: 'fields', label: t('template.create.cat_fields', 'Поля користувачів'), items: fieldItems, icon: <Sliders size={16} /> },
                      { key: 'tags', label: t('template.create.cat_tags', 'Теги'), items: tagItems, icon: <TagIcon size={16} /> },
                    ].map((cat) => {
                      const isCollapsed = collapsed[cat.key];
                      const selectedCatCount = cat.items.filter((i) => selectedIds.includes(i.id)).length;

                      return (
                        <div
                          key={cat.key}
                          className="bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] overflow-hidden"
                        >
                          <button
                            onClick={() => setCollapsed({ ...collapsed, [cat.key]: !isCollapsed })}
                            className="w-full p-4 flex items-center justify-between bg-slate-50 border-b-2 border-[#0A0A0A] cursor-pointer"
                          >
                            <span className="font-black text-xs uppercase text-[#0A0A0A] flex items-center gap-2">
                              {cat.icon}
                              <span>{cat.label} ({selectedCatCount}/{cat.items.length})</span>
                            </span>
                            <ChevronDown
                              size={18}
                              className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                            />
                          </button>

                          {!isCollapsed && (
                            <div className="p-4 divide-y border-[#0A0A0A]/10 space-y-2">
                              {cat.items.length === 0 ? (
                                <div className="text-xs font-bold text-slate-500 py-3 italic text-center">
                                  {t('template.create.no_items', 'Немає доступних елементів у цій категорії')}
                                </div>
                              ) : (
                                cat.items.map((item) => (
                                  <label
                                    key={item.id}
                                    className="flex items-center gap-3 pt-2.5 first:pt-0 cursor-pointer hover:bg-slate-100 p-2 transition-all rounded-lg"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.includes(item.id)}
                                      onChange={() => toggleItem(item.id)}
                                      className="w-4 h-4 border-2 border-[#0A0A0A] accent-indigo-600 cursor-pointer shrink-0"
                                    />
                                    <span className="text-xs font-bold text-slate-800">{item.name}</span>
                                  </label>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="xl:col-span-1 space-y-4">
                  <div className="bg-white border-2 border-[#0A0A0A] p-5 shadow-[2px_2px_0px_#0A0A0A] space-y-3">
                    <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
                      <h3 className="font-black text-xs uppercase text-[#0A0A0A]">
                        {t('template.create.selected_items_title', 'Що обрано')}
                      </h3>
                      <span className="px-2 py-0.5 bg-[#0A0A0A] text-white border border-[#0A0A0A] font-black text-[10px] rounded">
                        {selectedIds.length}
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y border-2 border-[#0A0A0A] bg-slate-50 p-3 text-xs font-bold text-slate-800">
                      {selectedIds.length === 0 ? (
                        <div className="text-center text-slate-400 py-4 italic">
                          {t('template.create.no_items_selected', 'Нічого не обрано')}
                        </div>
                      ) : (
                        allItems.filter((i) => selectedIds.includes(i.id)).map((item) => (
                          <div key={item.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="bg-sky-50 border-2 border-[#0A0A0A] p-5 shadow-[2px_2px_0px_#0A0A0A] space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-wider text-sky-900 flex items-center gap-2">
                      <Info size={16} />
                      <span>{t('template.create.note_title', 'Зверніть увагу')}</span>
                    </h3>
                    
                    <div className="space-y-4 text-[11.5px] font-bold text-slate-800 leading-relaxed">
                      <div>
                        <h4 className="font-black text-[#0A0A0A] mb-1">{t('template.create.note_connected_title', 'Звʼязані елементи копіюються автоматично')}</h4>
                        <p className="text-slate-700">
                          {t('template.create.note_connected_desc', 'Вибір конкретної воронки автоматично включає повʼязані кроки та користувацькі поля.')}
                        </p>
                      </div>
                      
                      <div className="pt-3 border-t border-sky-200">
                        <h4 className="font-black text-[#0A0A0A] mb-1">{t('template.create.note_privacy_title', 'Конфіденційність та Ізоляція')}</h4>
                        <p className="text-slate-700">
                          {t('template.create.note_privacy_desc', 'Підписники, приватні чати, API-токени Telegram та платіжні дані НІКОЛИ не включаються у шаблони.')}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-['Anybody',sans-serif] text-lg font-black uppercase tracking-tight">
                  {isEditMode
                    ? `${t('template.edit.header_title', 'Редагувати шаблон')} ${templateName || createdTemplate?.name || ''}`
                    : t('template.create.final_steps_title', 'Фінальні налаштування')}
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[2px_2px_0px_#0A0A0A] space-y-6">
                  <h3 className="font-black text-xs uppercase text-[#0A0A0A] border-b-2 border-[#0A0A0A] pb-3">
                    {t('template.create.avatar_and_name_title', 'Аватар та назва шаблону')}
                  </h3>

                  <div className="space-y-5">
                    <div className="flex items-center gap-4">
                      <label className="relative w-16 h-16 bg-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] flex items-center justify-center cursor-pointer overflow-hidden group shrink-0 rounded-lg">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#F2EBDD] text-lg font-black font-['Anybody',sans-serif]">
                            {templateName ? (templateName.trim().length >= 2 ? templateName.trim().slice(0, 2).toUpperCase() : templateName.toUpperCase()) : 'JP'}
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Upload size={16} />
                        </div>
                      </label>

                      <div className="flex-1">
                        <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                          {t('template.create.template_name_label', 'Назва шаблону')} *
                        </label>
                        <input
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder={t('template.create.template_name_placeholder', 'Введіть назву шаблону...')}
                          className="w-full px-3.5 py-2.5 border-2 border-[#0A0A0A] bg-white text-xs font-black focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t-2 border-[#0A0A0A]/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-indigo-600" />
                        <div>
                          <span className="text-xs font-black uppercase text-[#0A0A0A]">
                            {t('template.create.protect_label', 'Захистити шаблон')}
                          </span>
                          <p className="text-[10px] font-bold text-slate-500">
                            {t('template.create.protect_desc', 'Забороняє отримувачам повторно експортувати вміст шаблону')}
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isProtected}
                        onChange={(e) => setIsProtected(e.target.checked)}
                        className="w-5 h-5 border-2 border-[#0A0A0A] accent-indigo-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[2px_2px_0px_#0A0A0A] space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
                    <h3 className="font-black text-xs uppercase text-[#0A0A0A]">
                      {t('template.create.preview_title', 'Попередній перегляд вмісту')}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-100 border-2 border-[#0A0A0A] flex items-center justify-between text-xs font-black text-slate-900 rounded-lg">
                      <span>{t('template.create.selected_items_count', '{{count}} обраних елементів', { count: selectedIds.length })}</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y border-2 border-[#0A0A0A] bg-slate-50 p-3 text-xs font-bold text-slate-800">
                      {selectedIds.length === 0 ? (
                        <div className="text-center text-slate-400 py-4 italic">
                          {t('template.create.no_items_selected', 'Нічого не обрано')}
                        </div>
                      ) : (
                        allItems.filter((i) => selectedIds.includes(i.id)).map((item) => (
                          <div key={item.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center gap-2">
                            <Check size={14} className="text-emerald-600 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
          {step === 3 && createdTemplate && (
            <div className="space-y-8 max-w-3xl mx-auto">
              <div className="bg-white border-2 border-[#0A0A0A] p-8 shadow-[2px_2px_0px_#0A0A0A] text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-400 border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-center mx-auto text-emerald-950">
                  <Check size={28} strokeWidth={3} />
                </div>
                <h2 className="font-['Anybody',sans-serif] text-xl font-black uppercase tracking-tight">
                  {t('template.create.success_heading', 'Чудова робота!')}
                </h2>
                <p className="text-xs font-black uppercase text-slate-600">
                  {isEditMode ? t('template.create.updated_success', 'Шаблон успішно оновлено') : t('template.create.success_sub', 'Шаблон успішно створено')}
                </p>

                <div className="pt-4 max-w-xl mx-auto space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-600 text-left">
                    {t('template.create.share_link_label', 'Поділіться цим шаблоном за постійним посиланням:')}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdTemplate?.shareUrl || (createdTemplate?.shareCode ? `${window.location.origin}/templates/install/${createdTemplate.shareCode}` : '')}
                      className="flex-1 px-4 py-2.5 border-2 border-[#0A0A0A] bg-slate-50 text-xs font-black select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span>{t('template.copied', 'Скопійовано!')}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>{t('template.copy', 'Копіювати')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] p-8 shadow-[2px_2px_0px_#0A0A0A] space-y-6">
                <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase border-b-2 border-[#0A0A0A] pb-3">
                  {t('template.create.details_heading', 'Налаштування опису та інструкцій')}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-[#0A0A0A] mb-1">
                      {t('template.create.about_label', 'Про шаблон *')}
                    </label>
                    <textarea
                      rows={4}
                      value={aboutText}
                      onChange={(e) => setAboutText(e.target.value)}
                      placeholder={t('template.create.about_placeholder', 'Опишіть як користуватися цим шаблоном, для якого бізнесу тощо...')}
                      className="w-full p-3 border-2 border-[#0A0A0A] bg-white text-xs font-bold focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-[#0A0A0A] mb-1">
                      {t('template.create.guide_url_label', 'Посилання на повну інструкцію')}
                    </label>
                    <input
                      type="text"
                      value={guideUrl}
                      onChange={(e) => setGuideUrl(e.target.value)}
                      placeholder={t('template.create.guide_url_placeholder', 'e.g. mysite.com/my-template-guide')}
                      className="w-full px-3 py-2 border-2 border-[#0A0A0A] bg-white text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-[#0A0A0A] mb-1">
                      {t('template.create.video_url_label', 'Посилання на відео-презентацію')}
                    </label>
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={t('template.create.video_url_placeholder', 'e.g. https://www.youtube.com/watch?v=XXXXXX')}
                      className="w-full px-3 py-2 border-2 border-[#0A0A0A] bg-white text-xs font-bold focus:outline-none"
                    />
                  </div>

                  {detailsSavedMsg && (
                    <div className="bg-emerald-100 border border-emerald-600 text-emerald-900 p-2.5 text-xs font-bold">
                      {t('template.create.saved_success', 'Налаштування шаблону успішно збережено!')}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveDetails}
                      disabled={savingDetails}
                      className="px-5 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white border border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2"
                    >
                      {savingDetails ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          <span>{t('common.saving', 'Зберігаємо...')}</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          <span>{t('common.save', 'Зберегти')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
};
