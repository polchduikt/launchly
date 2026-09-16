import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation, getLanguage } from '../../../../i18n/config';
import {
  useCreateBlogArticleMutation,
  useUpdateBlogArticleMutation,
} from '../../../../hooks/admin/useAdminBlogQueries';
import { useMediaUpload } from '../../../../hooks/bot/useMediaUpload';
import { isAxiosError } from 'axios';
import type { BlogArticle } from '../../../../const/blogData';
import type { SaveBlogArticlePayload } from '../../../../api/adminBlog';
import {
  BlogGeneralInfoForm,
  BlogBlocksEditor,
  BlogPreviewPane,
} from './blogEditor';
import type { ContentBlock } from './blogEditor';

export type { ContentBlock };

interface BlogEditorViewProps {
  initialArticle: BlogArticle | null;
  currentUser: { name?: string | null } | null;
  onBack: () => void;
  onSuccess: () => void;
}

export const BlogEditorView: React.FC<BlogEditorViewProps> = ({
  initialArticle,
  currentUser,
  onBack,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const editingArticleId = initialArticle?.id || null;

  const createMutation = useCreateBlogArticleMutation();
  const updateMutation = useUpdateBlogArticleMutation(editingArticleId);
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

  const [formId, setFormId] = useState(initialArticle?.id || '');
  const [formTitle, setFormTitle] = useState(initialArticle?.title || '');
  const [formCategory, setFormCategory] = useState(initialArticle?.category || 'Гайди');
  const [formLanguage, setFormLanguage] = useState<string>(
    initialArticle?.language || getLanguage() || 'uk'
  );
  const formAuthor = initialArticle?.author || currentUser?.name || 'Launchly Team';
  const formDate = useMemo(() => {
    if (initialArticle?.date) return initialArticle.date;
    const now = new Date();
    const lang = getLanguage();
    return now.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [initialArticle?.date]);

  const [formSummary, setFormSummary] = useState(initialArticle?.summary || '');
  const [formCoverImage, setFormCoverImage] = useState(initialArticle?.coverImage || '');
  const [formTags, setFormTags] = useState((initialArticle?.tags || []).join(', '));
  const [formBlocks, setFormBlocks] = useState<ContentBlock[]>(() => {
    if (initialArticle?.contentBlocks && initialArticle.contentBlocks.length > 0) {
      return JSON.parse(JSON.stringify(initialArticle.contentBlocks));
    }
    return [{ type: 'paragraph', text: '' }];
  });
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingBlockIndex, setUploadingBlockIndex] = useState<number | null>(null);

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

  const handleCoverFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    coverUploadMutation.mutate(file, {
      onSuccess: (res) => {
        setFormCoverImage(res.url);
      },
      onError: (err: unknown) => {
        const msg = isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message
          : undefined;
        setFormError(msg || 'Помилка завантаження фото');
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
      onError: (err: unknown) => {
        setUploadingBlockIndex(null);
        const msg = isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message
          : undefined;
        setFormError(msg || 'Помилка завантаження фото блоку');
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
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload: SaveBlogArticlePayload = {
      id: formId.trim() || undefined,
      title: formTitle.trim(),
      category: formCategory.trim(),
      language: formLanguage,
      author: formAuthor.trim() || undefined,
      readTime: computedReadTime,
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
          onSuccess();
        },
        onError: (err: unknown) => {
          const msg = isAxiosError(err)
            ? (err.response?.data as { message?: string })?.message
            : undefined;
          setFormError(msg || t('admin.blog.error_update', 'Помилка оновлення статті'));
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (err: unknown) => {
          const msg = isAxiosError(err)
            ? (err.response?.data as { message?: string })?.message
            : undefined;
          setFormError(msg || t('admin.blog.error_create', 'Помилка створення статті'));
        },
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-['JetBrains_Mono',monospace]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
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
          <BlogGeneralInfoForm
            formLanguage={formLanguage}
            setFormLanguage={setFormLanguage}
            formId={formId}
            setFormId={setFormId}
            formTitle={formTitle}
            setFormTitle={setFormTitle}
            formCategory={formCategory}
            setFormCategory={setFormCategory}
            defaultCategories={defaultCategories}
            formCoverImage={formCoverImage}
            setFormCoverImage={setFormCoverImage}
            onCoverFileUpload={handleCoverFileUpload}
            isCoverUploading={coverUploadMutation.isPending}
            formSummary={formSummary}
            setFormSummary={setFormSummary}
            formTags={formTags}
            setFormTags={setFormTags}
          />

          <BlogBlocksEditor
            formBlocks={formBlocks}
            onAddBlock={handleAddBlock}
            onUpdateBlock={handleUpdateBlock}
            onRemoveBlock={handleRemoveBlock}
            onMoveBlock={handleMoveBlock}
            onBlockImageUpload={handleBlockImageUpload}
            uploadingBlockIndex={uploadingBlockIndex}
          />
        </div>
      ) : (
        <BlogPreviewPane
          formCategory={formCategory}
          formLanguage={formLanguage}
          formTitle={formTitle}
          formAuthor={formAuthor}
          formDate={formDate}
          computedReadTime={computedReadTime}
          formCoverImage={formCoverImage}
          formSummary={formSummary}
          formBlocks={formBlocks}
        />
      )}
    </div>
  );
};
