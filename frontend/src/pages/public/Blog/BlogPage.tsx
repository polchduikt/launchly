import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLOG_ARTICLES, type BlogArticle } from '../../../const/blogData';
import { useBlogArticlesQuery } from '../../../hooks/dashboard/useBlogQueries';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Zap, Workflow, Bot } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../routes/paths';
import { useTranslation, getLanguage } from '../../../i18n/config';
import { useSEO } from '../../../hooks/useSEO';
import { PublicFooter } from '../../../components/layout/PublicFooter';
import { PublicHeader } from '../../../components/layout/PublicHeader';

type CardOrientation = 'vertical' | 'horizontal';
type CardVariant = 'default' | 'landscape' | 'compact' | 'overlay';

const BlogCard: React.FC<{
  article: BlogArticle;
  orientation: CardOrientation;
  onOpen: (id: string) => void;
  readLabel: string;
  className?: string;
  tall?: boolean;
  variant?: CardVariant;
  fixedHeight?: boolean;
}> = ({
  article,
  orientation,
  onOpen,
  readLabel,
  className = '',
  tall = false,
  variant = 'default',
  fixedHeight = false,
}) => {
  const isVertical = orientation === 'vertical';

  if (variant === 'overlay') {
    return (
      <article
        onClick={() => onOpen(article.id)}
        className={`relative bg-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer group overflow-hidden aspect-[4/5] min-w-0 w-full ${className}`}
      >
        <img
          src={article.coverImage}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/55 to-transparent" />
        <div className="absolute top-3 left-3 bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 z-10 max-w-[80%] truncate">
          {article.category}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 space-y-3 min-w-0">
          <h2 className="font-['Anybody',sans-serif] text-xl sm:text-2xl font-extrabold uppercase text-[#F2EBDD] leading-snug line-clamp-3 break-words [overflow-wrap:anywhere]">
            {article.title}
          </h2>
          <div className="flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#F2EBDD]/80 shrink-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar size={13} />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1 text-indigo-300 font-extrabold group-hover:translate-x-1 transition-transform shrink-0">
              <span>{readLabel}</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'landscape') {
    return (
      <article
        onClick={() => onOpen(article.id)}
        className={`bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer group overflow-hidden flex flex-col min-w-0 w-full h-full ${className}`}
      >
        <div className="aspect-[16/10] w-full border-b-2 border-[#0A0A0A] relative overflow-hidden bg-slate-200 shrink-0">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border border-white max-w-[80%] truncate">
            {article.category}
          </div>
        </div>
        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2 min-w-0 justify-between">
          <div className="space-y-2 min-w-0">
            <h2 className="font-['Anybody',sans-serif] text-base sm:text-lg font-extrabold uppercase text-[#0A0A0A] leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]">
              {article.title}
            </h2>
            <p className="font-['Geist',sans-serif] text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed break-words [overflow-wrap:anywhere]">
              {article.summary}
            </p>
          </div>
          <div className="pt-2 mt-auto flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A] shrink-0 border-t border-[#0A0A0A]/20">
            <span>{article.date}</span>
            <div className="flex items-center gap-1 text-indigo-700 font-extrabold group-hover:translate-x-1 transition-transform shrink-0">
              <span>{readLabel}</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article
        onClick={() => onOpen(article.id)}
        className={`bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer group overflow-hidden flex flex-col min-w-0 w-full h-full ${className}`}
      >
        <div className="p-4 sm:p-5 border-b-2 border-[#0A0A0A] space-y-2 min-w-0">
          <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest text-indigo-700 block truncate">
            {article.category}
          </span>
          <h2 className="font-['Anybody',sans-serif] text-lg sm:text-xl font-extrabold uppercase text-[#0A0A0A] leading-snug line-clamp-3 break-words [overflow-wrap:anywhere]">
            {article.title}
          </h2>
        </div>
        <div className="aspect-[5/4] w-full relative overflow-hidden bg-slate-200 shrink-0">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4 mt-auto flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A] shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar size={13} />
            <span>{article.date}</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-700 font-extrabold group-hover:translate-x-1 transition-transform shrink-0">
            <span>{readLabel}</span>
            <ArrowRight size={13} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onOpen(article.id)}
      className={`bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer group overflow-hidden min-w-0 w-full ${
        isVertical ? 'flex flex-col' : 'flex flex-col md:flex-row'
      } ${fixedHeight ? 'h-full' : ''} ${className}`}
    >
      <div
        className={`relative overflow-hidden bg-slate-200 shrink-0 border-[#0A0A0A] ${
          isVertical
            ? fixedHeight
              ? 'aspect-[16/10] sm:aspect-[4/3] md:aspect-auto md:h-[52%] w-full border-b-2'
              : 'aspect-[16/10] sm:aspect-[4/3] w-full border-b-2'
            : tall
              ? 'aspect-[16/10] sm:aspect-[4/3] w-full md:aspect-auto md:w-[46%] md:min-h-[280px] lg:min-h-[320px] xl:min-h-[360px] md:self-stretch border-b-2 md:border-b-0 md:border-r-2'
              : 'aspect-[16/10] sm:aspect-[4/3] w-full md:aspect-auto md:w-[48%] md:min-h-[220px] border-b-2 md:border-b-0 md:border-r-2'
        }`}
      >
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 border border-white max-w-[85%] truncate">
          {article.category}
        </div>
      </div>

      <div
        className={`p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 min-w-0 ${
          isVertical ? 'flex-1 min-h-0 justify-between' : 'flex-1 min-h-0 justify-between'
        }`}
      >
        <div className="space-y-2 min-w-0">
          <h2
            className={`font-['Anybody',sans-serif] font-extrabold uppercase text-[#0A0A0A] leading-snug break-words [overflow-wrap:anywhere] ${
              isVertical ? 'text-base sm:text-lg lg:text-xl line-clamp-2 sm:line-clamp-3' : 'text-base sm:text-xl lg:text-2xl line-clamp-2 sm:line-clamp-3'
            }`}
          >
            {article.title}
          </h2>
          <p
            className={`font-['Geist',sans-serif] text-xs sm:text-sm font-medium text-slate-800 leading-relaxed break-words [overflow-wrap:anywhere] ${
              fixedHeight ? 'line-clamp-2 sm:line-clamp-3' : 'line-clamp-2 sm:line-clamp-3'
            }`}
          >
            {article.summary}
          </p>
        </div>
        <div className="pt-3 border-t border-[#0A0A0A]/20 mt-auto flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A] shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Calendar size={13} />
            <span>{article.date}</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-700 font-extrabold group-hover:translate-x-1 transition-transform shrink-0">
            <span>{readLabel}</span>
            <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </article>
  );
};

export const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const { t } = useTranslation();

  useSEO({
    title: t('seo.blog.title', 'Launchly Blog — Telegram Automation Guides & Tips'),
    description: t('seo.blog.description', 'Tutorials, product updates, automation strategies and guides for Telegram bot builders and no-code business owners.'),
    keywords: t('seo.blog.keywords', 'telegram automation blog, chatbot tutorials, no-code guides, launchly blog'),
    canonicalPath: '/blog',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Launchly Blog',
      description: t('seo.blog.description', 'Tutorials, product updates, automation strategies and guides for Telegram bot builders.'),
      url: 'https://launchly.app/blog',
      publisher: {
        '@type': 'Organization',
        name: 'Launchly',
        url: 'https://launchly.app',
      },
    },
  });

  const [sliderIndex, setSliderIndex] = useState(0);
  const [showMore, setShowMore] = useState(false);

  const lang = getLanguage() || 'uk';
  const { data: rawArticles = BLOG_ARTICLES } = useBlogArticlesQuery(lang);

  const blogArticles = useMemo(
    () => rawArticles.filter((a) => !a.language || a.language.toLowerCase() === lang.toLowerCase()),
    [rawArticles, lang]
  );

  const middleArticle = blogArticles[1];
  const rightArticle = blogArticles[2];
  const secondRowArticles = useMemo(
    () => blogArticles.slice(3, 6).filter(Boolean),
    [blogArticles]
  );

  const secondRowIds = useMemo(
    () => new Set(secondRowArticles.map((a) => a.id)),
    [secondRowArticles]
  );

  const sliderArticles = useMemo(() => {
    const fixedIds = new Set(
      [middleArticle?.id, rightArticle?.id].filter(Boolean) as string[]
    );
    const pool = blogArticles.filter(
      (article) => !fixedIds.has(article.id) && !secondRowIds.has(article.id)
    );
    return pool.length > 0 ? pool : blogArticles.slice(0, 1);
  }, [blogArticles, middleArticle?.id, rightArticle?.id, secondRowIds]);

  useEffect(() => {
    setSliderIndex(0);
  }, [sliderArticles.length]);

  const activeSliderArticle = sliderArticles[sliderIndex] ?? sliderArticles[0];

  const remainingArticles = useMemo(() => {
    const featuredIds = new Set(
      [activeSliderArticle?.id, middleArticle?.id, rightArticle?.id].filter(Boolean) as string[]
    );
    return blogArticles.filter(
      (article) => !featuredIds.has(article.id) && !secondRowIds.has(article.id)
    );
  }, [blogArticles, activeSliderArticle?.id, middleArticle?.id, rightArticle?.id, secondRowIds]);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sliderArticles.length <= 1) return;
    setSliderIndex((prev) => (prev === 0 ? sliderArticles.length - 1 : prev - 1));
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sliderArticles.length <= 1) return;
    setSliderIndex((prev) => (prev === sliderArticles.length - 1 ? 0 : prev + 1));
  };

  const openArticle = (id: string) => navigate(`/blog/${id}`);
  const readLabel = t('blog.card.read', 'READ');

  const handlePromoCta = () => {
    navigate(isAuthenticated ? ROUTES.HOME : ROUTES.REGISTER);
  };

  return (
    <div className="min-h-screen bg-[#F2EBDD] text-[#0A0A0A] font-['Geist',sans-serif] antialiased flex flex-col justify-between relative z-0 selection:bg-[#0A0A0A] selection:text-[#F2EBDD]">
      <div
        className="fixed inset-0 z-[-1] pointer-events-none opacity-5"
        style={{
          backgroundColor: '#F2EBDD',
          backgroundImage: `
            linear-gradient(#0A0A0A 1px, transparent 1px),
            linear-gradient(90deg, #0A0A0A 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '-1px -1px',
        }}
      />

      <div>
        <PublicHeader />

        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pt-14 pb-16 space-y-12">
          {blogArticles.length === 0 ? (
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-12 text-center space-y-4">
              <h3 className="font-['Anybody',sans-serif] text-2xl font-black uppercase text-[#0A0A0A]">
                {t('blog.empty.title', 'No Articles Found')}
              </h3>
              <p className="font-['Geist',sans-serif] text-sm text-[#0A0A0A] font-bold">
                {t('blog.empty.desc', 'Try searching for a different keyword or topic.')}
              </p>
            </div>
          ) : blogArticles.length === 1 ? (
            <div className="w-full max-w-4xl mx-auto">
              <BlogCard
                article={blogArticles[0]}
                orientation="horizontal"
                onOpen={openArticle}
                readLabel={readLabel}
                tall
              />
            </div>
          ) : blogArticles.length === 2 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch pb-2 pr-1.5">
              <div className="min-w-0 h-full">
                <BlogCard
                  article={blogArticles[0]}
                  orientation="vertical"
                  onOpen={openArticle}
                  readLabel={readLabel}
                  variant="landscape"
                  className="h-full"
                />
              </div>
              <div className="min-w-0 h-full">
                <BlogCard
                  article={blogArticles[1]}
                  orientation="vertical"
                  onOpen={openArticle}
                  readLabel={readLabel}
                  variant="landscape"
                  className="h-full"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)_minmax(0,0.85fr)] gap-5 lg:gap-7 xl:gap-8 items-center pb-2 pr-1.5">
                <div className="h-auto md:h-[520px] lg:h-[580px] xl:h-[620px] min-w-0">
                  {activeSliderArticle && (
                    <div key={activeSliderArticle.id} className="animate-fade-in h-full">
                      <BlogCard
                        article={activeSliderArticle}
                        orientation="vertical"
                        onOpen={openArticle}
                        readLabel={readLabel}
                        fixedHeight
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                  {sliderArticles.length > 1 && (
                    <div className="flex items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={handlePrevSlide}
                        aria-label={t('blog.featured.prev', 'Previous article')}
                        className="border-2 border-[#0A0A0A] bg-[#F2EBDD] p-2.5 text-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer active:scale-95"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextSlide}
                        aria-label={t('blog.featured.next', 'Next article')}
                        className="border-2 border-[#0A0A0A] bg-[#0A0A0A] p-2.5 text-[#F2EBDD] shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer active:scale-95"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                  {middleArticle && (
                    <BlogCard
                      article={middleArticle}
                      orientation="horizontal"
                      onOpen={openArticle}
                      readLabel={readLabel}
                      tall
                      className="md:min-h-[300px] lg:min-h-[340px] xl:min-h-[380px]"
                    />
                  )}
                </div>

                <div className="h-auto md:h-[520px] lg:h-[580px] xl:h-[620px] min-w-0">
                  {rightArticle && (
                    <BlogCard
                      article={rightArticle}
                      orientation="vertical"
                      onOpen={openArticle}
                      readLabel={readLabel}
                      fixedHeight
                    />
                  )}
                </div>
              </div>

              {secondRowArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-stretch pb-2 pr-1.5">
                  {secondRowArticles[0] && (
                    <div className="min-w-0 md:pt-8 h-full">
                      <BlogCard
                        article={secondRowArticles[0]}
                        orientation="vertical"
                        onOpen={openArticle}
                        readLabel={readLabel}
                        variant="landscape"
                        className="h-full"
                      />
                    </div>
                  )}
                  {secondRowArticles[1] && (
                    <div className="min-w-0 h-full">
                      <BlogCard
                        article={secondRowArticles[1]}
                        orientation="vertical"
                        onOpen={openArticle}
                        readLabel={readLabel}
                        variant="overlay"
                        className="h-full"
                      />
                    </div>
                  )}
                  {secondRowArticles[2] && (
                    <div className="min-w-0 md:pt-12 h-full">
                      <BlogCard
                        article={secondRowArticles[2]}
                        orientation="vertical"
                        onOpen={openArticle}
                        readLabel={readLabel}
                        variant="compact"
                        className="h-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {blogArticles.length > 0 && (
          <section
            className="w-full bg-[#0A0A0A] text-[#F2EBDD] border-y-4 border-[#0A0A0A] select-none"
            data-header-theme="dark"
          >
            <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-16 sm:py-28 md:py-48 lg:py-64 min-h-0 lg:min-h-[70vh] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-16 items-center">
              <div className="space-y-6">
                <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-[0.25em] bg-[#F2EBDD] text-[#0A0A0A] px-3 py-1 inline-block">
                  {t('blog.promo.badge', 'LAUNCHLY PLATFORM')}
                </span>
                <h2 className="font-['Anybody',sans-serif] text-4xl sm:text-5xl lg:text-6xl font-black uppercase leading-[0.95] tracking-tight">
                  <span className="block text-[#F2EBDD]">
                    {t('blog.promo.title_1', 'Scale your business.')}
                  </span>
                  <span className="block text-indigo-300 mt-2">
                    {t('blog.promo.title_2', 'Automate the rest.')}
                  </span>
                </h2>
                <p className="font-['Geist',sans-serif] text-sm sm:text-base text-[#F2EBDD]/75 max-w-xl leading-relaxed font-medium">
                  {t(
                    'blog.promo.desc',
                    'Build visual chat flows, qualify leads, and close sales automatically — while you focus on growing the brand.'
                  )}
                </p>
                <button
                  type="button"
                  onClick={handlePromoCta}
                  className="bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-black uppercase tracking-wider px-8 py-3.5 border-2 border-[#F2EBDD] shadow-[4px_4px_0px_rgba(242,235,221,0.35)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>
                    {isAuthenticated
                      ? t('blog.promo.cta_dashboard', 'GO TO DASHBOARD')
                      : t('blog.promo.cta', 'START BUILDING FREE')}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                {[
                  {
                    icon: Workflow,
                    title: t('blog.promo.point_1_title', 'Visual Flows'),
                    desc: t('blog.promo.point_1_desc', 'Drag-and-drop automation without writing code.'),
                  },
                  {
                    icon: Bot,
                    title: t('blog.promo.point_2_title', 'Smart Chats'),
                    desc: t('blog.promo.point_2_desc', 'Qualify and reply to leads around the clock.'),
                  },
                  {
                    icon: Zap,
                    title: t('blog.promo.point_3_title', 'Instant Scale'),
                    desc: t('blog.promo.point_3_desc', 'Launch funnels that grow with your audience.'),
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="border-2 border-[#F2EBDD]/30 bg-[#0A0A0A] p-4 sm:p-5 flex gap-3 items-start hover:border-[#F2EBDD] transition-colors"
                  >
                    <div className="shrink-0 border-2 border-[#F2EBDD] bg-[#F2EBDD] text-[#0A0A0A] p-2">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-['Anybody',sans-serif] text-base font-extrabold uppercase tracking-tight">
                        {title}
                      </h3>
                      <p className="font-['Geist',sans-serif] text-xs text-[#F2EBDD]/65 mt-1 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {remainingArticles.length > 0 && (
          <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pt-12 pb-16">
            {!showMore ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowMore(true)}
                  className="bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-sm sm:text-base font-black uppercase tracking-widest px-16 sm:px-24 py-5 sm:py-6 border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
                >
                  {t('blog.more.cta', 'DIVE IN')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch animate-fade-in">
                {remainingArticles.map((article) => (
                  <div key={article.id} className="min-w-0 h-full">
                    <BlogCard
                      article={article}
                      orientation="vertical"
                      onOpen={openArticle}
                      readLabel={readLabel}
                      variant="landscape"
                      className="h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <section
        className="w-full pb-0 bg-transparent select-none overflow-hidden mt-16 md:mt-24"
        data-header-theme="dark"
      >
        <div className="w-full overflow-hidden leading-none -mb-1 relative h-20 sm:h-28 md:h-36 lg:h-44">
          <svg
            className="absolute top-0 left-0 h-full pointer-events-none animate-wave-back"
            style={{ width: '200%' }}
            viewBox="0 0 2880 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 0 25 C 180 25,180 5,360 5 C 540 5,540 25,720 25 C 900 25,900 45,1080 45 C 1260 45,1260 25,1440 25 C 1620 25,1620 5,1800 5 C 1980 5,1980 25,2160 25 C 2340 25,2340 45,2520 45 C 2700 45,2700 25,2880 25 L 2880 100 L 0 100 Z"
              fill="#0A0A0A"
              fillOpacity="0.4"
            />
          </svg>
          <svg
            className="absolute top-0 left-0 h-full pointer-events-none animate-wave-front"
            style={{ width: '200%' }}
            viewBox="0 0 2880 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 0 25 C 180 25,180 5,360 5 C 540 5,540 25,720 25 C 900 25,900 45,1080 45 C 1260 45,1260 25,1440 25 C 1620 25,1620 5,1800 5 C 1980 5,1980 25,2160 25 C 2340 25,2340 45,2520 45 C 2700 45,2700 25,2880 25 L 2880 100 L 0 100 Z"
              fill="#0A0A0A"
            />
          </svg>
        </div>

        <div className="bg-[#0A0A0A] text-[#F2EBDD] w-full pt-2 sm:pt-4 pb-16 sm:pb-24 px-6 lg:px-16 text-center">
          <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
            <h2 className="font-['Anybody',sans-serif] text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight leading-[0.95]">
              {t('landing.cta.title', 'Створіть свою першу автоматизацію безкоштовно вже сьогодні')}
            </h2>

            <p className="font-['JetBrains_Mono',monospace] text-xs sm:text-base text-[#F2EBDD]/70 font-bold max-w-2xl mx-auto leading-relaxed">
              {t('landing.cta.subtitle', "Без прив'язки банківської картки. Налаштування займе 3 хвилини.")}
            </p>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handlePromoCta}
                className="bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-sm sm:text-base font-black uppercase tracking-wider px-8 sm:px-12 py-3.5 sm:py-4 border-4 border-[#F2EBDD] shadow-[6px_6px_0px_rgba(255,255,255,0.25)] hover:bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer flex items-center gap-3"
              >
                <span>{t('landing.cta.button', 'Розпочати безкоштовно →')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default BlogPage;
