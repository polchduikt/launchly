import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BLOG_ARTICLES } from '../../../const/blogData';
import { useBlogArticlesQuery } from '../../../hooks/dashboard/useBlogQueries';
import { Search, ArrowRight, Calendar } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../routes/paths';
import { useTranslation } from '../../../i18n/config';
import { PublicFooter } from '../../../components/layout/PublicFooter';
import logo from '../../../assets/images/logo.png';

export const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: blogArticles = BLOG_ARTICLES } = useBlogArticlesQuery();

  const filteredArticles = blogArticles.filter((article) => {
    return (
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
          backgroundPosition: '-1px -1px'
        }}
      />

      <div>
        <header className="bg-[#F2EBDD]/85 backdrop-blur-md border-b-2 border-[#0A0A0A] shadow-[0_4px_0px_#0A0A0A] sticky top-0 w-full z-50 flex justify-between items-center h-20 px-6 md:px-12 lg:px-16">
          
          <div className="flex items-center gap-4">
            <Link to={ROUTES.LANDING} className="flex items-center">
              <img src={logo} alt="Launchly Logo" className="h-10 sm:h-12 w-auto object-contain cursor-pointer" />
            </Link>

            <div className="relative ml-2">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                onBlur={() => setTimeout(() => setIsLangDropdownOpen(false), 200)}
                className="flex items-center gap-1 font-['JetBrains_Mono',monospace] text-sm font-bold text-[#0A0A0A] border-b-2 border-[#0A0A0A] pb-0.5 transition-all cursor-pointer select-none"
              >
                <span>{currentLanguage === 'uk' ? 'Uk' : 'En'}</span>
                <span className="text-[10px] tracking-tighter">▼</span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] py-1 min-w-[75px] z-50">
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1 text-left font-['JetBrains_Mono',monospace] text-xs font-bold hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors cursor-pointer ${
                      currentLanguage === 'en' ? 'bg-[#0A0A0A]/10 font-black' : ''
                    }`}
                  >
                    En
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('uk');
                      setIsLangDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1 text-left font-['JetBrains_Mono',monospace] text-xs font-bold hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors cursor-pointer ${
                      currentLanguage === 'uk' ? 'bg-[#0A0A0A]/10 font-black' : ''
                    }`}
                  >
                    Uk
                  </button>
                </div>
              )}
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link 
              to={`${ROUTES.LANDING}#features`} 
              className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
            >
              {t('landing.nav.product', 'PRODUCT')}
            </Link>
            <Link 
              to={`${ROUTES.LANDING}#features`} 
              className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
            >
              {t('landing.nav.features', 'FEATURES')}
            </Link>
            <Link 
              to={`${ROUTES.LANDING}#pricing`} 
              className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-colors duration-200 px-2.5 py-1"
            >
              {t('landing.nav.pricing', 'PRICING')}
            </Link>
            <Link 
              to={ROUTES.BLOG} 
              className="text-[#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider bg-[#0A0A0A] text-[#F2EBDD] px-2.5 py-1"
            >
              {t('landing.nav.blog', 'BLOG')}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(ROUTES.HOME)}
                className="bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
              >
                {t('landing.nav.dashboard', 'DASHBOARD')}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#0A0A0A] uppercase tracking-wider hover:underline underline-offset-4 cursor-pointer"
                >
                  {t('landing.nav.login', 'LOGIN')}
                </button>
                <button
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
                >
                  {t('landing.nav.signup', 'SIGN UP')}
                </button>
              </>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-14 pb-16 space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-[#0A0A0A] pb-8">
            <div className="space-y-3">
              <span className="font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-widest bg-[#0A0A0A] text-[#F2EBDD] px-3 py-1 inline-block">
                {t('blog.hero.badge', 'LAUNCHLY INSIGHTS & RESOURCES')}
              </span>
              <h1 className="font-['Anybody',sans-serif] text-4xl sm:text-6xl font-black uppercase text-[#0A0A0A] leading-tight tracking-tight">
                {t('blog.hero.title', 'OUR BLOG')}
              </h1>
              <p className="text-base sm:text-lg font-bold text-[#0A0A0A] max-w-xl">
                {t('blog.hero.subtitle', 'Guides, tutorials, product updates, and automation strategies for modern Telegram businesses.')}
              </p>
            </div>

            <div className="relative min-w-[280px] sm:min-w-[340px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0A0A0A]" />
              <input
                type="text"
                placeholder={t('blog.search.placeholder', 'SEARCH ARTICLES...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] font-['JetBrains_Mono',monospace] text-xs font-bold text-[#0A0A0A] placeholder-[#0A0A0A]/50 focus:outline-none focus:bg-white transition-all uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {filteredArticles.map((article) => (
              <article
                key={article.id}
                onClick={() => navigate(`/blog/${article.id}`)}
                className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200 cursor-pointer flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  <div className="aspect-[16/9] w-full border-b-2 border-[#0A0A0A] relative overflow-hidden bg-slate-200">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border border-white">
                      {article.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h2 className="font-['Anybody',sans-serif] text-xl font-extrabold uppercase text-[#0A0A0A] leading-snug line-clamp-2">
                      {article.title}
                    </h2>
                    <p className="font-['Geist',sans-serif] text-xs font-medium text-slate-800 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-[#0A0A0A]/20 mt-4 flex items-center justify-between font-['JetBrains_Mono',monospace] text-[11px] font-bold text-[#0A0A0A]">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    <span>{article.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-700 font-extrabold group-hover:translate-x-1 transition-transform">
                    <span>{t('blog.card.read', 'READ')}</span>
                    <ArrowRight size={13} />
                  </div>
                </div>

              </article>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] p-12 text-center space-y-4">
              <h3 className="font-['Anybody',sans-serif] text-2xl font-black uppercase text-[#0A0A0A]">
                {t('blog.empty.title', 'No Articles Found')}
              </h3>
              <p className="font-['Geist',sans-serif] text-sm text-[#0A0A0A] font-bold">
                {t('blog.empty.desc', 'Try searching for a different keyword or topic.')}
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider px-6 py-2.5 border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer mt-2"
              >
                {t('blog.empty.clear', 'Clear Search')}
              </button>
            </div>
          )}

        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default BlogPage;
