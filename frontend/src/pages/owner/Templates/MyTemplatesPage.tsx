import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Plus, Trash2, Loader2, Layers, Pencil, Eye, Download } from 'lucide-react';
import {
  getMyTemplatesApi,
  getInstalledTemplatesApi,
  deleteInstalledTemplateApi,
  deleteTemplateApi,
  type TemplateResponse,
} from '../../../api/templateApi';
import { useTranslation } from '../../../i18n/config';
import { ConfirmModal } from '../../../components/common/ConfirmModal';

export const MyTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'my' | 'installed'>(
    tabParam === 'installed' ? 'installed' : 'my'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'installed' || tab === 'my') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'my' | 'installed') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [myTemplates, setMyTemplates] = useState<TemplateResponse[]>([]);
  const [installedTemplates, setInstalledTemplates] = useState<TemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    shareCode: string;
    isInstalled: boolean;
  }>({
    isOpen: false,
    shareCode: '',
    isInstalled: false,
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [myRes, instRes] = await Promise.all([
        getMyTemplatesApi().catch(() => []),
        getInstalledTemplatesApi().catch(() => []),
      ]);
      setMyTemplates(myRes);
      setInstalledTemplates(instRes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async () => {
    if (!deleteModalState.shareCode) return;
    try {
      if (deleteModalState.isInstalled) {
        await deleteInstalledTemplateApi(deleteModalState.shareCode);
        setInstalledTemplates((prev) =>
          prev.filter((t) => t.shareCode !== deleteModalState.shareCode)
        );
      } else {
        await deleteTemplateApi(deleteModalState.shareCode);
        setMyTemplates((prev) =>
          prev.filter((t) => t.shareCode !== deleteModalState.shareCode)
        );
      }
    } catch {
      alert(t('template.my.error_delete', 'Не вдалося видалити шаблон.'));
    } finally {
      setDeleteModalState({ isOpen: false, shareCode: '', isInstalled: false });
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

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full font-['JetBrains_Mono',monospace] text-[#0A0A0A] bg-[#F2EBDD]">
        <div className="w-full h-16 min-h-[64px] max-h-[64px] bg-white border-b-2 border-[#0A0A0A] px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleTabChange('my')}
              className={`font-black text-xs uppercase tracking-wider transition-all cursor-pointer relative py-5 ${
                activeTab === 'my'
                  ? 'text-[#0A0A0A]'
                  : 'text-slate-500 hover:text-[#0A0A0A]'
              }`}
            >
              <span>{t('template.tab_my_templates', 'Мої темплейти')}</span>
              {activeTab === 'my' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0A0A0A]" />
              )}
            </button>

            <button
              onClick={() => handleTabChange('installed')}
              className={`font-black text-xs uppercase tracking-wider transition-all cursor-pointer relative py-5 ${
                activeTab === 'installed'
                  ? 'text-[#0A0A0A]'
                  : 'text-slate-500 hover:text-[#0A0A0A]'
              }`}
            >
              <span>{t('template.tab_installed_templates', 'Завантажені темплейти')}</span>
              {activeTab === 'installed' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0A0A0A]" />
              )}
            </button>
          </div>

          <button
            onClick={() => navigate('/templates/create')}
            className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white border border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus size={15} />
            <span>{t('template.my.create_btn', 'Новий темплейт')}</span>
          </button>
        </div>
        <div className="p-6 max-w-6xl w-full mx-auto space-y-6 flex-1">
          
          <div className="flex items-center justify-between">
            <h1 className="font-['Anybody',sans-serif] text-xl font-black uppercase tracking-tight text-[#0A0A0A]">
              {activeTab === 'my'
                ? t('template.my.title', 'Мої темплейти')
                : t('template.installed.title', 'Завантажені темплейти')}
            </h1>
          </div>

          {loading ? (
            <div className="py-16 bg-white border-2 border-[#0A0A0A] text-center space-y-3 shadow-[2px_2px_0px_#0A0A0A]">
              <Loader2 className="animate-spin mx-auto text-[#0A0A0A]" size={28} />
              <span className="text-xs font-bold uppercase">{t('common.loading', 'Завантаження темплейтів...')}</span>
            </div>
          ) : activeTab === 'my' ? (
            myTemplates.length === 0 ? (
              <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-[2px_2px_0px_#0A0A0A]">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] mx-auto mb-4">
                  <Layers size={32} />
                </div>
                <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] mb-1">
                  {t('template.my.empty_title', 'У вас ще немає створених темплейтів')}
                </h3>
                <p className="text-xs text-slate-600 font-bold max-w-md mx-auto mb-6">
                  {t('template.my.empty_desc', 'Створіть свій перший шаблон, щоб ділитися воронками та розсилками з іншими.')}
                </p>
                <button
                  onClick={() => navigate('/templates/create')}
                  className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white border border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer inline-flex items-center gap-2 rounded-xl"
                >
                  <Plus size={15} />
                  <span>{t('template.my.create_btn', 'Новий темплейт')}</span>
                </button>
              </div>
            ) : (
              <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-['JetBrains_Mono',monospace]">
                    <thead>
                      <tr className="border-b-2 border-[#0A0A0A] text-[#0A0A0A] text-[10px] font-black uppercase tracking-wider bg-white">
                        <th className="py-3.5 px-4 w-[13%]">{t('template.table.name', 'Назва шаблону')}</th>
                        <th className="py-3.5 px-4 w-[20%]">{t('template.table.automations', 'Автоматизації')}</th>
                        <th className="py-3.5 px-4 w-[20%] text-center">{t('template.table.broadcasts', 'Розсилки')}</th>
                        <th className="py-3.5 px-4 w-[15%] text-center">{t('template.table.fields_tags', 'Поля / Теги')}</th>
                        <th className="py-3.5 px-4 w-[12%] text-center">{t('template.table.created_at', 'Дата створення')}</th>
                        <th className="py-3.5 px-4 w-[10%] text-center">{t('template.table.stats', 'Статистика')}</th>
                        <th className="py-3.5 px-4 w-[10%] text-right">{t('template.table.action', 'Дія')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A0A0A]/15 text-xs font-bold text-[#0A0A0A]">
                      {myTemplates.map((tpl) => (
                        <tr
                          key={tpl.id}
                          onClick={() => navigate(`/templates/detail/${tpl.shareCode}`)}
                          className="hover:bg-white/70 cursor-pointer transition-all group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3 min-w-[120px]">
                              {tpl.avatarUrl ? (
                                <img
                                  src={tpl.avatarUrl}
                                  alt={tpl.name}
                                  className="w-10 h-10 object-cover border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] shrink-0 rounded-lg"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] flex items-center justify-center shrink-0 rounded-lg text-xs font-black font-['Anybody',sans-serif]">
                                  {getInitials(tpl.creatorName || tpl.name)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-extrabold text-sm text-[#0A0A0A] group-hover:text-indigo-600 transition-all uppercase block truncate">
                                  {tpl.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-xs font-extrabold text-indigo-700">
                              {`${tpl.flowCount || 1} ${t('template.count_flows', 'Воронок')}`}
                            </div>
                            <div className="text-[10.5px] font-bold text-slate-500 mt-0.5">
                              {`${tpl.nodeCount ?? 0} ${t('template.count_nodes', 'нодів')}, ${tpl.edgeCount ?? 0} ${t('template.count_edges', 'зв\'язків')}`}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-center">
                            {tpl.broadcastCount > 0 ? (
                              <div className="text-center">
                                <div className="text-xs font-extrabold text-slate-800">
                                  {`${tpl.broadcastCount} ${t('template.count_broadcasts', 'Розсилок')}`}
                                </div>
                                <div className="text-[10.5px] font-bold text-slate-500 mt-0.5">
                                  {`${tpl.broadcastNodeCount ?? 0} ${t('template.count_nodes', 'нодів')}, ${tpl.broadcastEdgeCount ?? 0} ${t('template.count_edges', 'зв\'язків')}`}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold block text-center">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-center">
                            {(tpl.fieldCount > 0 || tpl.tagCount > 0) ? (
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {tpl.fieldCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                    {`${tpl.fieldCount} ${t('template.count_fields', 'полів')}`}
                                  </span>
                                )}
                                {tpl.tagCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {`${tpl.tagCount} ${t('template.count_tags', 'тегів')}`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold block text-center">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 font-bold text-center">
                            {new Date(tpl.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-300">
                                <Eye size={12} className="text-slate-600" />
                                <span>{tpl.viewsCount ?? 0}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded border border-emerald-300">
                                <Download size={12} className="text-emerald-700" />
                                <span>{tpl.installsCount ?? 0}</span>
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => navigate(`/templates/edit/${tpl.shareCode}`)}
                                className="p-1.5 bg-white hover:bg-[#0A0A0A] hover:text-white border border-[#0A0A0A] text-[#0A0A0A] rounded-lg transition-all cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
                                title={t('common.edit', 'Редагувати')}
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => navigate(`/templates/detail/${tpl.shareCode}`)}
                                className="p-1.5 bg-white hover:bg-[#0A0A0A] hover:text-white border border-[#0A0A0A] text-[#0A0A0A] rounded-lg transition-all cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
                                title={t('template.view_template', 'Переглянути')}
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteModalState({
                                  isOpen: true,
                                  shareCode: tpl.shareCode,
                                  isInstalled: false,
                                })}
                                className="p-1.5 bg-rose-100 hover:bg-rose-600 hover:text-white border border-[#0A0A0A] text-rose-700 rounded-lg transition-all cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
                                title={t('common.delete', 'Видалити')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            installedTemplates.length === 0 ? (
              <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto shadow-[2px_2px_0px_#0A0A0A]">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] mx-auto mb-4">
                  <Layers size={32} />
                </div>
                <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] mb-1">
                  {t('template.no_installed_title', 'Немає встановлених шаблонів')}
                </h3>
                <p className="text-xs font-bold text-slate-600 max-w-sm mx-auto">
                  {t('template.no_installed_desc', 'Коли ви встановлюєте шаблони за посиланням, вони з\'являються тут.')}
                </p>
              </div>
            ) : (
              <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-['JetBrains_Mono',monospace]">
                    <thead>
                      <tr className="border-b-2 border-[#0A0A0A] text-[#0A0A0A] text-[10px] font-black uppercase tracking-wider bg-white">
                        <th className="py-3.5 px-4 w-[12%]">{t('template.table.name', 'Назва шаблону')}</th>
                        <th className="py-3.5 px-4 w-[13%] text-center">{t('template.table.author', 'Автор')}</th>
                        <th className="py-3.5 px-4 w-[21%]">{t('template.table.automations', 'Автоматизації')}</th>
                        <th className="py-3.5 px-4 w-[21%] text-center">{t('template.table.broadcasts', 'Розсилки')}</th>
                        <th className="py-3.5 px-4 w-[14%] text-center">{t('template.table.fields_tags', 'Поля / Теги')}</th>
                        <th className="py-3.5 px-4 w-[11%] text-center">{t('template.table.installed_at', 'Дата встановлення')}</th>
                        <th className="py-3.5 px-4 w-[8%] text-right">{t('template.table.action', 'Дія')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A0A0A]/15 text-xs font-bold text-[#0A0A0A]">
                      {installedTemplates.map((tpl) => (
                        <tr
                          key={tpl.id}
                          onClick={() => navigate(`/templates/detail/${tpl.shareCode}`)}
                          className="hover:bg-white/70 cursor-pointer transition-all group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3 min-w-[120px]">
                              {tpl.avatarUrl ? (
                                <img
                                  src={tpl.avatarUrl}
                                  alt={tpl.name}
                                  className="w-10 h-10 object-cover border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] shrink-0 rounded-lg"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-[#0A0A0A] text-white border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] flex items-center justify-center shrink-0 rounded-lg text-xs font-black font-['Anybody',sans-serif]">
                                  {getInitials(tpl.creatorName || tpl.name)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-extrabold text-sm text-[#0A0A0A] group-hover:text-indigo-600 transition-all uppercase block truncate">
                                  {tpl.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-xs font-extrabold text-slate-700 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800 uppercase text-[10.5px]">
                              {tpl.creatorName || 'Launchly User'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-xs font-extrabold text-indigo-700">
                              {`${tpl.flowCount || 1} ${t('template.count_flows', 'Воронок')}`}
                            </div>
                            <div className="text-[10.5px] font-bold text-slate-500 mt-0.5">
                              {`${tpl.nodeCount ?? 0} ${t('template.count_nodes', 'нодів')}, ${tpl.edgeCount ?? 0} ${t('template.count_edges', 'зв\'язків')}`}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-center">
                            {tpl.broadcastCount > 0 ? (
                              <div className="text-center">
                                <div className="text-xs font-extrabold text-slate-800">
                                  {`${tpl.broadcastCount} ${t('template.count_broadcasts', 'Розсилок')}`}
                                </div>
                                <div className="text-[10.5px] font-bold text-slate-500 mt-0.5">
                                  {`${tpl.broadcastNodeCount ?? 0} ${t('template.count_nodes', 'нодів')}, ${tpl.broadcastEdgeCount ?? 0} ${t('template.count_edges', 'зв\'язків')}`}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold block text-center">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-center">
                            {(tpl.fieldCount > 0 || tpl.tagCount > 0) ? (
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {tpl.fieldCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                    {`${tpl.fieldCount} ${t('template.count_fields', 'полів')}`}
                                  </span>
                                )}
                                {tpl.tagCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {`${tpl.tagCount} ${t('template.count_tags', 'тегів')}`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-bold block text-center">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 font-bold text-center">
                            {new Date(tpl.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => navigate(`/templates/detail/${tpl.shareCode}`)}
                                className="p-1.5 bg-white hover:bg-[#0A0A0A] hover:text-white border border-[#0A0A0A] text-[#0A0A0A] rounded-lg transition-all cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
                                title={t('template.view_template', 'Переглянути шаблон')}
                              >
                                <Eye size={13} />
                              </button>
                              <button
                                onClick={() => setDeleteModalState({
                                  isOpen: true,
                                  shareCode: tpl.shareCode,
                                  isInstalled: true,
                                })}
                                className="p-1.5 bg-rose-100 hover:bg-rose-600 hover:text-white border border-[#0A0A0A] text-rose-700 rounded-lg transition-all cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
                                title={t('common.delete', 'Видалити')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

        </div>
        <ConfirmModal
          isOpen={deleteModalState.isOpen}
          title={t('template.my.delete_title', 'Видалення темплейту')}
          message={
            deleteModalState.isInstalled
              ? t('template.my.confirm_delete_installed', 'Ви впевнені, що хочете видалити цей завантажений шаблон?')
              : t('template.my.confirm_delete_created', 'Ви впевнені, що хочете видалити цей шаблон?')
          }
          confirmText={t('common.delete', 'Видалити')}
          cancelText={t('common.cancel', 'Скасувати')}
          isDanger
          onConfirm={handleDelete}
          onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
        />

      </div>
    </DashboardLayout>
  );
};
