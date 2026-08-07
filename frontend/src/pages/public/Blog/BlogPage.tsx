import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BLOG_ARTICLES, type BlogArticle } from '../../../const/blogData';
import { useBlogArticlesQuery } from '../../../hooks/dashboard/useBlogQueries';
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Zap, Workflow, Bot } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../routes/paths';
import { useTranslation } from '../../../i18n/config';
import { PublicFooter } from '../../../components/layout/PublicFooter';
import logo from '../../../assets/images/logo.png';

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
        className={`relative bg-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer group overflow-hidden aspect-[4/5] ${className}`}
      >
        <img
          src={article.coverImage}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/55 to-transparent" />
        <div className="absolute top-3 left-3 bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest px-2.5 py-1">
          {article.category}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 space-y-3">
          <h2 className="font-['Anybody',sans-serif] text-xl sm:text-2xl font-extrabold uppercase text-[#F2EBDD] leading-snug line-clamp-3">
            {article.title}
          </h2>
          <div className="flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#F2EBDD]/80">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-1 text-indigo-300 font-extrabold group-hover:translate-x-1 transition-transform">
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
        className={`bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer group overflow-hidden flex flex-col ${className}`}
      >
        <div className="aspect-[16/10] w-full border-b-2 border-[#0A0A0A] relative overflow-hidden bg-slate-200 shrink-0">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border border-white">
            {article.category}
          </div>
        </div>
        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2">
          <h2 className="font-['Anybody',sans-serif] text-base sm:text-lg font-extrabold uppercase text-[#0A0A0A] leading-snug line-clamp-2">
            {article.title}
          </h2>
          <p className="font-['Geist',sans-serif] text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
          <div className="pt-2 mt-auto flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A]">
            <span>{article.date}</span>
            <div className="flex items-center gap-1 text-indigo-700 font-extrabold group-hover:translate-x-1 transition-transform">
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
        className={`bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer group overflow-hidden flex flex-col ${className}`}
      >
        <div className="p-4 sm:p-5 border-b-2 border-[#0A0A0A] space-y-2">
          <span className="font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest text-indigo-700">
            {article.category}
          </span>
          <h2 className="font-['Anybody',sans-serif] text-lg sm:text-xl font-extrabold uppercase text-[#0A0A0A] leading-snug line-clamp-3">
            {article.title}
          </h2>
        </div>
        <div className="aspect-[5/4] w-full relative overflow-hidden bg-slate-200">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4 flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A]">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} />
            <span>{article.date}</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-700 font-extrabold group-hover:translate-x-1 transition-transform">
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
      className={`bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer group overflow-hidden ${
        isVertical ? 'flex flex-col' : 'flex flex-col md:flex-row'
      } ${fixedHeight ? 'h-full' : ''} ${className}`}
    >
      <div
        className={`relative overflow-hidden bg-slate-200 shrink-0 border-[#0A0A0A] ${
          isVertical
            ? fixedHeight
              ? 'h-[58%] w-full border-b-2'
              : 'aspect-[3/4] w-full border-b-2'
            : tall
              ? 'aspect-[4/3] w-full md:aspect-auto md:w-[46%] md:min-h-[280px] lg:min-h-[320px] xl:min-h-[360px] md:self-stretch md:border-b-0 md:border-r-2'
              : 'aspect-[4/3] w-full md:aspect-auto md:w-[48%] md:min-h-[220px] md:border-b-0 md:border-r-2'
        }`}
      >
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border border-white">
          {article.category}
        </div>
      </div>

      <div
        className={`p-4 sm:p-5 flex flex-col gap-2.5 ${
          isVertical ? 'flex-1 min-h-0' : 'flex-1 md:justify-between'
        }`}
      >
        <h2
          className={`font-['Anybody',sans-serif] font-extrabold uppercase text-[#0A0A0A] leading-snug ${
            isVertical ? 'text-lg sm:text-xl line-clamp-3' : 'text-lg sm:text-xl lg:text-2xl line-clamp-3'
          }`}
        >
          {article.title}
        </h2>
        <p
          className={`font-['Geist',sans-serif] text-xs font-medium text-slate-800 leading-relaxed ${
            fixedHeight ? 'line-clamp-2' : isVertical ? 'line-clamp-3' : 'line-clamp-3'
          } ${fixedHeight ? '' : 'flex-1'}`}
        >
          {article.summary}
        </p>
        <div className="pt-3 border-t border-[#0A0A0A]/20 mt-auto flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A]">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} />
            <span>{article.date}</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-700 font-extrabold group-hover:translate-x-1 transition-transform">
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
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [isDarkHeader, setIsDarkHeader] = useState(false);

  const { data: blogArticles = BLOG_ARTICLES } = useBlogArticlesQuery();

  useEffect(() => {
    const handleScroll = () => {
      const headerCheckY = 40;
      const darkElements = document.querySelectorAll('[data-header-theme="dark"]');
      let overDark = false;

      darkElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= headerCheckY && rect.bottom >= headerCheckY) {
          overDark = true;
        }
      });

      setIsDarkHeader(overDark);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <header
          className={`sticky top-0 w-full z-50 flex justify-between items-center h-20 px-6 md:px-12 lg:px-16 backdrop-blur-md transition-all duration-300 ${
            isDarkHeader
              ? 'bg-[#0A0A0A]/90 border-b-2 border-[#F2EBDD] shadow-[0_4px_0px_#F2EBDD] text-[#F2EBDD]'
              : 'bg-[#F2EBDD]/85 border-b-2 border-[#0A0A0A] shadow-[0_4px_0px_#0A0A0A] text-[#0A0A0A]'
          }`}
        >
          <div className="flex items-center gap-4">
            <Link to={ROUTES.LANDING} className="flex items-center">
              <img
                src={logo}
                alt="Launchly Logo"
                className={`h-10 sm:h-12 w-auto object-contain cursor-pointer transition-all duration-300 ${
                  isDarkHeader ? 'brightness-0 invert' : ''
                }`}
              />
            </Link>

            <div className="relative ml-2">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
                className={`flex items-center gap-1 font-['JetBrains_Mono',monospace] text-sm font-bold border-b-2 pb-0.5 transition-all cursor-pointer select-none ${
                  isDarkHeader ? 'text-[#F2EBDD] border-[#F2EBDD]' : 'text-[#0A0A0A] border-[#0A0A0A]'
                }`}
              >
                <span>{currentLanguage === 'uk' ? 'Uk' : 'En'}</span>
                <span className="text-[10px] tracking-tighter">▼</span>
              </button>

              {isLangDropdownOpen && (
                <div
                  className={`absolute top-full left-0 mt-2 border-2 py-1 min-w-[75px] z-50 ${
                    isDarkHeader
                      ? 'bg-[#0A0A0A] border-[#F2EBDD] shadow-[4px_4px_0px_#F2EBDD]'
                      : 'bg-[#F2EBDD] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]'
                  }`}
                >
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1 text-left font-['JetBrains_Mono',monospace] text-xs font-bold transition-colors cursor-pointer ${
                      isDarkHeader
                        ? 'hover:bg-[#F2EBDD] hover:text-[#0A0A0A] ' +
                          (currentLanguage === 'en' ? 'bg-[#F2EBDD]/20 font-black' : 'text-[#F2EBDD]')
                        : 'hover:bg-[#0A0A0A] hover:text-[#F2EBDD] ' +
                          (currentLanguage === 'en' ? 'bg-[#0A0A0A]/10 font-black' : 'text-[#0A0A0A]')
                    }`}
                  >
                    En
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('uk');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1 text-left font-['JetBrains_Mono',monospace] text-xs font-bold transition-colors cursor-pointer ${
                      isDarkHeader
                        ? 'hover:bg-[#F2EBDD] hover:text-[#0A0A0A] ' +
                          (currentLanguage === 'uk' ? 'bg-[#F2EBDD]/20 font-black' : 'text-[#F2EBDD]')
                        : 'hover:bg-[#0A0A0A] hover:text-[#F2EBDD] ' +
                          (currentLanguage === 'uk' ? 'bg-[#0A0A0A]/10 font-black' : 'text-[#0A0A0A]')
                    }`}
                  >
                    Uk
                  </button>
                </div>
              )}
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-3 xl:gap-4 absolute left-1/2 -translate-x-1/2">
            {[
              { href: '#features', key: 'landing.nav.features', fallback: 'FEATURES' },
              { href: '#ai-automation', key: 'landing.nav.ai', fallback: 'AI' },
              { href: '#how-it-works', key: 'landing.nav.how_it_works', fallback: 'HOW IT WORKS' },
              { href: '#use-cases', key: 'landing.nav.use_cases', fallback: 'SOLUTIONS' },
              { href: '#comparison', key: 'landing.nav.comparison', fallback: 'WHY US' },
              { href: '#testimonials', key: 'landing.nav.testimonials', fallback: 'REVIEWS' },
              { href: '#trust', key: 'landing.nav.trust', fallback: 'SECURITY' },
              { href: '#pricing', key: 'landing.nav.pricing', fallback: 'PRICING' },
              { href: '#faq', key: 'landing.nav.faq', fallback: 'FAQ' },
            ].map((item) => (
              <Link
                key={item.href}
                to={`${ROUTES.LANDING}${item.href}`}
                className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider transition-colors duration-200 px-2 py-1 ${
                  isDarkHeader
                    ? 'text-[#F2EBDD] hover:bg-[#F2EBDD] hover:text-[#0A0A0A]'
                    : 'text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD]'
                }`}
              >
                {t(item.key, item.fallback)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 transition-all cursor-pointer ${
                  isDarkHeader
                    ? 'bg-[#F2EBDD] text-[#0A0A0A] border-[#F2EBDD] shadow-[4px_4px_0px_#F2EBDD] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                    : 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                }`}
              >
                {t('landing.nav.dashboard', 'DASHBOARD')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:underline underline-offset-4 cursor-pointer ${
                    isDarkHeader ? 'text-[#F2EBDD]' : 'text-[#0A0A0A]'
                  }`}
                >
                  {t('landing.nav.login', 'LOGIN')}
                </button>
                <button
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className={`font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 transition-all cursor-pointer ${
                    isDarkHeader
                      ? 'bg-[#F2EBDD] text-[#0A0A0A] border-[#F2EBDD] shadow-[4px_4px_0px_#F2EBDD] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                      : 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
                  }`}
                >
                  {t('landing.nav.signup', 'SIGN UP')}
                </button>
              </>
            )}
          </div>
        </header>

        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pt-14 pb-16 space-y-12">
          {blogArticles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-[0.85fr_1.3fr_0.85fr] gap-5 lg:gap-7 xl:gap-8 items-center pb-2 pr-1.5">
                <div className="h-[520px] lg:h-[580px] xl:h-[620px]">
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

                <div className="flex flex-col gap-3">
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

                <div className="h-[520px] lg:h-[580px] xl:h-[620px]">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7 xl:gap-8 items-start pb-2 pr-1.5">
                  {secondRowArticles[0] && (
                    <div className="md:pt-8">
                      <BlogCard
                        article={secondRowArticles[0]}
                        orientation="vertical"
                        onOpen={openArticle}
                        readLabel={readLabel}
                        variant="landscape"
                      />
                    </div>
                  )}
                  {secondRowArticles[1] && (
                    <BlogCard
                      article={secondRowArticles[1]}
                      orientation="vertical"
                      onOpen={openArticle}
                      readLabel={readLabel}
                      variant="overlay"
                    />
                  )}
                  {secondRowArticles[2] && (
                    <div className="md:pt-12">
                      <BlogCard
                        article={secondRowArticles[2]}
                        orientation="vertical"
                        onOpen={openArticle}
                        readLabel={readLabel}
                        variant="compact"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-12 text-center space-y-4">
              <h3 className="font-['Anybody',sans-serif] text-2xl font-black uppercase text-[#0A0A0A]">
                {t('blog.empty.title', 'No Articles Found')}
              </h3>
              <p className="font-['Geist',sans-serif] text-sm text-[#0A0A0A] font-bold">
                {t('blog.empty.desc', 'Try searching for a different keyword or topic.')}
              </p>
            </div>
          )}
        </div>

        {blogArticles.length > 0 && (
          <section
            className="w-full bg-[#0A0A0A] text-[#F2EBDD] border-y-4 border-[#0A0A0A] select-none"
            data-header-theme="dark"
          >
            <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-40 md:py-56 lg:py-72 min-h-[70vh] md:min-h-[80vh] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-16 items-center">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start animate-fade-in">
                {remainingArticles.map((article, index) => (
                  <BlogCard
                    key={article.id}
                    article={article}
                    orientation={index % 3 === 1 ? 'horizontal' : 'vertical'}
                    onOpen={openArticle}
                    readLabel={readLabel}
                    className={index % 3 === 1 ? 'md:mt-10' : ''}
                  />
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
