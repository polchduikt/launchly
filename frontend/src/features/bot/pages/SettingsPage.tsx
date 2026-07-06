import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { SETTINGS_SECTIONS } from '../config/settingsSections';
import { useLogoutMutation } from '../../auth/hooks/useLogoutMutation';
import { useBotStore } from '../../../store/useBotStore';
import { IntegrationsPanel } from '../../integration/components/IntegrationsPanel';
import { SubscriptionsPanel } from '../../billing/components/SubscriptionsPanel';
import { TelegramSettingsPanel } from '../components/TelegramSettingsPanel';
import { PaymentsPanel } from '../../billing/components/PaymentsPanel';
import { useTagsQuery, useCreateTagMutation, useDeleteTagMutation } from '../../broadcast/hooks/useBroadcastQueries';
import { Loader2, AlertCircle, CheckCircle2, X, Search, Plus, Trash2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabParam || (location.pathname === '/integrations' ? 'integrations' : 'general')
  );
  const [timeZone, setTimeZone] = useState('UTC+07:00');
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const logoutMutation = useLogoutMutation();
  const { data: tags = [], refetch: refetchTags } = useTagsQuery(activeBotId || 0);
  const createTagMutation = useCreateTagMutation(activeBotId || 0);
  const deleteTagMutation = useDeleteTagMutation(activeBotId || 0);
  const [userFields, setUserFields] = useState<{ name: string; type: string; description: string }[]>([]);
  const [fieldsSearch, setFieldsSearch] = useState('');
  const [tagsSearch, setTagsSearch] = useState('');
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');
  const [newFieldDesc, setNewFieldDesc] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagFolder, setNewTagFolder] = useState('Tags');

  useEffect(() => {
    if (activeBotId) {
      const stored = localStorage.getItem(`launchly_custom_fields_${activeBotId}`);
      if (stored) {
        try {
          setUserFields(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored user fields', e);
        }
      } else {
        const defaults = [
          { name: 'Kr', type: 'Text', description: 'User credit count' },
          { name: 'Рыба', type: 'Text', description: 'Favorite fish type' }
        ];
        setUserFields(defaults);
        localStorage.setItem(`launchly_custom_fields_${activeBotId}`, JSON.stringify(defaults));
      }
    }
  }, [activeBotId]);

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !activeBotId) return;

    const newField = {
      name: newFieldName.trim(),
      type: newFieldType,
      description: newFieldDesc.trim()
    };

    const updated = [...userFields.filter(f => f.name !== newField.name), newField];
    setUserFields(updated);
    localStorage.setItem(`launchly_custom_fields_${activeBotId}`, JSON.stringify(updated));

    setIsFieldModalOpen(false);
    setNewFieldName('');
    setNewFieldDesc('');
    setNewFieldType('Text');
  };

  const handleDeleteField = (name: string) => {
    if (!activeBotId) return;
    const updated = userFields.filter(f => f.name !== name);
    setUserFields(updated);
    localStorage.setItem(`launchly_custom_fields_${activeBotId}`, JSON.stringify(updated));
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !activeBotId) return;
    
    let formattedName = newTagName.trim();
    if (newTagFolder.trim() && newTagFolder.trim() !== 'Tags') {
      formattedName = `${newTagFolder.trim()}/${newTagName.trim()}`;
    }

    try {
      await createTagMutation.mutateAsync({ name: formattedName });
      setIsTagModalOpen(false);
      setNewTagName('');
      setNewTagFolder('Tags');
      refetchTags();
    } catch (err) {
      console.error('Failed to create tag', err);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!activeBotId) return;
    try {
      await deleteTagMutation.mutateAsync(tagId);
      refetchTags();
    } catch (err) {
      console.error('Failed to delete tag', err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('googleAuth') === 'success') {
      setShowSuccessBanner(true);
      setActiveTab('integrations');
      navigate('/settings?tab=integrations', { replace: true });
    } else {
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      } else if (location.pathname === '/integrations') {
        setActiveTab('integrations');
      } else {
        setActiveTab('general');
      }
    }
  }, [location.pathname, location.search, navigate]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-screen bg-slate-50 font-sans">
        <aside className="w-60 bg-slate-50 border-r border-slate-200 p-4 shrink-0 hidden md:block overflow-y-auto max-h-screen pb-20">
          <div className="space-y-6">
            {SETTINGS_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 select-none">
                  {section.title}
                </h3>
                <nav className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        navigate(`/settings?tab=${item.id}`, { replace: true });
                      }}
                      className={`w-full flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-left transition-all ${
                        activeTab === item.id
                          ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
          </div>

          {showSuccessBanner && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold">Google Sheets account successfully connected!</span>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-emerald-500 hover:text-emerald-800 p-1 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {activeTab === 'general' ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm divide-y divide-slate-100 overflow-hidden">
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Account Time Zone</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full md:max-w-md px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all bg-slate-50/50"
                  >
                    <option value="UTC+07:00">(UTC+07:00) - Barnaul Time</option>
                    <option value="UTC+03:00">(UTC+03:00) - Kyiv, Moscow Time</option>
                    <option value="UTC+00:00">(UTC+00:00) - London, GMT</option>
                    <option value="UTC-05:00">(UTC-05:00) - New York, EST</option>
                  </select>
                  <div className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    All the data in Launchly will be displayed and exported according to this timezone.{' '}
                    <button className="text-indigo-600 font-bold hover:underline">Learn more</button>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Clone to Another Account</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100">
                    Clone This Account
                  </button>
                  <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    Copy all content to another account
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Use as Template</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100">
                    Create Account Template
                  </button>
                  <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    Create a snapshot of this account and share it via link
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Leave Account</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button className="px-5 py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl transition-all select-none cursor-not-allowed border border-slate-200">
                    Leave
                  </button>
                  <p className="text-xs text-slate-500 leading-relaxed md:max-w-xs">
                    Transfer your ownership to another team member if you want to leave this account
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-slate-800">Sign Out</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <span>Sign Out</span>
                    )}
                  </button>
                  <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    Sign out of your Launchly account from this device
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                <div className="w-full md:w-1/3">
                  <h3 className="font-bold text-sm text-rose-600">Delete Account</h3>
                </div>
                <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-4 items-start">
                  <button className="px-5 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer">
                    Delete
                  </button>
                  <p className="text-xs text-slate-400 leading-relaxed md:max-w-xs">
                    Continue to account deletion
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === 'fields' ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">User Fields</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage custom user fields to collect and store contact details.</p>
                  </div>
                  <button
                    onClick={() => setIsFieldModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>New User Field</span>
                  </button>
                </div>

                <div className="relative max-w-sm">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={fieldsSearch}
                    onChange={(e) => setFieldsSearch(e.target.value)}
                    placeholder="Search by User Field name"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 font-semibold bg-slate-50/20"
                  />
                </div>

                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-5 py-3 select-none">Name</th>
                        <th className="px-5 py-3 select-none">Type</th>
                        <th className="px-5 py-3 select-none">Description</th>
                        <th className="px-5 py-3 text-right select-none">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {userFields
                        .filter(f => f.name.toLowerCase().includes(fieldsSearch.toLowerCase()))
                        .map((field) => (
                          <tr key={field.name} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-3.5 font-bold text-slate-700">{field.name}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md font-bold text-[10px]">
                                {field.type}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-400 font-medium">{field.description || '-'}</td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => handleDeleteField(field.name)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      {userFields.filter(f => f.name.toLowerCase().includes(fieldsSearch.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-slate-400 italic">No custom user fields found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'tags' ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">Tags</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Label contacts to categorize, segment, and filter your audience.</p>
                  </div>
                  <button
                    onClick={() => setIsTagModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>New Tag</span>
                  </button>
                </div>

                <div className="relative max-w-sm">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={tagsSearch}
                    onChange={(e) => setTagsSearch(e.target.value)}
                    placeholder="Search by tag name"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-400 font-semibold bg-slate-50/20"
                  />
                </div>

                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-5 py-3 select-none">Name</th>
                        <th className="px-5 py-3 select-none">Folder</th>
                        <th className="px-5 py-3 text-right select-none">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {tags
                        .filter(t => t.name.toLowerCase().includes(tagsSearch.toLowerCase()))
                        .map((tag) => {
                          const parts = tag.name.split('/');
                          const hasFolder = parts.length > 1;
                          const folderName = hasFolder ? parts[0] : 'Tags';
                          const tagNameOnly = hasFolder ? parts.slice(1).join('/') : tag.name;
                          return (
                            <tr key={tag.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-slate-700">{tagNameOnly}</td>
                              <td className="px-5 py-3.5">
                                <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-md font-bold text-[10px]">
                                  {folderName}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={() => handleDeleteTag(tag.id)}
                                  disabled={deleteTagMutation.isPending}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      {tags.filter(t => t.name.toLowerCase().includes(tagsSearch.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-10 text-slate-400 italic">No tags found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'integrations' ? (
            activeBotId ? (
              <IntegrationsPanel botId={activeBotId} />
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md mx-auto space-y-4 shadow-sm select-none">
                <AlertCircle size={40} className="text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No active bot found</h3>
                <p className="text-xs text-slate-400">Please connect a Telegram bot first to access integrations.</p>
              </div>
            )
          ) : activeTab === 'subscriptions' ? (
            <SubscriptionsPanel />
          ) : activeTab === 'payments' ? (
            <PaymentsPanel />
          ) : activeTab === 'telegram' ? (
            <TelegramSettingsPanel />
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-12 text-center text-sm text-slate-400">
              This section is currently under development. Settings will be linked here soon.
            </div>
          )}
        </div>
      </div>

      
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateField} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Create New User Field
              </h3>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Field Name
                </label>
                <input
                  type="text"
                  required
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. favorite_color"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-white"
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                  <option value="Boolean">Boolean</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newFieldDesc}
                  onChange={(e) => setNewFieldDesc(e.target.value)}
                  placeholder="e.g. Stores customer's favorite color"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow shadow-indigo-100"
              >
                Create Field
              </button>
            </div>
          </form>
        </div>
      )}

      
      {isTagModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateTag} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#222] uppercase tracking-wide">
                Create tag
              </h3>
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-500 leading-normal mb-1">
              A tag is simply a label used to describe an identifying characteristic about a contact so you can sort and organize your audience. Tags allow you to segment your contacts.
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Folder
                </label>
                <input
                  type="text"
                  value={newTagFolder}
                  onChange={(e) => setNewTagFolder(e.target.value)}
                  placeholder="Tags"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTagName.trim() || createTagMutation.isPending}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow shadow-indigo-100"
              >
                {createTagMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};
