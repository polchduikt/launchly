import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BLOG_ARTICLES } from '../../../const/blogData';
import { useBlogArticleDetailQuery } from '../../../hooks/dashboard/useBlogQueries';
import { ArrowLeft, Link, Share2, Calendar, User, Clock, Loader2 } from 'lucide-react';
import logoL from '../../../assets/images/logo-l.png';

const BlogFooter: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 text-white py-16 px-6 md:px-16 mt-20 select-none">
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

export const BlogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: article = BLOG_ARTICLES.find((a) => a.id === id), isLoading } = useBlogArticleDetailQuery(id);

  if (isLoading) {
    return (
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
        <span className="text-xs font-semibold text-slate-500 mt-2">Loading article...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8 min-h-screen">
        <h2 className="text-xl font-bold text-slate-800">Article not found</h2>
        <button
          onClick={() => navigate('/blog')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Blog
        </button>
      </div>
    );
  }

  const handleShareArticle = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Article link copied to clipboard!');
  };

  return (
    <div className="flex-1 bg-white overflow-y-auto font-sans min-h-screen relative flex flex-col justify-between w-full">
      <div>
        <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between shrink-0">
          <div className="max-w-[1650px] w-full mx-auto flex items-center justify-between">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/blog')}>
               <img src={logoL} alt="Logo" className="h-8 w-auto object-contain" />
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
        <div className="max-w-[1650px] w-[95%] mx-auto px-4 md:px-8 pt-24 pb-6 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Blog</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareArticle}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              title="Copy Link"
            >
              <Link size={15} />
            </button>
            <button
              onClick={handleShareArticle}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              title="Share"
            >
              <Share2 size={15} />
            </button>
          </div>
        </div>

        <article className="max-w-4xl mx-auto px-6 py-12 space-y-8">
          <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-widest text-indigo-600 uppercase">
            <span>{article.category}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span>Blog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-955 leading-tight tracking-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 font-bold border-y border-slate-100 py-4">
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-slate-400" />
              <span>Written by {article.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" />
              <span>{article.readTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              <span>{article.date}</span>
            </div>
          </div>

          <div className="aspect-[16/9] w-full rounded-[32px] overflow-hidden border border-slate-100 bg-slate-50 shadow-md">
            <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6 pt-4">
            {article.contentBlocks.map((block, idx) => {
              if (block.type === 'paragraph') {
                return (
                  <p key={idx} className="text-slate-800 text-lg leading-relaxed font-normal">
                    {block.text}
                  </p>
                );
              }
              if (block.type === 'heading') {
                const Tag = (`h${Math.min(6, Math.max(1, block.level || 2))}` as unknown) as React.ElementType;
                const sizeClass =
                  block.level === 1
                    ? 'text-3xl font-black text-slate-900 mt-10'
                    : 'text-2xl font-extrabold text-slate-900 mt-8';
                return (
                  <Tag key={idx} className={`${sizeClass} tracking-tight`}>
                    {block.text}
                  </Tag>
                );
              }
              if (block.type === 'quote') {
                return (
                  <div key={idx} className="border-l-4 border-indigo-650 bg-indigo-50/20 rounded-r-3xl p-8 my-8">
                    <p className="italic text-slate-900 text-xl font-bold leading-relaxed">
                      "{block.text}"
                    </p>
                    {block.author && (
                      <p className="text-xs font-bold text-slate-400 mt-2">— {block.author}</p>
                    )}
                  </div>
                );
              }
              if (block.type === 'list') {
                return (
                  <ul key={idx} className="list-disc pl-6 space-y-2 text-slate-800 text-lg leading-relaxed font-normal">
                    {block.items.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                );
              }
              if (block.type === 'image') {
                return (
                  <div key={idx} className="my-8 space-y-2 max-w-4xl mx-auto w-full">
                    <div className="rounded-[32px] overflow-hidden border border-slate-100 shadow-md">
                      <img src={block.url} alt={block.caption || 'Inline Image'} className="w-full h-full object-cover" />
                    </div>
                    {block.caption && (
                      <p className="text-xs font-semibold text-slate-400 text-center italic mt-2">{block.caption}</p>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase border border-slate-200 px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>
      </div>
      <BlogFooter />
    </div>
  );
};

export default BlogDetailPage;
