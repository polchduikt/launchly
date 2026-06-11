import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { Search, FolderPlus, Plus, MoreVertical, Trash2, LayoutGrid, List } from 'lucide-react';
import { AUTOMATION_TABS } from '../config/automationTabs';

interface AutomationFlow {
  id: number;
  name: string;
  runs: string | number;
  ctr: string;
  modified: string;
  status: 'draft' | 'active';
}

export const AutomationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'my' | 'basic' | 'sequences'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');


  const [flows] = useState<AutomationFlow[]>([
    { id: 1, name: 'Telegram Welcome Message', runs: 'n/a', ctr: 'n/a', modified: '18 seconds ago', status: 'draft' },
    { id: 2, name: 'Telegram Default Reply', runs: 0, ctr: 'n/a', modified: '3 minutes ago', status: 'active' },
  ]);

  const filteredFlows = flows.filter((flow) =>
    flow.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-screen bg-slate-50 font-sans">
        <aside className="w-56 bg-slate-50 border-r border-slate-200 p-4 shrink-0 hidden md:block">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Automation</h2>
          <nav className="space-y-1">
            {AUTOMATION_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Automation</h1>
          </div>

          <div className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">My Automations</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all cursor-pointer">
                  <FolderPlus size={14} />
                  <span>New Folder</span>
                </button>
                <button
                  onClick={() => navigate('/builder')}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
                >
                  <Plus size={14} />
                  <span>New Automation</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div className="relative max-w-sm w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search all Automations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                />
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 text-xs text-slate-500 font-bold select-none">
                <button className="flex items-center gap-1.5 hover:text-slate-800 transition-all cursor-pointer">
                  <Trash2 size={14} />
                  <span>Trash</span>
                </button>
                <div className="h-4 w-px bg-slate-200 hidden md:block" />
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                    </th>
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2 w-28 text-center">Runs</th>
                    <th className="py-3 px-2 w-28 text-center">CTR</th>
                    <th className="py-3 px-2 w-40">Modified</th>
                    <th className="py-3 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFlows.length > 0 ? (
                    filteredFlows.map((flow) => (
                      <tr
                        key={flow.id}
                        onClick={() => navigate('/builder')}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-all group cursor-pointer"
                      >
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${flow.status === 'active' ? 'bg-amber-500' : 'bg-amber-300'}`} />
                            <span className="font-semibold text-sm text-slate-800 hover:text-indigo-600 transition-all">
                              {flow.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-sm text-slate-500 text-center">{flow.runs}</td>
                        <td className="py-4 px-2 text-sm text-slate-500 text-center">{flow.ctr}</td>
                        <td className="py-4 px-2 text-xs text-slate-500">{flow.modified}</td>
                        <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button className="text-slate-400 hover:text-slate-700 p-1 rounded transition-all cursor-pointer">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                        No automations found. Create a new automation to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
