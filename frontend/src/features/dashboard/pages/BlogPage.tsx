import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLOG_ARTICLES } from '../config/blogData';
import { useBlogArticlesQuery } from '../hooks/useBlogQueries';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import logoL from '../../../assets/logo-l.png';

const BlogFooter: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 text-white py-16 px-6 md:px-16 mt-20 select-none relative z-10 border-t border-slate-900">
      <div className="max-w-[1650px] w-[95%] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Product</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <li><a href="#" className="hover:text-white transition-colors">Visual Flows</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Automations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Smart Chats</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Launchly AI</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resources</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">How to</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Video Course</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Launchly</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-semibold">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Manifesto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy & Security</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-[1650px] w-[95%] mx-auto border-t border-slate-900 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="text-white font-black tracking-tight text-sm">Launchly</span>
        </div>
        <span>© 2026, LAUNCHLY, INC. ALL RIGHTS RESERVED.</span>
      </div>
    </footer>
  );
};

export const BlogPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMore, setShowMore] = useState(false);
  const { data: blogArticles = BLOG_ARTICLES } = useBlogArticlesQuery();
  const [leftArticleIndex, setLeftArticleIndex] = useState(0);
  const filteredArticles = blogArticles.filter((article) => {
    return (
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  const articleCol2Top = blogArticles.find(a => a.id === 'chat-automation-for-business');
  const articleCol3Top = blogArticles.find(a => a.id === 'automation-vs-custom-development');
  const articleCol1Bottom = blogArticles.find(a => a.id === 'launchly-v2-announcement');
  const articleCol2Bottom = blogArticles.find(a => a.id === 'creator-economy-trends');
  const articleCol3Bottom = blogArticles.find(a => a.id === 'launchly-telegram-bot-api-update');

  const sliderArticles = blogArticles.filter(
    (a) =>
      a.id !== 'chat-automation-for-business' &&
      a.id !== 'automation-vs-custom-development' &&
      a.id !== 'launchly-v2-announcement' &&
      a.id !== 'creator-economy-trends' &&
      a.id !== 'launchly-telegram-bot-api-update'
  );

  const handlePrevLeftArticle = () => {
    if (sliderArticles.length === 0) return;
    setLeftArticleIndex((prev) => (prev === 0 ? sliderArticles.length - 1 : prev - 1));
  };

  const handleNextLeftArticle = () => {
    if (sliderArticles.length === 0) return;
    setLeftArticleIndex((prev) => (prev === sliderArticles.length - 1 ? 0 : prev + 1));
  };
  const activeLeftArticle = sliderArticles[leftArticleIndex] || sliderArticles[0];
  const remainingArticles = blogArticles.filter(
    (a) =>
      a.id !== (activeLeftArticle?.id || '') &&
      a.id !== 'chat-automation-for-business' &&
      a.id !== 'automation-vs-custom-development' &&
      a.id !== 'launchly-v2-announcement' &&
      a.id !== 'creator-economy-trends' &&
      a.id !== 'launchly-telegram-bot-api-update'
  );

  const articleRow3Col1 = remainingArticles[0];
  const articleRow3Col2 = remainingArticles[1];
  const articleRow3Col3 = remainingArticles[2];
  const articleRow4Col1 = remainingArticles[3];
  const articleRow4Col2 = remainingArticles[4];

  return (
    <div className="flex-1 bg-white overflow-y-auto overflow-x-hidden font-sans min-h-screen relative flex flex-col justify-between">
      
      <div className="absolute top-48 left-[-10%] w-[500px] h-[500px] bg-purple-100/40 rounded-full filter blur-[120px] pointer-events-none z-0 animate-pulse duration-[8000ms]" />
      <div className="absolute top-[800px] right-[-10%] w-[600px] h-[600px] bg-indigo-50/50 rounded-full filter blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[400px] left-[15%] w-[450px] h-[450px] bg-purple-50/40 rounded-full filter blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between shrink-0">
          <div className="max-w-[1650px] w-full mx-auto flex items-center justify-between">
            <div className="flex items-center cursor-pointer group" onClick={() => navigate('/blog')}>
              <img src={logoL} alt="Logo" className="h-8 w-auto object-contain group-hover:rotate-6 transition-transform duration-300" />
            </div>

            <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <a href="#" className="hover:text-slate-900 transition-colors">Product</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Solutions</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Agencies</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Pricing</a>
              <a href="/blog" className="text-indigo-600 hover:text-indigo-700 transition-colors">Resources</a>
            </nav>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-5 py-2 border border-slate-900 hover:bg-slate-50 text-slate-900 text-xs font-bold rounded-full transition-all cursor-pointer"
              >
                Get Started
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-slate-600 hover:text-slate-955 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-[1650px] w-[95%] mx-auto px-4 md:px-8 pt-24 pb-12 space-y-12">
          <div className="flex items-center justify-end">
            <div className="relative w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          {searchQuery ? (
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-slate-800">
                Found {filteredArticles.length} article(s)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => navigate(`/blog/${article.id}`)}
                    className="group cursor-pointer flex flex-col hover:-translate-y-1.5 transition-all duration-300"
                  >
                    <div className="aspect-[4/3] rounded-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-md transition-shadow">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-500"
                      />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-4 mb-1.5 block">
                      {article.category}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16 items-start">
                
                <div className="space-y-16">
                  {activeLeftArticle && (
                    <div
                      onClick={() => navigate(`/blog/${activeLeftArticle.id}`)}
                      className="group cursor-pointer flex flex-col hover:-translate-y-2 transition-all duration-500"
                    >
                      <div className="aspect-[3/4] w-full rounded-tr-[100px] rounded-bl-[100px] rounded-tl-[32px] rounded-br-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                        <img
                          src={activeLeftArticle.coverImage}
                          alt={activeLeftArticle.title}
                          className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-4 mb-1.5 block">
                        {activeLeftArticle.category}
                      </span>
                      <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-purple-600 transition-colors duration-300">
                        {activeLeftArticle.title}
                      </h3>
                    </div>
                  )}

                  {articleCol1Bottom && (
                    <div
                      onClick={() => navigate(`/blog/${articleCol1Bottom.id}`)}
                      className="group cursor-pointer flex flex-col pt-4 hover:-translate-y-2 transition-all duration-500"
                    >
                      <div className="aspect-[4/3] w-full rounded-tl-[100px] rounded-br-[100px] rounded-tr-[32px] rounded-bl-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                        <img
                          src={articleCol1Bottom.coverImage}
                          alt={articleCol1Bottom.title}
                          className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-650 mt-4 mb-1.5 block">
                        {articleCol1Bottom.category}
                      </span>
                      <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                        {articleCol1Bottom.title}
                      </h3>
                    </div>
                  )}
                </div>

                <div className="space-y-16">
                  <div className="pb-4 flex items-center justify-between border-b border-slate-100">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-500 block mb-1">
                        Featured articles
                      </span>
                      <h2 className="text-[44px] font-black text-slate-955 leading-none tracking-tight">
                        Editor's<br />choice
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handlePrevLeftArticle}
                        className="border border-slate-200 rounded-full p-2.5 text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer active:scale-90"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={handleNextLeftArticle}
                        className="border border-slate-200 rounded-full p-2.5 text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer active:scale-90"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {articleCol2Top && (
                    <div
                      onClick={() => navigate(`/blog/${articleCol2Top.id}`)}
                      className="group cursor-pointer flex flex-col hover:-translate-y-2 transition-all duration-500"
                    >
                      <div className="aspect-[4/3] w-full rounded-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                        <img
                          src={articleCol2Top.coverImage}
                          alt={articleCol2Top.title}
                          className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-4 mb-2">
                        <span className="text-[9px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                          Tools for Content Creators
                        </span>
                        <span className="text-[9px] font-extrabold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                          Business Funnels
                        </span>
                      </div>

                      <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                        {articleCol2Top.title}
                      </h3>
                    </div>
                  )}

                  {articleCol2Bottom && (
                    <div
                      onClick={() => navigate(`/blog/${articleCol2Bottom.id}`)}
                      className="group cursor-pointer flex flex-col pt-4 hover:-translate-y-2 transition-all duration-500"
                    >
                      <div className="aspect-[3/4] w-full rounded-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                        <img
                          src={articleCol2Bottom.coverImage}
                          alt={articleCol2Bottom.title}
                          className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-4 mb-1.5 block">
                        {articleCol2Bottom.category}
                      </span>
                      <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                        {articleCol2Bottom.title}
                      </h3>
                    </div>
                  )}
                </div>

                <div className="space-y-16">
                  {articleCol3Top && (
                    <div
                      onClick={() => navigate(`/blog/${articleCol3Top.id}`)}
                      className="group cursor-pointer flex flex-col hover:-translate-y-2 transition-all duration-500"
                    >
                      <div className="aspect-[3/4] w-full rounded-tl-[100px] rounded-br-[100px] rounded-tr-[32px] rounded-bl-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                        <img
                          src={articleCol3Top.coverImage}
                          alt={articleCol3Top.title}
                          className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-teal-650 mt-4 mb-1.5 block">
                        {articleCol3Top.category}
                      </span>
                      <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                        {articleCol3Top.title}
                      </h3>
                    </div>
                  )}

                  {articleCol3Bottom && (
                    <div
                      onClick={() => navigate(`/blog/${articleCol3Bottom.id}`)}
                      className="group cursor-pointer flex flex-col pt-4 hover:-translate-y-2 transition-all duration-500"
                    >
                      <div className="aspect-[4/3] w-full rounded-tr-[100px] rounded-bl-[100px] rounded-tl-[32px] rounded-br-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                        <img
                          src={articleCol3Bottom.coverImage}
                          alt={articleCol3Bottom.title}
                          className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-650 mt-4 mb-1.5 block">
                        {articleCol3Bottom.category}
                      </span>
                      <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                        {articleCol3Bottom.title}
                      </h3>
                    </div>
                  )}
                </div>

              </div>

              <div className="w-screen relative left-1/2 right-1/2 -translate-x-1/2 bg-purple-100 pt-12 md:pt-16 pb-16 md:pb-24 px-6 my-20 select-none">
                <div className="relative w-full min-h-[700px] md:min-h-[85vh] rounded-[32px] overflow-hidden group">
                  <img
                    src="/girl_glasses_phone.png" 
                    alt="Scale automation" 
                    className="w-full h-full object-cover absolute inset-0 object-center group-hover:scale-[1.015] transition-transform duration-[4000ms]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-transparent z-10" />

                  <div className="absolute inset-0 z-20 p-8 md:p-14 lg:p-16 flex flex-col justify-start items-start">
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight max-w-2xl">
                      <span className="text-purple-400 block">Scale your business.</span>
                      <span className="text-white block mt-1">With us, you will grow.</span>
                    </h2>

                    <p className="mt-6 text-slate-300 text-base md:text-lg max-w-xl font-medium leading-relaxed">
                      Deploy intelligent visual automation flows to qualify leads, schedule bookings, and close sales automatically. Focus on scaling your brand while our smart systems handle the rest.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-14 px-8 md:px-16">
                  {blogArticles[0] && (
                    <div
                      onClick={() => navigate(`/blog/${blogArticles[0].id}`)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[4/5] w-full rounded-[4px] overflow-hidden bg-slate-200 relative">
                        <img
                          src={blogArticles[0].coverImage}
                          alt={blogArticles[0].title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-4 mb-1 block">
                        {blogArticles[0].category}
                      </span>
                      <h3 className="font-black text-slate-900 text-[15px] leading-snug group-hover:text-purple-700 transition-colors duration-300">
                        {blogArticles[0].title}
                      </h3>
                    </div>
                  )}

                  <div className="flex flex-col rounded-[24px] bg-slate-900 text-white p-6 justify-between aspect-[4/5]">
                    <h3 className="text-2xl md:text-3xl font-black leading-[1.1] tracking-tight">
                      Subscribe<br/>and stay<br/>updated
                    </h3>
                    <div className="flex flex-col gap-3 mt-auto">
                      <input
                        type="email"
                        placeholder="Enter Your e-mail*"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <label className="flex items-start gap-2 text-[10px] text-slate-400 leading-tight cursor-pointer select-none">
                        <input type="checkbox" className="mt-0.5 accent-purple-500" />
                        I agree to opt in to Launchly's privacy policy
                      </label>
                      <button className="w-full bg-white text-slate-900 font-black text-sm uppercase tracking-wider py-2.5 rounded-lg hover:bg-purple-100 transition-colors duration-300 mt-1">
                        Send
                      </button>
                    </div>
                  </div>

                  {blogArticles[1] && (
                    <div
                      onClick={() => navigate(`/blog/${blogArticles[1].id}`)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[4/5] w-full rounded-[4px] overflow-hidden bg-slate-200 relative">
                        <img
                          src={blogArticles[1].coverImage}
                          alt={blogArticles[1].title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-4 mb-1 block">
                        {blogArticles[1].category}
                      </span>
                      <h3 className="font-black text-slate-900 text-[15px] leading-snug group-hover:text-purple-700 transition-colors duration-300">
                        {blogArticles[1].title}
                      </h3>
                    </div>
                  )}

                  {blogArticles[2] && (
                    <div
                      onClick={() => navigate(`/blog/${blogArticles[2].id}`)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[4/5] w-full rounded-[24px] overflow-hidden bg-slate-200 relative">
                        <img
                          src={blogArticles[2].coverImage}
                          alt={blogArticles[2].title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-4 mb-1 block">
                        {blogArticles[2].category}
                      </span>
                      <h3 className="font-black text-slate-900 text-[15px] leading-snug group-hover:text-purple-700 transition-colors duration-300">
                        {blogArticles[2].title}
                      </h3>
                    </div>
                  )}

                  {blogArticles[3] && (
                    <div
                      onClick={() => navigate(`/blog/${blogArticles[3].id}`)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[4/5] w-full rounded-[4px] overflow-hidden bg-slate-200 relative">
                        <img
                          src={blogArticles[3].coverImage}
                          alt={blogArticles[3].title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-4 mb-1 block">
                        {blogArticles[3].category}
                      </span>
                      <h3 className="font-black text-slate-900 text-[15px] leading-snug group-hover:text-purple-700 transition-colors duration-300">
                        {blogArticles[3].title}
                      </h3>
                    </div>
                  )}

                  {blogArticles[4] && (
                    <div
                      onClick={() => navigate(`/blog/${blogArticles[4].id}`)}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[4/5] w-full rounded-[24px] overflow-hidden bg-slate-200 relative">
                        <img
                          src={blogArticles[4].coverImage}
                          alt={blogArticles[4].title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-4 mb-1 block">
                        {blogArticles[4].category}
                      </span>
                      <h3 className="font-black text-slate-900 text-[15px] leading-snug group-hover:text-purple-700 transition-colors duration-300">
                        {blogArticles[4].title}
                      </h3>
                    </div>
                  )}
                </div>
              </div>

              {showMore && remainingArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16 items-start pt-12 border-t border-slate-100 animate-fadeIn">
                  <div className="space-y-16">
                    {articleRow3Col1 && (
                      <div
                        onClick={() => navigate(`/blog/${articleRow3Col1.id}`)}
                        className="group cursor-pointer flex flex-col hover:-translate-y-2 transition-all duration-500"
                      >
                        <div className="aspect-[3/4] w-full rounded-tl-[100px] rounded-br-[100px] rounded-tr-[32px] rounded-bl-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                          <img
                            src={articleRow3Col1.coverImage}
                            alt={articleRow3Col1.title}
                            className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-4 mb-1.5 block">
                          {articleRow3Col1.category}
                        </span>
                        <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                          {articleRow3Col1.title}
                        </h3>
                      </div>
                    )}

                    {articleRow4Col1 && (
                      <div
                        onClick={() => navigate(`/blog/${articleRow4Col1.id}`)}
                        className="group cursor-pointer flex flex-col pt-4 hover:-translate-y-2 transition-all duration-500"
                      >
                        <div className="aspect-[4/3] w-full rounded-tl-[100px] rounded-br-[100px] rounded-tr-[32px] rounded-bl-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                          <img
                            src={articleRow4Col1.coverImage}
                            alt={articleRow4Col1.title}
                            className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-teal-650 mt-4 mb-1.5 block">
                          {articleRow4Col1.category}
                        </span>
                        <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                          {articleRow4Col1.title}
                        </h3>
                      </div>
                    )}
                  </div>

                  <div className="space-y-16">
                    {articleRow3Col2 && (
                      <div
                        onClick={() => navigate(`/blog/${articleRow3Col2.id}`)}
                        className="group cursor-pointer flex flex-col hover:-translate-y-2 transition-all duration-500"
                      >
                        <div className="aspect-[4/3] w-full rounded-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                          <img
                            src={articleRow3Col2.coverImage}
                            alt={articleRow3Col2.title}
                            className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-4 mb-1.5 block">
                          {articleRow3Col2.category}
                        </span>
                        <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                          {articleRow3Col2.title}
                        </h3>
                      </div>
                    )}

                    {articleRow4Col2 && (
                      <div
                        onClick={() => navigate(`/blog/${articleRow4Col2.id}`)}
                        className="group cursor-pointer flex flex-col pt-4 hover:-translate-y-2 transition-all duration-500"
                      >
                        <div className="aspect-[3/4] w-full rounded-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                          <img
                            src={articleRow4Col2.coverImage}
                            alt={articleRow4Col2.title}
                            className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-4 mb-1.5 block">
                          {articleRow4Col2.category}
                        </span>
                        <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                          {articleRow4Col2.title}
                        </h3>
                      </div>
                    )}
                  </div>

                  <div className="space-y-16">
                    {articleRow3Col3 && (
                      <div
                        onClick={() => navigate(`/blog/${articleRow3Col3.id}`)}
                        className="group cursor-pointer flex flex-col hover:-translate-y-2 transition-all duration-500"
                      >
                        <div className="aspect-[3/4] w-full rounded-tr-[100px] rounded-bl-[100px] rounded-tl-[32px] rounded-br-[32px] overflow-hidden border border-slate-100 bg-slate-50 relative shadow-sm group-hover:shadow-indigo-500/10 group-hover:shadow-2xl transition-all duration-500">
                          <img
                            src={articleRow3Col3.coverImage}
                            alt={articleRow3Col3.title}
                            className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-700"
                          />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 mt-4 mb-1.5 block">
                          {articleRow3Col3.category}
                        </span>
                        <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-indigo-650 transition-colors duration-300">
                          {articleRow3Col3.title}
                        </h3>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!showMore && remainingArticles.length > 0 && (
                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 border border-purple-100/50 py-16 px-8 flex flex-col items-center justify-center space-y-6">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500">
                    Want to learn more?
                  </span>
                  <h3 className="text-3xl md:text-5xl font-black text-slate-955 tracking-tight text-center">
                    Discover more reads
                  </h3>
                  <button
                    onClick={() => setShowMore(true)}
                    className="bg-black hover:bg-slate-900 text-white text-xs font-black tracking-widest px-12 py-4.5 rounded-full transition-all cursor-pointer uppercase font-mono shadow-md hover:shadow-indigo-500/20 hover:shadow-2xl active:scale-95 z-10"
                  >
                    DIVE IN
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      <BlogFooter />
    </div>
  );
};

export default BlogPage;
