import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { Plus, Trash2, ChevronRight, Loader2, Layers } from 'lucide-react';
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'my' | 'installed'>('my');

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [myRes, instRes] = await Promise.all([
        getMyTemplatesApi().catch(() => []),
        getInstalledTemplatesApi().catch(() => []),
      ]);
      setMyTemplates(Array.isArray(myRes) ? myRes : []);
      setInstalledTemplates(Array.isArray(instRes) ? instRes : []);
    } catch {
      setMyTemplates([]);
      setInstalledTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteConfirm = async () => {
    const { shareCode, isInstalled } = deleteModalState;
    if (!shareCode) return;
    try {
      if (isInstalled) {
        await deleteInstalledTemplateApi(shareCode);
        setInstalledTemplates((prev) => prev.filter((t) => t.shareCode !== shareCode));
      } else {
        await deleteTemplateApi(shareCode);
        setMyTemplates((prev) => prev.filter((t) => t.shareCode !== shareCode));
      }
    } catch (err) {
      alert(t('template.my.error_delete', 'Не вдалося видалити шаблон.'));
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
        <div className="w-full h-16 min-h-[64px] max-h-[64px] bg-white border-b-2 border-[#0A0A0A] px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-6 h-full">
            <button
              onClick={() => setActiveTab('my')}
              className={`h-full flex items-center text-xs font-black uppercase cursor-pointer transition-all border-b-3 ${
                activeTab === 'my'
                  ? 'border-[#0A0A0A] text-[#0A0A0A]'
                  : 'border-transparent text-slate-400 hover:text-[#0A0A0A]'
              }`}
            >
              {t('template.tab_my_templates', 'Мої темплейти')}
            </button>

            <button
              onClick={() => setActiveTab('installed')}
              className={`h-full flex items-center text-xs font-black uppercase cursor-pointer transition-all border-b-3 ${
                activeTab === 'installed'
                  ? 'border-[#0A0A0A] text-[#0A0A0A]'
                  : 'border-transparent text-slate-400 hover:text-[#0A0A0A]'
              }`}
            >
              {t('template.tab_installed_templates', 'Завантажені темплейти')}
            </button>
          </div>

          <div className="flex items-center">
            {activeTab === 'my' ? (
              <button
                onClick={() => navigate('/templates/create')}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border border-[#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-[2px_2px_0px_#0A0A0A]"
              >
                <Plus size={15} />
                <span>{t('template.my.create_btn', 'Новий темплейт')}</span>
              </button>
            ) : (
              <div className="w-1 h-8" />
            )}
          </div>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div className="flex items-center justify-between">
            <h1 className="font-['Anybody',sans-serif] text-lg font-black uppercase tracking-tight">
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
              <div className="bg-white border-2 border-[#0A0A0A] p-12 text-center shadow-[2px_2px_0px_#0A0A0A] space-y-4">
                <Layers size={36} className="mx-auto text-slate-400" />
                <h3 className="font-black text-xs uppercase text-slate-700">
                  {t('template.my.empty_title', 'У вас ще немає створених темплейтів')}
                </h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  {t('template.my.empty_desc', 'Створіть свій перший шаблон акаунту, щоб ділитися воронками та розсилками з іншими.')}
                </p>
                <button
                  onClick={() => navigate('/templates/create')}
                  className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus size={15} />
                  <span>{t('template.my.create_btn', 'Новий темплейт')}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => navigate(`/templates/detail/${tpl.shareCode}`)}
                    className="bg-white border-2 border-[#0A0A0A] p-4 shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-between hover:bg-amber-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {tpl.avatarUrl ? (
                        <img
                          src={tpl.avatarUrl}
                          alt={tpl.name}
                          className="w-10 h-10 object-cover border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] shrink-0 rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] flex items-center justify-center shrink-0 rounded-lg text-xs font-black font-['Anybody',sans-serif]">
                          {getInitials(tpl.creatorName || tpl.name)}
                        </div>
                      )}

                      <div>
                        <h4 className="font-black text-xs text-[#0A0A0A] group-hover:text-indigo-600 transition-colors uppercase">
                          {tpl.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                          {new Date(tpl.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModalState({
                            isOpen: true,
                            shareCode: tpl.shareCode,
                            isInstalled: false,
                          });
                        }}
                        className="p-1.5 bg-rose-100 hover:bg-rose-600 hover:text-white border border-[#0A0A0A] text-rose-700 transition-all cursor-pointer"
                        title={t('common.delete', 'Видалити')}
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
              installedTemplates.length === 0 ? (
              <div className="bg-white border-2 border-[#0A0A0A] p-12 text-center shadow-[2px_2px_0px_#0A0A0A] space-y-4">
                <Layers size={36} className="mx-auto text-slate-400" />
                <h3 className="font-black text-xs uppercase text-slate-700">
                  {t('template.installed.empty_title', 'Немає завантажених темплейтів')}
                </h3>
                <p className="text-xs text-slate-500 font-bold max-w-md mx-auto">
                  {t('template.installed.empty_desc', 'Темплейти, які ви встановите за публічними посиланнями, відображатимуться тут.')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {installedTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => navigate(`/templates/detail/${tpl.shareCode}`)}
                    className="bg-white border-2 border-[#0A0A0A] p-4 shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-between hover:bg-amber-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {tpl.avatarUrl ? (
                        <img
                          src={tpl.avatarUrl}
                          alt={tpl.name}
                          className="w-10 h-10 object-cover border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] shrink-0 rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] flex items-center justify-center shrink-0 rounded-lg text-xs font-black font-['Anybody',sans-serif]">
                          {getInitials(tpl.creatorName || tpl.name)}
                        </div>
                      )}

                      <div>
                        <h4 className="font-black text-xs text-[#0A0A0A] group-hover:text-indigo-600 transition-colors uppercase">
                          {tpl.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-bold uppercase">
                            {`Автор: ${tpl.creatorName || 'Launchly'}`}
                          </span>
                          <span className="text-slate-300">|</span>
                          <span className="text-[10px] font-bold text-indigo-600">
                            {`${tpl.flowCount || 1} Воронок`}
                          </span>
                          {tpl.broadcastCount > 0 && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="text-[10px] font-bold text-amber-600">
                                {`${tpl.broadcastCount} Розсилок`}
                              </span>
                            </>
                          )}
                          {tpl.fieldCount > 0 && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="text-[10px] font-bold text-sky-600">
                                {`${tpl.fieldCount} Полів`}
                              </span>
                            </>
                          )}
                          {tpl.tagCount > 0 && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span className="text-[10px] font-bold text-emerald-600">
                                {`${tpl.tagCount} Тегів`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/templates/detail/${tpl.shareCode}`);
                        }}
                        className="px-3 py-1 bg-white hover:bg-slate-100 border border-[#0A0A0A] text-xs font-black uppercase cursor-pointer"
                      >
                        {t('common.details', 'Деталі')}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModalState({
                            isOpen: true,
                            shareCode: tpl.shareCode,
                            isInstalled: true,
                          });
                        }}
                        className="p-1.5 bg-rose-100 hover:bg-rose-600 hover:text-white border border-[#0A0A0A] text-rose-700 transition-all cursor-pointer"
                        title={t('common.delete', 'Видалити')}
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-[#0A0A0A] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
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
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
        />

      </div>
    </DashboardLayout>
  );
};
