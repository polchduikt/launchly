import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BLOG_ARTICLES } from '../../../const/blogData';
import { useBlogArticleDetailQuery } from '../../../hooks/dashboard/useBlogQueries';
import { ArrowLeft, Share2, Calendar, User, Clock, Loader2, Check } from 'lucide-react';
import { ROUTES } from '../../../routes/paths';
import { useTranslation } from '../../../i18n/config';
import { useSEO } from '../../../hooks/useSEO';
import { PublicFooter } from '../../../components/layout/PublicFooter';
import { PublicHeader } from '../../../components/layout/PublicHeader';

export const BlogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const { data: article = BLOG_ARTICLES.find((a) => a.id === id), isLoading } = useBlogArticleDetailQuery(id);

  const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/+$/, '') ?? 'https://launchly.app';
  useSEO({
    title: article
      ? `${article.title} — Launchly Blog`
      : t('seo.blog.title', 'Launchly Blog — Telegram Automation Guides & Tips'),
    description: article
      ? article.summary
      : t('seo.blog.description', 'Tutorials, product updates, and automation strategies.'),
    keywords: article
      ? article.tags.join(', ')
      : t('seo.blog.keywords', 'telegram automation blog, chatbot tutorials, launchly'),
    canonicalPath: `/blog/${id}`,
    ogImage: article?.coverImage ?? `${SITE_URL}/og-image.png`,
    ogType: 'article',
    jsonLd: article
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title,
          description: article.summary,
          image: article.coverImage,
          author: {
            '@type': 'Person',
            name: article.author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Launchly',
            url: `${SITE_URL}`,
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.ico` },
          },
          datePublished: article.date,
          dateModified: article.date,
          url: `${SITE_URL}/blog/${article.id}`,
          mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${article.id}` },
          keywords: article.tags.join(', '),
        }
      : undefined,
  });

  const handleShareArticle = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-ink" size={32} />
        <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-ink mt-3 uppercase tracking-wider">
          {t('blog.detail.loading', 'Loading article...')}
        </span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-8 space-y-4">
        <h2 className="font-['Anybody',sans-serif] text-3xl font-black uppercase text-ink">
          {t('blog.detail.not_found', 'Article Not Found')}
        </h2>
        <button
          onClick={() => navigate(ROUTES.BLOG)}
          className="bg-ink text-canvas font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-3 border-2 border-ink shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
        >
          {t('blog.detail.back', 'Back to Blog')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink font-['Geist',sans-serif] antialiased flex flex-col justify-between relative z-0 selection:bg-ink selection:text-canvas">
      
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none opacity-5"
        style={{
          backgroundColor: '#F2EBDD',
          backgroundImage: `
            linear-gradient(#0A0A0A 1px, transparent 1px),
            linear-gradient(90deg, #0A0A0A 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '-1px -1px'
        }}
      />

      <div>
        <PublicHeader />

        <div className="max-w-6xl mx-auto px-6 pt-14 pb-16 space-y-8">
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(ROUTES.BLOG)}
              className="bg-canvas text-ink border-2 border-ink shadow-brutal-md hover:bg-ink hover:text-canvas transition-all px-4 py-2 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>{t('blog.detail.back', 'Back to Blog')}</span>
            </button>

            <button
              onClick={handleShareArticle}
              className="bg-canvas text-ink border-2 border-ink shadow-brutal-md hover:bg-ink hover:text-canvas transition-all px-4 py-2 font-['JetBrains_Mono',monospace] text-xs font-bold uppercase flex items-center gap-2 cursor-pointer"
            >
              {isCopied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span>{isCopied ? t('blog.detail.copied', 'Link Copied!') : t('blog.detail.share', 'Share Article')}</span>
            </button>
          </div>

          <article className="bg-canvas border-2 border-ink shadow-brutal-xl p-6 sm:p-10 lg:p-12 space-y-8">
            
            <div className="space-y-4 border-b-2 border-ink pb-6 min-w-0">
              <span className="bg-ink text-canvas font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-widest px-3 py-1 inline-block border border-white max-w-[80%] truncate">
                {article.category}
              </span>

              <h1 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl font-black uppercase text-ink leading-tight tracking-tight break-words [overflow-wrap:anywhere]">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-4 font-['JetBrains_Mono',monospace] text-xs font-bold text-ink pt-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <User size={14} />
                    <span>{article.author}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{article.date}</span>
                  </span>
                </div>
                <span className="flex items-center gap-1.5 bg-white border border-ink px-2.5 py-1">
                  <Clock size={14} />
                  <span>{article.readTime || t('blog.detail.read_time', { min: 5 })}</span>
                </span>
              </div>
            </div>

            <div className="aspect-[16/9] w-full border-2 border-ink overflow-hidden bg-slate-200 shadow-brutal">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-6 font-['Geist',sans-serif] text-base text-ink leading-relaxed font-medium">
              {article.contentBlocks?.map((block, idx) => {
                if (block.type === 'paragraph') {
                  return <p key={idx} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{block.text}</p>;
                }
                if (block.type === 'heading') {
                  return (
                    <h2 key={idx} className="font-['Anybody',sans-serif] text-2xl font-black uppercase text-ink pt-4 border-b border-ink/20 pb-2 break-words [overflow-wrap:anywhere]">
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === 'quote') {
                  return (
                    <blockquote key={idx} className="bg-ink text-canvas p-6 border-l-8 border-canvas font-['JetBrains_Mono',monospace] text-sm font-bold my-4 shadow-brutal break-words [overflow-wrap:anywhere]">
                      "{block.text}"
                      {block.author && <span className="block mt-2 text-xs opacity-75 break-words [overflow-wrap:anywhere]">— {block.author}</span>}
                    </blockquote>
                  );
                }
                if (block.type === 'list') {
                  return (
                    <ul key={idx} className="list-disc pl-6 space-y-2">
                      {block.items.map((item, i) => (
                        <li key={i} className="break-words [overflow-wrap:anywhere]">{item}</li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === 'image') {
                  return (
                    <div key={idx} className="my-6 border-2 border-ink bg-slate-200 overflow-hidden shadow-brutal">
                      <img src={block.url} alt={block.caption || 'Article image'} className="w-full h-auto object-cover" />
                      {block.caption && <p className="p-2 text-center text-xs font-mono font-bold bg-ink text-canvas break-words [overflow-wrap:anywhere]">{block.caption}</p>}
                    </div>
                  );
                }
                return null;
              })}
            </div>

          </article>

        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default BlogDetailPage;
