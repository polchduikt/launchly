import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  Trash2,
  Edit,
  Loader2,
  Workflow,
  Radio,
  Sliders,
  Tag as TagIcon,
  BookOpen,
  PlayCircle,
  Eye,
  Download,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import {
  getTemplateByShareCodeApi,
  deleteTemplateApi,
  deleteInstalledTemplateApi,
  type TemplateResponse,
} from '../../../api/templateApi';
import { ConfirmModal } from '../../../components/common/ConfirmModal';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTranslation } from '../../../i18n/config';

export const TemplateDetailPage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.user);

  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [collapsedAutomations, setCollapsedAutomations] = useState(false);
  const [collapsedBroadcasts, setCollapsedBroadcasts] = useState(false);
  const [collapsedFields, setCollapsedFields] = useState(false);
  const [collapsedTags, setCollapsedTags] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!shareCode) return;
    setLoading(true);
    getTemplateByShareCodeApi(shareCode)
      .then((res) => {
        setTemplate(res);
      })
      .catch(() => {
        alert(t('template.detail.not_found', 'Шаблон не знайдено.'));
        navigate('/templates');
      })
      .finally(() => setLoading(false));
  }, [shareCode, navigate]);

  const isCreator = Boolean(
    currentUser &&
    template &&
    ((template.creatorId && currentUser.id === template.creatorId) ||
      (template.creatorName && (currentUser.name === template.creatorName || currentUser.email === template.creatorName)))
  );

  const handleCopyLink = () => {
    if (!template?.shareUrl) return;
    navigator.clipboard.writeText(template.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDeleteConfirm = async () => {
    if (!shareCode) return;
    try {
      if (isCreator) {
        await deleteTemplateApi(shareCode);
      } else {
        await deleteInstalledTemplateApi(shareCode);
      }
      setIsDeleteModalOpen(false);
      navigate('/templates');
    } catch {
      alert(t('template.my.delete_error', 'Не вдалося видалити темплейт.'));
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'JP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading || !template) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="animate-spin text-[#0A0A0A]" size={36} />
          <span className="text-xs font-black uppercase text-[#0A0A0A] tracking-wider">
            {t('common.loading', 'Завантаження...')}
          </span>
        </div>
      </DashboardLayout>
    );
  }
  const automationName = template.sourceBotName || template.name;

  interface BroadcastItem {
    name: string;
    nodeCount?: number;
    edgeCount?: number;
  }
  const broadcastItems: BroadcastItem[] = [];
  if (template.broadcastsDataJson) {
    try {
      const parsed = JSON.parse(template.broadcastsDataJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((c: any) => {
          if (c && c.name) {
            let nCnt = 0;
            let eCnt = 0;
            if (c.nodes) {
              if (Array.isArray(c.nodes)) nCnt = c.nodes.length;
              else if (typeof c.nodes === 'string') {
                try { nCnt = JSON.parse(c.nodes).length; } catch {}
              }
            }
            if (c.edges) {
              if (Array.isArray(c.edges)) eCnt = c.edges.length;
              else if (typeof c.edges === 'string') {
                try { eCnt = JSON.parse(c.edges).length; } catch {}
              }
            }
            broadcastItems.push({ name: c.name, nodeCount: nCnt, edgeCount: eCnt });
          }
        });
      }
    } catch {}
  }
  if (broadcastItems.length === 0 && template.broadcastCount > 0) {
    for (let i = 1; i <= template.broadcastCount; i++) {
      broadcastItems.push({ name: `${t('template.create.fallback_broadcast', 'Розсилка')} #${i}` });
    }
  }

  const tagNames: string[] = [];
  if (template.tagsDataJson) {
    try {
      const parsed = JSON.parse(template.tagsDataJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((tg: any) => {
          if (typeof tg === 'string' && tg.trim()) tagNames.push(tg.trim());
          else if (tg && tg.name) tagNames.push(tg.name);
        });
      }
    } catch {}
  }
  const fieldNames: string[] = [];
  if (template.customFieldsDataJson) {
    try {
      const parsed = JSON.parse(template.customFieldsDataJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((f: any) => {
          if (typeof f === 'string' && f.trim()) fieldNames.push(f.trim());
          else if (f && f.name) fieldNames.push(f.name);
        });
      } else if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach((k) => {
          if (k.trim()) fieldNames.push(k.trim());
        });
      }
    } catch {}
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full font-['JetBrains_Mono',monospace] text-[#0A0A0A] bg-[#F2EBDD]">
        <div className="w-full h-16 min-h-[64px] max-h-[64px] bg-white border-b-2 border-[#0A0A0A] px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/templates')}
              className="px-3 py-1.5 bg-[#F2EBDD] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border border-[#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <ChevronLeft size={15} />
              <span>{t('common.back', 'Назад')}</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-black uppercase">
              <span className="text-slate-400">{t('template.breadcrumb_templates', 'Шаблони')}</span>
              <span className="text-slate-400">&gt;</span>
              <span className="text-[#0A0A0A] truncate max-w-xs font-['Anybody',sans-serif]">{template.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCreator && (
              <button
                onClick={() => navigate(`/templates/edit/${template.shareCode}`)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Edit size={14} />
                <span>{t('template.detail.edit_btn', 'Редагувати шаблон')}</span>
              </button>
            )}

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-600 hover:text-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>{isCreator ? t('template.delete_template', 'Видалити шаблон') : t('template.delete_installed', 'Видалити зі встановлених')}</span>
            </button>
          </div>
        </div>
        <div className="w-full bg-white border-b-2 border-[#0A0A0A] px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 text-xs font-bold text-slate-700 min-w-0">
            <span className="shrink-0 text-[#0A0A0A] font-black uppercase">
              {t('template.share_permanent_link', 'Поділіться цим шаблоном за постійним посиланням:')}
            </span>
            <div className="flex-1 flex items-center gap-2 min-w-0 bg-[#F2EBDD]/60 border-2 border-[#0A0A0A] px-3 py-1.5 rounded-lg">
              <ExternalLink size={14} className="text-indigo-600 shrink-0" />
              <input
                type="text"
                readOnly
                value={template.shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-transparent font-mono text-xs font-extrabold text-[#0A0A0A] focus:outline-none select-all"
              />
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-500 border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-950 font-black" />
                <span>{t('template.copied', 'Скопійовано')}</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>{t('template.copy', 'Копіювати')}</span>
              </>
            )}
          </button>
        </div>
        <div className="p-6 space-y-6 flex-1 max-w-6xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[4px_4px_0px_0px_#0A0A0A] space-y-4 rounded-xl">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase pb-2 border-b-2 border-[#0A0A0A]">
                  <span>
                    {t('template.author', 'Автор')}: <strong className="text-indigo-600 font-black">{template.creatorName || 'Launchly Creator'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  {template.avatarUrl ? (
                    <img
                      src={template.avatarUrl}
                      alt={template.name}
                      className="w-14 h-14 object-cover border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] shrink-0 rounded-xl"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-center shrink-0 rounded-xl text-lg font-black font-['Anybody',sans-serif]">
                      {getInitials(template.creatorName || template.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-['Anybody',sans-serif] text-xl font-black uppercase text-[#0A0A0A] truncate">
                      {template.name}
                    </h2>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {t('template.created_date', 'Створено')}: {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="border-2 border-[#0A0A0A] bg-white shadow-[3px_3px_0px_0px_#0A0A0A] overflow-hidden rounded-xl">
                  <button
                    onClick={() => setCollapsedAutomations(!collapsedAutomations)}
                    className="w-full p-3.5 flex items-center justify-between bg-[#F2EBDD] border-b-2 border-[#0A0A0A] cursor-pointer"
                  >
                    <span className="font-black text-xs uppercase text-[#0A0A0A] flex items-center gap-2">
                      <Workflow size={15} className="text-[#0A0A0A]" />
                      <span>{`${t('common.nav.automation', 'Автоматизація')}: ${template.flowCount || 1}`}</span>
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-200 text-[#0A0A0A] ${collapsedAutomations ? '-rotate-90' : ''}`} />
                  </button>

                  {!collapsedAutomations && (
                    <div className="p-4 bg-white text-xs font-bold text-slate-800 space-y-2">
                      <div className="py-2 px-3 bg-slate-50 border border-[#0A0A0A] rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Check size={15} className="text-emerald-600 shrink-0 stroke-[3]" />
                          <span className="text-[#0A0A0A] font-extrabold uppercase">{automationName}</span>
                        </div>
                        {(template.nodeCount !== undefined && template.nodeCount > 0) && (
                          <span className="text-[10px] text-slate-500 font-bold">
                            {`${template.nodeCount} ${t('template.count_nodes', 'нодів')}, ${template.edgeCount ?? 0} ${t('template.count_edges', 'зв\'язків')}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {broadcastItems.length > 0 && (
                  <div className="border-2 border-[#0A0A0A] bg-white shadow-[3px_3px_0px_0px_#0A0A0A] overflow-hidden rounded-xl">
                    <button
                      onClick={() => setCollapsedBroadcasts(!collapsedBroadcasts)}
                      className="w-full p-3.5 flex items-center justify-between bg-[#F2EBDD] border-b-2 border-[#0A0A0A] cursor-pointer"
                    >
                      <span className="font-black text-xs uppercase text-[#0A0A0A] flex items-center gap-2">
                        <Radio size={15} className="text-[#0A0A0A]" />
                        <span>{`${t('common.nav.broadcasts', 'Розсилки')}: ${broadcastItems.length}`}</span>
                      </span>
                      <ChevronDown size={16} className={`transition-transform duration-200 text-[#0A0A0A] ${collapsedBroadcasts ? '-rotate-90' : ''}`} />
                    </button>

                    {!collapsedBroadcasts && (
                      <div className="p-4 bg-white text-xs font-bold text-slate-800 space-y-2">
                        {broadcastItems.map((item, i) => (
                          <div key={i} className="py-2 px-3 bg-slate-50 border border-[#0A0A0A] rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Check size={15} className="text-emerald-600 shrink-0 stroke-[3]" />
                              <span className="text-[#0A0A0A] font-extrabold uppercase">{item.name}</span>
                            </div>
                            {item.nodeCount !== undefined && item.nodeCount > 0 && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                {`${item.nodeCount} ${t('template.count_nodes', 'нодів')}, ${item.edgeCount ?? 0} ${t('template.count_edges', 'зв\'язків')}`}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {fieldNames.length > 0 && (
                  <div className="border-2 border-[#0A0A0A] bg-white shadow-[3px_3px_0px_0px_#0A0A0A] overflow-hidden rounded-xl">
                    <button
                      onClick={() => setCollapsedFields(!collapsedFields)}
                      className="w-full p-3.5 flex items-center justify-between bg-[#F2EBDD] border-b-2 border-[#0A0A0A] cursor-pointer"
                    >
                      <span className="font-black text-xs uppercase text-[#0A0A0A] flex items-center gap-2">
                        <Sliders size={15} className="text-[#0A0A0A]" />
                        <span>{`${t('template.custom_fields', 'Користувацькі поля')}: ${fieldNames.length}`}</span>
                      </span>
                      <ChevronDown size={16} className={`transition-transform duration-200 text-[#0A0A0A] ${collapsedFields ? '-rotate-90' : ''}`} />
                    </button>

                    {!collapsedFields && (
                      <div className="p-4 bg-white text-xs font-bold text-slate-800 space-y-2">
                        {fieldNames.map((name, i) => (
                          <div key={i} className="py-2 px-3 bg-slate-50 border border-[#0A0A0A] rounded-lg flex items-center gap-2.5">
                            <Check size={15} className="text-emerald-600 shrink-0 stroke-[3]" />
                            <span className="text-[#0A0A0A] font-extrabold">{name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {tagNames.length > 0 && (
                  <div className="border-2 border-[#0A0A0A] bg-white shadow-[3px_3px_0px_0px_#0A0A0A] overflow-hidden rounded-xl">
                    <button
                      onClick={() => setCollapsedTags(!collapsedTags)}
                      className="w-full p-3.5 flex items-center justify-between bg-[#F2EBDD] border-b-2 border-[#0A0A0A] cursor-pointer"
                    >
                      <span className="font-black text-xs uppercase text-[#0A0A0A] flex items-center gap-2">
                        <TagIcon size={15} className="text-[#0A0A0A]" />
                        <span>{`${t('template.tags', 'Теги')}: ${tagNames.length}`}</span>
                      </span>
                      <ChevronDown size={16} className={`transition-transform duration-200 text-[#0A0A0A] ${collapsedTags ? '-rotate-90' : ''}`} />
                    </button>

                    {!collapsedTags && (
                      <div className="p-4 bg-white text-xs font-bold text-slate-800 space-y-2">
                        {tagNames.map((name, i) => (
                          <div key={i} className="py-2 px-3 bg-slate-50 border border-[#0A0A0A] rounded-lg flex items-center gap-2.5">
                            <Check size={15} className="text-emerald-600 shrink-0 stroke-[3]" />
                            <span className="text-[#0A0A0A] font-extrabold uppercase">{name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[4px_4px_0px_0px_#0A0A0A] space-y-4 rounded-xl">
                <h3 className="font-black text-xs uppercase text-[#0A0A0A] border-b-2 border-[#0A0A0A] pb-3 flex items-center gap-2">
                  <Eye size={15} className="text-indigo-600" />
                  <span>{t('template.stats.views', 'Статистика шаблону')}</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border-2 border-[#0A0A0A] rounded-lg text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-bold uppercase">
                      <Eye size={13} className="text-slate-500" />
                      <span>{t('template.stats.views', 'Перегляди')}</span>
                    </div>
                    <div className="text-xl font-black font-['Anybody',sans-serif] text-[#0A0A0A]">
                      {template.viewsCount ?? 0}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border-2 border-[#0A0A0A] rounded-lg text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-bold uppercase">
                      <Download size={13} className="text-emerald-600" />
                      <span>{t('template.stats.installs', 'Встановлення')}</span>
                    </div>
                    <div className="text-xl font-black font-['Anybody',sans-serif] text-emerald-900">
                      {template.installsCount ?? 0}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2.5 text-xs font-bold text-slate-700">
                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-indigo-950 font-black">
                      <span className="flex items-center gap-1.5">
                        <Workflow size={13} className="text-indigo-600" />
                        <span>{t('common.nav.automation', 'Автоматизація')}</span>
                      </span>
                      <span>{`${template.flowCount || 1} ${t('template.count_flows', 'воронка')}`}</span>
                    </div>
                    <div className="text-[11px] text-indigo-800 flex items-center justify-between pt-0.5">
                      <span className="font-semibold text-slate-500">{t('template.stats.structure', 'Структура:')}</span>
                      <span className="font-bold">
                        {`${template.nodeCount ?? 0} ${t('template.count_nodes', 'нодів')} • ${template.edgeCount ?? 0} ${t('template.count_edges', 'зв\'язків')}`}
                      </span>
                    </div>
                  </div>

                  {template.broadcastCount > 0 && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between text-amber-950 font-black">
                        <span className="flex items-center gap-1.5">
                          <Radio size={13} className="text-amber-600" />
                          <span>{t('common.nav.broadcasts', 'Розсилки')}</span>
                        </span>
                        <span>{`${template.broadcastCount} ${t('template.count_broadcasts', 'розсилок')}`}</span>
                      </div>
                      <div className="text-[11px] text-amber-800 flex items-center justify-between pt-0.5">
                        <span className="font-semibold text-slate-500">{t('template.stats.structure', 'Структура:')}</span>
                        <span className="font-bold">
                          {`${template.broadcastNodeCount ?? 0} ${t('template.count_nodes', 'нодів')} • ${template.broadcastEdgeCount ?? 0} ${t('template.count_edges', 'зв\'язків')}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {template.fieldCount > 0 && (
                    <div className="flex items-center justify-between px-1 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Sliders size={13} />
                        <span>{t('template.custom_fields', 'Користувацькі поля')}</span>
                      </span>
                      <span className="font-black text-[#0A0A0A]">{template.fieldCount}</span>
                    </div>
                  )}

                  {template.tagCount > 0 && (
                    <div className="flex items-center justify-between px-1 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <TagIcon size={13} />
                        <span>{t('template.tags', 'Теги')}</span>
                      </span>
                      <span className="font-black text-[#0A0A0A]">{template.tagCount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] p-6 shadow-[4px_4px_0px_0px_#0A0A0A] space-y-4 rounded-xl">
                <h3 className="font-black text-xs uppercase text-[#0A0A0A] border-b-2 border-[#0A0A0A] pb-3">
                  {t('template.about_title', 'Про шаблон')}
                </h3>

                <div className="space-y-4">
                  <div className="bg-[#F2EBDD]/50 border-2 border-[#0A0A0A] p-4 text-xs font-medium leading-relaxed text-slate-800 rounded-lg">
                    {template.description ? template.description : t('template.no_description', 'Опис відсутній.')}
                  </div>

                  {(template.guideUrl || template.videoUrl) && (
                    <div className="pt-2 border-t-2 border-[#0A0A0A]/10 space-y-2.5 text-xs font-black">
                      {template.guideUrl && (
                        <a
                          href={template.guideUrl.startsWith('http') ? template.guideUrl : `https://${template.guideUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-indigo-600 hover:underline p-2 bg-indigo-50 border border-indigo-200 rounded-lg"
                        >
                          <BookOpen size={16} />
                          <span>{t('template.guide_label', 'Інструкція з налаштування')}</span>
                        </a>
                      )}
                      {template.videoUrl && (
                        <a
                          href={template.videoUrl.startsWith('http') ? template.videoUrl : `https://${template.videoUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-amber-700 hover:underline p-2 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                          <PlayCircle size={16} />
                          <span>{t('template.video_label', 'Відео-презентація шаблону')}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title={isCreator ? t('template.delete_modal_title', 'Видалити шаблон') : t('template.delete_installed_title', 'Видалити зі встановлених')}
          message={
            isCreator
              ? t('template.delete_modal_desc', 'Ви впевнені, що хочете видалити цей шаблон? Його більше не можна буде встановити за посиланням.')
              : t('template.delete_installed_desc', 'Ви впевнені, що хочете видалити цей завантажений шаблон?')
          }
          confirmText={t('common.delete', 'Видалити')}
          cancelText={t('common.cancel', 'Скасувати')}
          isDanger
          onConfirm={handleDeleteConfirm}
          onClose={() => setIsDeleteModalOpen(false)}
        />

      </div>
    </DashboardLayout>
  );
};
