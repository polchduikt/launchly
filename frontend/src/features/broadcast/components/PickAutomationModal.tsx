import React from 'react';
import { Plus, Search, Grid, X } from 'lucide-react';

interface PickAutomationModalProps {
  isPickOpen: boolean;
  setIsPickOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSelectAutomation: (autoName: string) => void;
}

export const PickAutomationModal: React.FC<PickAutomationModalProps> = ({
  isPickOpen,
  setIsPickOpen,
  searchQuery,
  setSearchQuery,
  handleSelectAutomation,
}) => {
  if (!isPickOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-4xl w-full h-[550px] flex overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex-1 p-6 flex flex-col h-full border-r border-slate-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Pick Automation</h3>
            <button className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold text-indigo-650 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-all cursor-pointer">
              <Plus size={12} />
              New Automation
            </button>
          </div>

          <div className="relative my-4 shrink-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search all Automations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5 text-center w-16">Runs</th>
                  <th className="py-2.5 text-center w-16">CTR</th>
                  <th className="py-2.5 w-24">Modified</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  onClick={() => handleSelectAutomation('Telegram Welcome Message')}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-3 font-semibold text-xs text-slate-800">Telegram Welcome Message</td>
                  <td className="py-3 text-center text-xs text-slate-500 font-bold">2</td>
                  <td className="py-3 text-center text-xs text-slate-500 font-bold">100%</td>
                  <td className="py-3 text-[10px] text-slate-400 font-bold">18 min ago</td>
                </tr>
                <tr
                  onClick={() => handleSelectAutomation('Telegram Default Reply')}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-3 font-semibold text-xs text-slate-800">Telegram Default Reply</td>
                  <td className="py-3 text-center text-xs text-slate-500 font-bold">0</td>
                  <td className="py-3 text-center text-xs text-slate-500 font-bold">n/a</td>
                  <td className="py-3 text-[10px] text-slate-400 font-bold">24 min ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="w-80 bg-slate-50/50 p-6 flex flex-col justify-center items-center text-center select-none">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-xs border border-slate-200">
            <Grid size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Preview Automation</h4>
          <p className="text-[10px] text-slate-400 font-bold max-w-xs leading-relaxed">
            Select any Automation with a published version to see a preview
          </p>
        </div>

        <button
          onClick={() => setIsPickOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-1 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
