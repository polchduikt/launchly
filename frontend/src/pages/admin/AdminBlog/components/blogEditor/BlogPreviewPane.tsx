import React from 'react';
import type { ContentBlock } from './types';

interface BlogPreviewPaneProps {
  formCategory: string;
  formLanguage: string;
  formTitle: string;
  formAuthor: string;
  formDate: string;
  computedReadTime: string;
  formCoverImage: string;
  formSummary: string;
  formBlocks: ContentBlock[];
}

export const BlogPreviewPane: React.FC<BlogPreviewPaneProps> = ({
  formCategory,
  formLanguage,
  formTitle,
  formAuthor,
  formDate,
  computedReadTime,
  formCoverImage,
  formSummary,
  formBlocks,
}) => {
  return (
    <div className="bg-white p-8 rounded-3xl border-2 border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] space-y-6 overflow-hidden">
      <div className="space-y-3 pb-6 border-b-2 border-slate-100">
        <div className="flex items-center gap-2">
          <div className="inline-block px-3 py-1 bg-[#0A0A0A] text-[#F2EBDD] rounded-lg text-[10px] font-black uppercase">
            {formCategory || 'Category'}
          </div>
          <div
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-[#0A0A0A] ${
              formLanguage === 'en' ? 'bg-amber-400 text-[#0A0A0A]' : 'bg-blue-600 text-white'
            }`}
          >
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
              <p
                key={idx}
                className="text-base text-slate-800 leading-relaxed whitespace-pre-wrap font-normal break-words [overflow-wrap:anywhere]"
              >
                {block.text}
              </p>
            );
          }
          if (block.type === 'heading') {
            return block.level === 3 ? (
              <h3
                key={idx}
                className="font-['Anybody',sans-serif] text-xl font-black text-[#0A0A0A] uppercase pt-4 break-words [overflow-wrap:anywhere]"
              >
                {block.text}
              </h3>
            ) : (
              <h2
                key={idx}
                className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase pt-6 pb-2 border-b-2 border-slate-200 break-words [overflow-wrap:anywhere]"
              >
                {block.text}
              </h2>
            );
          }
          if (block.type === 'quote') {
            return (
              <blockquote
                key={idx}
                className="p-5 my-3 border-l-4 border-[#0A0A0A] bg-slate-50 rounded-r-2xl italic text-slate-800 break-words [overflow-wrap:anywhere]"
              >
                <p className="text-base font-medium">"{block.text}"</p>
                {block.author && (
                  <cite className="block text-xs font-bold text-slate-500 mt-2 not-italic font-['JetBrains_Mono',monospace]">
                    — {block.author}
                  </cite>
                )}
              </blockquote>
            );
          }
          if (block.type === 'list') {
            return (
              <ul key={idx} className="list-disc list-inside space-y-2 text-base text-slate-800 pl-2">
                {block.items.map((it, i) => (
                  <li key={i} className="font-normal break-words [overflow-wrap:anywhere]">
                    {it}
                  </li>
                ))}
              </ul>
            );
          }
          if (block.type === 'image') {
            return (
              <figure key={idx} className="my-6 space-y-2">
                <img
                  src={block.url}
                  alt={block.caption || ''}
                  className="w-full rounded-2xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] object-cover max-h-[500px]"
                />
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
  );
};
