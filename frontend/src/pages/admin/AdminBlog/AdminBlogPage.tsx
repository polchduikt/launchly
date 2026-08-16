import React, { useState, useMemo, useRef } from 'react';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import {
  useAdminBlogArticlesQuery,
  useCreateBlogArticleMutation,
  useUpdateBlogArticleMutation,
  useDeleteBlogArticleMutation,
} from '../../../hooks/admin/useAdminBlogQueries';
import { useMediaUpload } from '../../../hooks/bot/useMediaUpload';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTranslation, getLanguage } from '../../../i18n/config';
import type { BlogArticle } from '../../../const/blogData';
import type { SaveBlogArticlePayload } from '../../../api/adminBlog';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  BookOpen,
  Calendar,
  Clock,
  User as UserIcon,
  Image as ImageIcon,
  Type,
  Heading2,
  Heading3,
  Quote,
  List as ListIcon,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  AlertTriangle,
  Loader2,
  FileText,
  Layers,
  ArrowLeft,
  UploadCloud,
} from 'lucide-react';

type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level: number }
  | { type: 'quote'; text: string; author?: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; url: string; caption?: string };

export const AdminBlogPage: React.FC = () => {
  const { t } = useTranslation();
  const currentUser = useAuthStore((state) => state.user);

  const { data: articles = [], isLoading } = useAdminBlogArticlesQuery();
  const createMutation = useCreateBlogArticleMutation();
  const deleteMutation = useDeleteBlogArticleMutation();

  const coverUploadMutation = useMediaUpload('blog');
  const blockImageUploadMutation = useMediaUpload('blog');

  const defaultCategories = [
    { key: 'cat_guides', label: t('admin.blog.cat_guides', 'Гайди'), value: 'Гайди' },
    { key: 'cat_updates', label: t('admin.blog.cat_updates', 'Оновлення'), value: 'Оновлення' },
    { key: 'cat_marketing', label: t('admin.blog.cat_marketing', 'Маркетинг'), value: 'Маркетинг' },
    { key: 'cat_telegram', label: t('admin.blog.cat_telegram', 'Telegram'), value: 'Telegram' },
    { key: 'cat_tips', label: t('admin.blog.cat_tips', 'Поради'), value: 'Поради' },
    { key: 'cat_cases', label: t('admin.blog.cat_cases', 'Кейси'), value: 'Кейси' },
  ];

  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLangFilter, setSelectedLangFilter] = useState<string>('all');

  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Гайди');
  const [formLanguage, setFormLanguage] = useState<string>('uk');
  const [formAuthor, setFormAuthor] = useState('');
  const [formReadTime, setFormReadTime] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formBlocks, setFormBlocks] = useState<ContentBlock[]>([]);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [formError, setFormError] = useState<string | null>(null);

  const [uploadingBlockIndex, setUploadingBlockIndex] = useState<number | null>(null);

  const [articleToDelete, setArticleToDelete] = useState<BlogArticle | null>(null);

  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useUpdateBlogArticleMutation(editingArticleId);

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (selectedLangFilter !== 'all' && (article.language || 'uk').toLowerCase() !== selectedLangFilter.toLowerCase()) {
        return false;
      }
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = article.title?.toLowerCase().includes(q);
        const matchSummary = article.summary?.toLowerCase().includes(q);
        const matchCategory = article.category?.toLowerCase().includes(q);
        const matchTags = article.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchSummary && !matchCategory && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [articles, selectedCategory, selectedLangFilter, searchQuery]);

  const computedReadTime = useMemo(() => {
    const allText = [
      formTitle,
      formSummary,
      ...formBlocks.map((b) => {
        if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote') return b.text;
        if (b.type === 'list') return b.items.join(' ');
        return '';
      }),
    ].join(' ');
    const words = allText.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} ${formLanguage === 'uk' ? 'хв' : 'min'}`;
  }, [formTitle, formSummary, formBlocks, formLanguage]);

  const handleOpenCreateView = () => {
    setEditingArticleId(null);
    setFormId('');
    setFormTitle('');
    setFormCategory('Гайди');
    setFormLanguage(getLanguage() || 'uk');
    setFormAuthor(currentUser?.name || 'Launchly Team');
    setFormReadTime('');
    const now = new Date();
    const lang = getLanguage();
    setFormDate(
      now.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
    setFormSummary('');
    setFormCoverImage('');
    setFormTags('');
    setFormBlocks([
      { type: 'paragraph', text: '' },
    ]);
    setActiveTab('builder');
    setFormError(null);
    setViewMode('editor');
  };

  const handleOpenEditView = (article: BlogArticle) => {
    setEditingArticleId(article.id);
    setFormId(article.id);
    setFormTitle(article.title || '');
    setFormCategory(article.category || 'Гайди');
    setFormLanguage(article.language || 'uk');
    setFormAuthor(article.author || currentUser?.name || 'Launchly Team');
    setFormReadTime(article.readTime || '');
    setFormDate(article.date || '');
    setFormSummary(article.summary || '');
    setFormCoverImage(article.coverImage || '');
    setFormTags((article.tags || []).join(', '));
    setFormBlocks(
      article.contentBlocks && article.contentBlocks.length > 0
        ? JSON.parse(JSON.stringify(article.contentBlocks))
        : [{ type: 'paragraph', text: '' }]
    );
    setActiveTab('builder');
    setFormError(null);
    setViewMode('editor');
  };

  const handleCoverFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    coverUploadMutation.mutate(file, {
      onSuccess: (res) => {
        setFormCoverImage(res.url);
      },
      onError: (err: any) => {
        setFormError(err?.response?.data?.message || 'Помилка завантаження фото');
      },
    });
  };

  const handleBlockImageUpload = (index: number, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingBlockIndex(index);
    blockImageUploadMutation.mutate(file, {
      onSuccess: (res) => {
        const next = [...formBlocks];
        const cur = next[index];
        if (cur && cur.type === 'image') {
          next[index] = { ...cur, url: res.url };
          setFormBlocks(next);
        }
        setUploadingBlockIndex(null);
      },
      onError: (err: any) => {
        setUploadingBlockIndex(null);
        setFormError(err?.response?.data?.message || 'Помилка завантаження фото блоку');
      },
    });
  };

  const handleAddBlock = (type: 'paragraph' | 'h2' | 'h3' | 'quote' | 'list' | 'image') => {
    switch (type) {
      case 'paragraph':
        setFormBlocks([...formBlocks, { type: 'paragraph', text: '' }]);
        break;
      case 'h2':
        setFormBlocks([...formBlocks, { type: 'heading', text: '', level: 2 }]);
        break;
      case 'h3':
        setFormBlocks([...formBlocks, { type: 'heading', text: '', level: 3 }]);
        break;
      case 'quote':
        setFormBlocks([...formBlocks, { type: 'quote', text: '', author: '' }]);
        break;
      case 'list':
        setFormBlocks([...formBlocks, { type: 'list', items: [''] }]);
        break;
      case 'image':
        setFormBlocks([...formBlocks, { type: 'image', url: '', caption: '' }]);
        break;
    }
  };

  const handleUpdateBlock = (index: number, updated: ContentBlock) => {
    const next = [...formBlocks];
    next[index] = updated;
    setFormBlocks(next);
  };

  const handleRemoveBlock = (index: number) => {
    setFormBlocks(formBlocks.filter((_, i) => i !== index));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formBlocks.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const next = [...formBlocks];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setFormBlocks(next);
  };

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError(t('admin.blog.error_title_required', 'Заголовок є обов’язковим полем'));
      return;
    }
    if (!formCategory.trim()) {
      setFormError(t('admin.blog.error_category_required', 'Категорія є обов’язковим полем'));
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: SaveBlogArticlePayload = {
      id: formId.trim() || undefined,
      title: formTitle.trim(),
      category: formCategory.trim(),
      language: formLanguage,
      author: formAuthor.trim() || undefined,
      readTime: formReadTime.trim() || undefined,
      date: formDate.trim() || undefined,
      summary: formSummary.trim() || undefined,
      coverImage: formCoverImage.trim() || undefined,
      tags: tagsArray,
      contentBlocks: formBlocks,
    };

    setFormError(null);

    if (editingArticleId) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          setViewMode('list');
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.message || t('admin.blog.error_update', 'Помилка оновлення статті'));
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setViewMode('list');
        },
        onError: (err: any) => {
          setFormError(err?.response?.data?.message || t('admin.blog.error_create', 'Помилка створення статті'));
        },
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!articleToDelete) return;
    deleteMutation.mutate(articleToDelete.id, {
      onSuccess: () => {
        setArticleToDelete(null);
      },
    });
  };

  if (viewMode === 'editor') {
    return (
      <AdminLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-12 font-['JetBrains_Mono',monospace]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-3.5 py-2 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
              >
                <ArrowLeft size={14} />
                <span>{t('admin.blog.btn_back_to_list', 'Назад до списку статей')}</span>
              </button>

              <div className="h-6 w-[2px] bg-slate-200 hidden sm:block" />

              <h2 className="font-['Anybody',sans-serif] text-base md:text-lg font-black text-[#0A0A0A] uppercase tracking-tight">
                {editingArticleId
                  ? t('admin.blog.modal_edit_title', 'Редагувати статтю блогу')
                  : t('admin.blog.modal_create_title', 'Створити нову статтю')}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 border-2 border-[#0A0A0A] rounded-xl p-0.5 shadow-[2px_2px_0px_#0A0A0A]">
                <button
                  type="button"
                  onClick={() => setActiveTab('builder')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                    activeTab === 'builder'
                      ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                      : 'text-slate-600 hover:text-[#0A0A0A]'
                  }`}
                >
                  {t('admin.blog.tab_builder', 'Конструктор')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                      : 'text-slate-600 hover:text-[#0A0A0A]'
                  }`}
                >
                  {t('admin.blog.tab_preview', 'Попередній перегляд')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveArticle}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase flex items-center gap-2 hover:bg-[#2A2A2A] disabled:opacity-50 transition cursor-pointer shadow-[3px_3px_0px_#0A0A0A]"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                <span>
                  {editingArticleId
                    ? t('admin.blog.btn_save_changes', 'Зберегти зміни')
                    : t('admin.blog.btn_publish', 'Опублікувати статтю')}
                </span>
              </button>
            </div>
          </div>

          {formError && (
            <div className="p-4 bg-rose-100 border-2 border-rose-600 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2 shadow-[4px_4px_0px_#0A0A0A]">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {activeTab === 'builder' ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] space-y-5">
                <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wider pb-3 border-b-2 border-slate-100">
                  {t('admin.blog.sec_general', '1. Основна інформація')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-[#0A0A0A] block">
                      {t('admin.blog.label_language', 'Мова статті / Аудиторія *')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormLanguage('uk')}
                        className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-black text-xs uppercase flex items-center justify-center cursor-pointer transition ${
                          formLanguage === 'uk'
                            ? 'bg-blue-600 text-white border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                            : 'bg-white text-[#0A0A0A] border-slate-300 hover:border-[#0A0A0A]'
                        }`}
                      >
                        {t('admin.blog.lang_uk', 'Українська')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormLanguage('en')}
                        className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-black text-xs uppercase flex items-center justify-center cursor-pointer transition ${
                          formLanguage === 'en'
                            ? 'bg-amber-400 text-[#0A0A0A] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                            : 'bg-white text-[#0A0A0A] border-slate-300 hover:border-[#0A0A0A]'
                        }`}
                      >
                        {t('admin.blog.lang_en', 'English')}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase text-[#0A0A0A] block">
                      {t('admin.blog.label_slug', 'URL Slug (ідентифікатор)')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('admin.blog.placeholder_slug', 'автоматично з заголовка, напр. how-to-create-telegram-bot')}
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-black uppercase text-[#0A0A0A] block">
                      {t('admin.blog.label_title', 'Заголовок статті *')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t('admin.blog.placeholder_title', 'напр. Як створити Telegram бота для бізнесу за 10 хвилин')}
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-black uppercase text-[#0A0A0A] block">
                      {t('admin.blog.label_category', 'Категорія *')}
                    </label>
                    <div className="flex gap-1.5 flex-wrap pb-1">
                      {defaultCategories.map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setFormCategory(cat.value)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer transition ${
                            formCategory === cat.value
                              ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]'
                              : 'bg-white text-[#0A0A0A] border-slate-300 hover:border-[#0A0A0A]'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Гайди"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black uppercase text-[#0A0A0A] block">
                      {t('admin.blog.label_cover', 'Обкладинка статті')}
                    </label>

                    <input
                      type="file"
                      ref={coverFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverFileUpload(file);
                      }}
                    />

                    {formCoverImage ? (
                      <div className="relative rounded-2xl border-2 border-[#0A0A0A] overflow-hidden max-w-lg aspect-[16/9] shadow-[4px_4px_0px_#0A0A0A] bg-slate-100 group">
                        <img src={formCoverImage} alt="Cover preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => coverFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white text-[#0A0A0A] rounded-xl text-xs font-black uppercase border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] hover:bg-slate-100 cursor-pointer"
                          >
                            {t('admin.blog.change_image', 'Змінити фото')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormCoverImage('')}
                            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] hover:bg-rose-700 cursor-pointer"
                          >
                            {t('admin.blog.remove_image', 'Видалити фото')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => coverFileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleCoverFileUpload(file);
                        }}
                        className="border-2 border-dashed border-[#0A0A0A] rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex flex-col items-center justify-center gap-2"
                      >
                        {coverUploadMutation.isPending ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-[#0A0A0A]" size={28} />
                            <span className="text-xs font-bold text-slate-600">
                              {t('admin.blog.dropzone_uploading', 'Завантаження фото...')}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-2xl bg-amber-200 border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
                              <UploadCloud size={24} />
                            </div>
                            <div className="text-xs font-black uppercase text-[#0A0A0A]">
                              {t('admin.blog.dropzone_title', 'Перетягніть фото сюди або натисніть для вибору')}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {t('admin.blog.dropzone_hint', 'PNG, JPG, WEBP або GIF (до 10 МБ)')}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-black uppercase text-[#0A0A0A] block">
                      {t('admin.blog.label_summary', 'Короткий опис (Summary)')}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={t('admin.blog.placeholder_summary', 'Короткий зміст або лід статті для карток та пошукових систем...')}
                      value={formSummary}
                      onChange={(e) => setFormSummary(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none resize-none font-['Geist',sans-serif]"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-black uppercase text-[#0A0A0A] block">
                      {t('admin.blog.label_tags', 'Теги (через кому)')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('admin.blog.placeholder_tags', 'telegram, bots, marketing, automation')}
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-100">
                  <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wider">
                    {t('admin.blog.sec_blocks', '2. Блоки статті')} ({formBlocks.length})
                  </h3>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('paragraph')}
                      className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <Type size={13} />
                      <span>{t('admin.blog.btn_add_paragraph', '+ Абзац')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('h2')}
                      className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <Heading2 size={13} />
                      <span>{t('admin.blog.btn_add_h2', '+ Заголовок H2')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('h3')}
                      className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <Heading3 size={13} />
                      <span>{t('admin.blog.btn_add_h3', '+ H3')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('quote')}
                      className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <Quote size={13} />
                      <span>{t('admin.blog.btn_add_quote', '+ Цитата')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('list')}
                      className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <ListIcon size={13} />
                      <span>{t('admin.blog.btn_add_list', '+ Список')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('image')}
                      className="px-3 py-1.5 bg-slate-100 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#0A0A0A]"
                    >
                      <ImageIcon size={13} />
                      <span>{t('admin.blog.btn_add_image', '+ Зображення')}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {formBlocks.map((block, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-slate-50 border-2 border-[#0A0A0A] rounded-2xl space-y-3 relative shadow-[3px_3px_0px_#0A0A0A]"
                    >
                      <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-slate-200">
                        <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-md text-[#0A0A0A]">
                            #{idx + 1}
                          </span>
                          <span className="text-[#0A0A0A] font-black">
                            {block.type === 'paragraph' && t('admin.blog.block_paragraph', 'Абзац тексту')}
                            {block.type === 'heading' && t('admin.blog.block_heading', { level: block.level || 2 })}
                            {block.type === 'quote' && t('admin.blog.block_quote', 'Цитата')}
                            {block.type === 'list' && t('admin.blog.block_list', 'Маркований список')}
                            {block.type === 'image' && t('admin.blog.block_image', 'Зображення')}
                          </span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveBlock(idx, 'up')}
                            className="w-7 h-7 rounded-xl border-2 border-[#0A0A0A] bg-white flex items-center justify-center text-[#0A0A0A] disabled:opacity-30 cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === formBlocks.length - 1}
                            onClick={() => handleMoveBlock(idx, 'down')}
                            className="w-7 h-7 rounded-xl border-2 border-[#0A0A0A] bg-white flex items-center justify-center text-[#0A0A0A] disabled:opacity-30 cursor-pointer shadow-[1px_1px_0px_#0A0A0A]"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(idx)}
                            className="w-7 h-7 rounded-xl border-2 border-rose-600 bg-rose-50 text-rose-700 flex items-center justify-center cursor-pointer hover:bg-rose-100 shadow-[1px_1px_0px_#0A0A0A]"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {block.type === 'paragraph' && (
                        <textarea
                          rows={4}
                          placeholder={t('admin.blog.placeholder_paragraph', 'Введіть текст абзацу...')}
                          value={block.text}
                          onChange={(e) => handleUpdateBlock(idx, { ...block, text: e.target.value })}
                          className="w-full p-3 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none font-['Geist',sans-serif] leading-relaxed"
                        />
                      )}

                      {block.type === 'heading' && (
                        <div className="flex gap-2 items-center">
                          <select
                            value={block.level}
                            onChange={(e) =>
                              handleUpdateBlock(idx, { ...block, level: Number(e.target.value) })
                            }
                            className="px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] focus:outline-none shrink-0"
                          >
                            <option value={2}>H2</option>
                            <option value={3}>H3</option>
                          </select>
                          <input
                            type="text"
                            placeholder={t('admin.blog.placeholder_heading', 'Текст заголовка...')}
                            value={block.text}
                            onChange={(e) => handleUpdateBlock(idx, { ...block, text: e.target.value })}
                            className="flex-1 px-3.5 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none"
                          />
                        </div>
                      )}

                      {block.type === 'quote' && (
                        <div className="space-y-2.5">
                          <textarea
                            rows={3}
                            placeholder={t('admin.blog.placeholder_quote', 'Текст цитати...')}
                            value={block.text}
                            onChange={(e) => handleUpdateBlock(idx, { ...block, text: e.target.value })}
                            className="w-full p-3 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-medium italic text-[#0A0A0A] focus:outline-none font-['Geist',sans-serif]"
                          />
                          <input
                            type="text"
                            placeholder={t('admin.blog.placeholder_quote_author', 'Автор цитати (напр. Стів Джобс або Експерт Launchly)...')}
                            value={block.author || ''}
                            onChange={(e) => handleUpdateBlock(idx, { ...block, author: e.target.value })}
                            className="w-full px-3.5 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none"
                          />
                        </div>
                      )}

                      {block.type === 'list' && (
                        <div className="space-y-2.5">
                          {block.items.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-400">•</span>
                              <input
                                type="text"
                                placeholder={t('admin.blog.placeholder_list_item', { index: itemIdx + 1 })}
                                value={item}
                                onChange={(e) => {
                                  const newItems = [...block.items];
                                  newItems[itemIdx] = e.target.value;
                                  handleUpdateBlock(idx, { ...block, items: newItems });
                                }}
                                className="flex-1 px-3.5 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none font-['Geist',sans-serif]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = block.items.filter((_, i) => i !== itemIdx);
                                  handleUpdateBlock(idx, { ...block, items: newItems });
                                }}
                                className="w-7 h-7 rounded-lg border border-slate-300 text-slate-500 hover:text-rose-600 hover:border-rose-600 flex items-center justify-center cursor-pointer"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateBlock(idx, { ...block, items: [...block.items, ''] });
                            }}
                            className="px-3 py-1.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-slate-800 hover:bg-slate-100 cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                          >
                            {t('admin.blog.btn_add_list_item', '+ Додати пункт списку')}
                          </button>
                        </div>
                      )}

                      {block.type === 'image' && (
                        <div className="space-y-3">
                          {block.url ? (
                            <div className="relative rounded-2xl border-2 border-[#0A0A0A] overflow-hidden max-w-md aspect-[16/9] shadow-[3px_3px_0px_#0A0A0A] bg-slate-100 group">
                              <img src={block.url} alt={block.caption || 'Block'} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <label className="px-3 py-1.5 bg-white text-[#0A0A0A] rounded-xl text-xs font-black uppercase border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] hover:bg-slate-100 cursor-pointer">
                                  {t('admin.blog.change_image', 'Змінити фото')}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleBlockImageUpload(idx, file);
                                    }}
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBlock(idx, { ...block, url: '' })}
                                  className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] hover:bg-rose-700 cursor-pointer"
                                >
                                  {t('admin.blog.remove_image', 'Видалити фото')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-[#0A0A0A] rounded-2xl p-6 text-center bg-white hover:bg-slate-100 transition cursor-pointer flex flex-col items-center justify-center gap-2 block">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleBlockImageUpload(idx, file);
                                }}
                              />
                              {uploadingBlockIndex === idx ? (
                                <div className="flex flex-col items-center gap-2">
                                  <Loader2 className="animate-spin text-[#0A0A0A]" size={24} />
                                  <span className="text-xs font-bold text-slate-600">
                                    {t('admin.blog.dropzone_uploading', 'Завантаження фото...')}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div className="w-10 h-10 rounded-xl bg-purple-100 border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A]">
                                    <UploadCloud size={20} />
                                  </div>
                                  <div className="text-xs font-black uppercase text-[#0A0A0A]">
                                    {t('admin.blog.dropzone_title', 'Перетягніть фото сюди або натисніть для вибору')}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium">
                                    {t('admin.blog.dropzone_hint', 'PNG, JPG, WEBP або GIF (до 10 МБ)')}
                                  </div>
                                </>
                              )}
                            </label>
                          )}

                          <input
                            type="text"
                            placeholder={t('admin.blog.placeholder_image_caption', 'Підпис до зображення (необов\'язково)...')}
                            value={block.caption || ''}
                            onChange={(e) => handleUpdateBlock(idx, { ...block, caption: e.target.value })}
                            className="w-full px-3.5 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-medium text-[#0A0A0A] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] space-y-6 overflow-hidden">
              <div className="space-y-3 pb-6 border-b-2 border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="inline-block px-3 py-1 bg-[#0A0A0A] text-[#F2EBDD] rounded-lg text-[10px] font-black uppercase">
                    {formCategory || 'Category'}
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-[#0A0A0A] ${
                    formLanguage === 'en' ? 'bg-amber-400 text-[#0A0A0A]' : 'bg-blue-600 text-white'
                  }`}>
                    {formLanguage === 'en' ? 'EN' : 'UK'}
                  </div>
                </div>
                <h1 className="font-['Anybody',sans-serif] text-2xl md:text-4xl font-black text-[#0A0A0A] uppercase leading-snug break-words [overflow-wrap:anywhere]">
                  {formTitle || 'Article Title'}
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                  <span>{formAuthor || 'Launchly Team'}</span>
                  <span>•</span>
                  <span>{formDate || 'Date'}</span>
                  <span>•</span>
                  <span>{computedReadTime}</span>
                </div>
              </div>

              {formCoverImage && (
                <div className="rounded-3xl border-2 border-[#0A0A0A] overflow-hidden aspect-[16/9] shadow-[6px_6px_0px_#0A0A0A]">
                  <img src={formCoverImage} alt={formTitle} className="w-full h-full object-cover" />
                </div>
              )}

              {formSummary && (
                <div className="p-5 bg-amber-50 border-l-4 border-amber-400 rounded-r-2xl text-sm font-medium text-slate-800 leading-relaxed font-['Geist',sans-serif] break-words [overflow-wrap:anywhere]">
                  {formSummary}
                </div>
              )}

              <div className="space-y-5 pt-2 font-['Geist',sans-serif]">
                {formBlocks.map((block, idx) => {
                  if (block.type === 'paragraph') {
                    return (
                      <p key={idx} className="text-base text-slate-800 leading-relaxed whitespace-pre-wrap font-normal break-words [overflow-wrap:anywhere]">
                        {block.text}
                      </p>
                    );
                  }
                  if (block.type === 'heading') {
                    return block.level === 3 ? (
                      <h3 key={idx} className="font-['Anybody',sans-serif] text-xl font-black text-[#0A0A0A] uppercase pt-4 break-words [overflow-wrap:anywhere]">
                        {block.text}
                      </h3>
                    ) : (
                      <h2 key={idx} className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase pt-6 pb-2 border-b-2 border-slate-200 break-words [overflow-wrap:anywhere]">
                        {block.text}
                      </h2>
                    );
                  }
                  if (block.type === 'quote') {
                    return (
                      <blockquote key={idx} className="p-5 my-3 border-l-4 border-[#0A0A0A] bg-slate-50 rounded-r-2xl italic text-slate-800 break-words [overflow-wrap:anywhere]">
                        <p className="text-base font-medium">"{block.text}"</p>
                        {block.author && <cite className="block text-xs font-bold text-slate-500 mt-2 not-italic font-['JetBrains_Mono',monospace]">— {block.author}</cite>}
                      </blockquote>
                    );
                  }
                  if (block.type === 'list') {
                    return (
                      <ul key={idx} className="list-disc list-inside space-y-2 text-base text-slate-800 pl-2">
                        {block.items.map((it, i) => (
                          <li key={i} className="font-normal break-words [overflow-wrap:anywhere]">{it}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (block.type === 'image') {
                    return (
                      <figure key={idx} className="my-6 space-y-2">
                        <img src={block.url} alt={block.caption || ''} className="w-full rounded-2xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] object-cover max-h-[500px]" />
                        {block.caption && (
                          <figcaption className="text-center text-xs text-slate-500 font-bold font-['JetBrains_Mono',monospace] break-words [overflow-wrap:anywhere]">
                            {block.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 font-['JetBrains_Mono',monospace]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-200 border-2 border-[#0A0A0A] rounded-xl text-[10px] font-black uppercase shadow-[2px_2px_0px_#0A0A0A]">
              <BookOpen size={13} />
              <span>{t('admin.blog.badge', 'LAUNCHLY BLOG ENGINE')}</span>
            </div>
            <h1 className="font-['Anybody',sans-serif] text-xl sm:text-2xl font-black text-[#0A0A0A] uppercase tracking-tight">
              {t('admin.blog.title', 'Керування статтями блогу')}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              {t('admin.blog.subtitle', 'Створюйте та редагуйте публікації, гайди та новини платформи')}
            </p>
          </div>

          <button
            onClick={handleOpenCreateView}
            className="px-5 py-3 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#2A2A2A] transition-all cursor-pointer shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          >
            <Plus size={16} />
            <span>{t('admin.blog.btn_create', 'Створити публікацію')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 border-2 border-[#0A0A0A] flex items-center justify-center text-blue-900 font-black">
              <FileText size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black text-slate-500">
                {t('admin.blog.total_articles', 'Всього статей')}
              </div>
              <div className="font-['Anybody',sans-serif] text-xl font-black text-[#0A0A0A]">{articles.length}</div>
            </div>
          </div>

          <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border-2 border-[#0A0A0A] flex items-center justify-center text-emerald-900 font-black">
              <Layers size={18} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black text-slate-500">
                {t('admin.blog.categories_count', 'Категорій')}
              </div>
              <div className="font-['Anybody',sans-serif] text-xl font-black text-[#0A0A0A]">{categories.length}</div>
            </div>
          </div>

          <div className="p-4 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border-2 border-[#0A0A0A] flex items-center justify-center text-purple-900 font-black">
              <Calendar size={18} />
            </div>
            <div className="truncate">
              <div className="text-[10px] uppercase font-black text-slate-500">
                {t('admin.blog.latest_article', 'Остання стаття')}
              </div>
              <div className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] truncate">
                {articles.length > 0 ? articles[0].title : t('admin.blog.no_articles', 'Немає статей')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('admin.blog.search_placeholder', 'Пошук статей за назвою, категорією або тегами...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 border-2 border-[#0A0A0A] rounded-xl p-0.5 shadow-[2px_2px_0px_#0A0A0A]">
              <button
                type="button"
                onClick={() => setSelectedLangFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  selectedLangFilter === 'all'
                    ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                    : 'text-slate-600 hover:text-[#0A0A0A]'
                }`}
              >
                {t('admin.blog.filter_lang_all', 'Всі мови')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedLangFilter('uk')}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  selectedLangFilter === 'uk'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-[#0A0A0A]'
                }`}
              >
                UK
              </button>
              <button
                type="button"
                onClick={() => setSelectedLangFilter('en')}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  selectedLangFilter === 'en'
                    ? 'bg-amber-400 text-[#0A0A0A]'
                    : 'text-slate-600 hover:text-[#0A0A0A]'
                }`}
              >
                EN
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl border-2 transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                    : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-slate-100'
                }`}
              >
                {t('admin.blog.filter_all', 'Всі')} ({articles.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-black uppercase rounded-xl border-2 transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                      : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white border-2 border-[#0A0A0A] rounded-3xl shadow-[6px_6px_0px_#0A0A0A]">
            <Loader2 className="animate-spin text-[#0A0A0A]" size={36} />
            <span className="text-xs font-black uppercase text-slate-600">
              {t('admin.blog.loading', 'Завантаження публікацій...')}
            </span>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-16 text-center space-y-4 bg-white border-2 border-[#0A0A0A] rounded-3xl shadow-[6px_6px_0px_#0A0A0A]">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 border-2 border-[#0A0A0A] flex items-center justify-center mx-auto shadow-[3px_3px_0px_#0A0A0A]">
              <BookOpen size={28} className="text-[#0A0A0A]" />
            </div>
            <h3 className="font-['Anybody',sans-serif] text-lg font-black text-[#0A0A0A] uppercase">
              {t('admin.blog.empty_title', 'Статей не знайдено')}
            </h3>
            <p className="text-xs text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
              {searchQuery || selectedCategory !== 'all' || selectedLangFilter !== 'all'
                ? t('admin.blog.empty_search_desc', 'Спробуйте змінити пошуковий запит або обрати іншу категорію.')
                : t('admin.blog.empty_no_posts_desc', 'У блозі ще немає опублікованих статей. Створіть вашу першу публікацію прямо зараз!')}
            </p>
            <button
              onClick={handleOpenCreateView}
              className="px-5 py-2.5 bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_#0A0A0A] cursor-pointer"
            >
              {t('admin.blog.btn_create_short', '+ Створити статтю')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="bg-white border-2 border-[#0A0A0A] rounded-3xl shadow-[6px_6px_0px_#0A0A0A] overflow-hidden flex flex-col group hover:-translate-y-1 transition-all"
              >
                <div className="aspect-[16/9] w-full border-b-2 border-[#0A0A0A] relative bg-slate-100 overflow-hidden shrink-0">
                  {article.coverImage ? (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 text-slate-400">
                      <ImageIcon size={36} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#0A0A0A] text-[#F2EBDD] border border-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#0A0A0A]">
                    {article.category}
                  </div>

                  <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border border-white tracking-wider shadow-[2px_2px_0px_#0A0A0A] ${
                    (article.language || 'uk').toLowerCase() === 'en' ? 'bg-amber-400 text-[#0A0A0A]' : 'bg-blue-600 text-white'
                  }`}>
                    {(article.language || 'uk').toUpperCase()}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase line-clamp-2 leading-snug break-words [overflow-wrap:anywhere]">
                      {article.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed font-['Geist',sans-serif] break-words [overflow-wrap:anywhere]">
                      {article.summary || '—'}
                    </p>
                  </div>

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded-md text-[9px] font-bold text-slate-700"
                        >
                          #{tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400 self-center">
                          +{article.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <div className="flex items-center gap-1.5 truncate">
                        <UserIcon size={12} />
                        <span className="truncate">{article.author}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {article.readTime}
                        </span>
                        <span>•</span>
                        <span>{article.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`/blog/${encodeURIComponent(article.id)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1.5 bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-[11px] font-black uppercase text-center flex items-center justify-center gap-1 text-[#0A0A0A] hover:bg-slate-100 transition shadow-[2px_2px_0px_#0A0A0A]"
                      >
                        <ExternalLink size={12} />
                        <span>{t('admin.blog.btn_preview', 'Перегляд')}</span>
                      </a>
                      <button
                        onClick={() => handleOpenEditView(article)}
                        className="flex-1 py-1.5 bg-amber-200 border-2 border-[#0A0A0A] rounded-xl text-[11px] font-black uppercase text-center flex items-center justify-center gap-1 text-amber-950 hover:bg-amber-300 transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
                      >
                        <Edit2 size={12} />
                        <span>{t('admin.blog.btn_edit', 'Редагувати')}</span>
                      </button>
                      <button
                        onClick={() => setArticleToDelete(article)}
                        className="w-8 h-8 bg-rose-100 border-2 border-[#0A0A0A] rounded-xl text-rose-800 hover:bg-rose-200 flex items-center justify-center transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer shrink-0"
                        title={t('admin.blog.delete_tooltip', 'Видалити статтю')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {articleToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setArticleToDelete(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/50 animate-fade-in font-['JetBrains_Mono',monospace] cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] rounded-3xl border-2 border-[#0A0A0A] shadow-[8px_8px_0px_#0A0A0A] w-full max-w-md p-6 space-y-4 animate-zoom-in cursor-default"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border-2 border-[#0A0A0A] text-rose-700 flex items-center justify-center mx-auto shadow-[3px_3px_0px_#0A0A0A]">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase">
                {t('admin.blog.delete_modal_title', 'Видалити публікацію?')}
              </h3>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                {t('admin.blog.delete_modal_desc', { title: articleToDelete.title })}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                className="flex-1 py-2.5 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] hover:bg-slate-100 transition cursor-pointer"
              >
                {t('admin.blog.btn_cancel', 'Скасувати')}
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 text-white border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-rose-700 transition cursor-pointer shadow-[3px_3px_0px_#0A0A0A] disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                <span>{t('admin.blog.btn_delete', 'Видалити')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
