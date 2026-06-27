import React, { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { TagSearchSelectProps } from '../../../../../types/bot';

export const TagSearchSelect: React.FC<TagSearchSelectProps> = ({ tagName, tags, onChange, onCreateTag }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const filteredTags = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        type="text"
        placeholder="Select or search tag..."
        value={isOpen ? search : (tagName || '')}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 text-xs font-bold bg-white"
      />
      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => {
              onCreateTag();
              setIsOpen(false);
            }}
            className="w-full text-left px-2.5 py-1.5 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus size={12} />
            <span>Create new tag...</span>
          </button>

          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                onChange(tag);
                setIsOpen(false);
                setSearch('');
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer"
            >
              {tag.name}
            </button>
          ))}
          {filteredTags.length === 0 && search.trim() !== '' && (
            <button
              type="button"
              onClick={() => {
                onCreateTag();
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 text-slate-400 italic text-xs font-semibold cursor-pointer"
            >
              No tag matches "{search}". Create it?
            </button>
          )}
        </div>
      )}
    </div>
  );
};
