import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Globe } from 'lucide-react';
import { getAllTimezones } from '../../../utils/timezones';
import { t } from '../../../i18n/config';

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const timezones = useMemo(() => getAllTimezones(), []);

  const selectedLabel = useMemo(
    () => timezones.find((t) => t.value === value)?.label ?? value,
    [timezones, value]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return timezones;
    return timezones.filter(
      (t) => t.label.toLowerCase().includes(q) || t.value.toLowerCase().includes(q)
    );
  }, [timezones, search]);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
      const idx = filtered.findIndex((t) => t.value === value);
      if (idx >= 0 && listRef.current) {
        const item = listRef.current.children[idx] as HTMLElement;
        item?.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [open]);

  const handleSelect = (tz: string) => {
    onChange(tz);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full md:max-w-md">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`
          w-full flex items-center gap-2 px-4 py-2.5
          rounded-xl border-2 border-ink
          text-xs font-bold text-ink
          bg-white text-left
          transition-all
          ${open ? 'ring-2 ring-ink ring-offset-1' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#f7f4ee]'}
        `}
      >
        <Globe size={13} className="shrink-0 opacity-60" />
        <span className="flex-1 truncate">{selectedLabel}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 opacity-60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border-2 border-ink rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b-2 border-ink/10 flex items-center gap-2 px-3">
            <Search size={12} className="text-ink/50 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('settings.timezone.search_placeholder', 'Пошук часового поясу...')}
              className="flex-1 text-xs font-bold text-ink bg-transparent outline-none placeholder:text-ink/30 py-1"
            />
          </div>
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-ink/5"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-ink/40 font-bold text-center">
                {t('settings.timezone.no_results', 'Нічого не знайдено')}
              </li>
            ) : (
              filtered.map((tz) => (
                <li key={tz.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(tz.value)}
                    className={`
                      w-full text-left px-4 py-2.5 text-xs font-bold transition-all
                      ${tz.value === value
                        ? 'bg-ink text-canvas'
                        : 'text-ink hover:bg-canvas'
                      }
                    `}
                  >
                    {tz.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
