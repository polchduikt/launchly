import React, { useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../../../i18n/config';

interface CategoryOption {
  key: string;
  label: string;
  value: string;
}

interface BlogGeneralInfoFormProps {
  formLanguage: string;
  setFormLanguage: (lang: string) => void;
  formId: string;
  setFormId: (id: string) => void;
  formTitle: string;
  setFormTitle: (title: string) => void;
  formCategory: string;
  setFormCategory: (cat: string) => void;
  defaultCategories: CategoryOption[];
  formCoverImage: string;
  setFormCoverImage: (url: string) => void;
  onCoverFileUpload: (file: File) => void;
  isCoverUploading: boolean;
  formSummary: string;
  setFormSummary: (summary: string) => void;
  formTags: string;
  setFormTags: (tags: string) => void;
}

export const BlogGeneralInfoForm: React.FC<BlogGeneralInfoFormProps> = ({
  formLanguage,
  setFormLanguage,
  formId,
  setFormId,
  formTitle,
  setFormTitle,
  formCategory,
  setFormCategory,
  defaultCategories,
  formCoverImage,
  setFormCoverImage,
  onCoverFileUpload,
  isCoverUploading,
  formSummary,
  setFormSummary,
  formTags,
  setFormTags,
}) => {
  const { t } = useTranslation();
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  return (
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
            placeholder={t(
              'admin.blog.placeholder_slug',
              'автоматично з заголовка, напр. how-to-create-telegram-bot'
            )}
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
            placeholder={t(
              'admin.blog.placeholder_title',
              'напр. Як створити Telegram бота для бізнесу за 10 хвилин'
            )}
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
              if (file) onCoverFileUpload(file);
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
                if (file) onCoverFileUpload(file);
              }}
              className="border-2 border-dashed border-[#0A0A0A] rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              {isCoverUploading ? (
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
            placeholder={t(
              'admin.blog.placeholder_summary',
              'Короткий зміст або лід статті для карток та пошукових систем...'
            )}
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
  );
};
