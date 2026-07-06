import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Check, Users, Plus, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useBotStore } from '../../../store/useBotStore';
import { useBotsQuery } from '../hooks/useBotsQuery';
import { useAuthStore } from '../../../store/useAuthStore';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  inboxSeat: boolean;
  billing: boolean;
  isMe?: boolean;
}

interface TeamGroup {
  id: string;
  name: string;
  memberIds: string[];
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Owner: 'Owner controls contact roles management. Owner can also disable and clone the bot, share its contents, create and install templates, manage billing and payments. There is only one owner role per account.',
  Admin: 'Admins have full access to customize all bot settings, edit automations, invite members, view analytics, and manage billing configurations.',
  Editor: 'Editors can edit automations, tags, custom fields, and view stats, but cannot manage billing, integrations, or other team members.',
  'Inbox Agent': 'Inbox Agents can assign existing Tags and manage Custom User Fields values. They are not allowed to create or edit bot content and cannot view the existing Automations.',
  Viewer: 'This role allows team members to track bot stats and view sent Automations data in "view only" mode. Viewers are not allowed to create or edit bot content.'
};

export const TeamMembersPanel: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery(!!activeBotId);
  const botName = bots.find((b: any) => b.id === activeBotId)?.name || 'Launchly Official';
  const currentUser = useAuthStore((s) => s.user);

  const getMemberName = (m: TeamMember) => {
    if (m.isMe && currentUser?.name) return currentUser.name;
    return m.name;
  };

  const getMemberAvatar = (m: TeamMember) => {
    if (m.isMe && currentUser?.avatar) return currentUser.avatar;
    return m.avatar;
  };

  const [activeSubTab, setActiveSubTab] = useState<'members' | 'groups'>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [groups, setGroups] = useState<TeamGroup[]>([]);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState('Viewer');
  const [inviteLink, setInviteLink] = useState('');

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  useEffect(() => {
    if (activeBotId) {
      const storedMembers = localStorage.getItem(`launchly_members_${activeBotId}`);
      if (storedMembers) {
        setMembers(JSON.parse(storedMembers));
      } else {
        const defaults: TeamMember[] = [
          {
            id: '1',
            name: 'Just Pol',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80',
            role: 'Owner',
            inboxSeat: true,
            billing: true,
            isMe: true
          }
        ];
        setMembers(defaults);
        localStorage.setItem(`launchly_members_${activeBotId}`, JSON.stringify(defaults));
      }

      const storedGroups = localStorage.getItem(`launchly_groups_${activeBotId}`);
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups));
      } else {
        setGroups([]);
      }
    }
  }, [activeBotId]);

  const saveMembers = (newMembers: TeamMember[]) => {
    setMembers(newMembers);
    if (activeBotId) {
      localStorage.setItem(`launchly_members_${activeBotId}`, JSON.stringify(newMembers));
    }
  };

  const saveGroups = (newGroups: TeamGroup[]) => {
    setGroups(newGroups);
    if (activeBotId) {
      localStorage.setItem(`launchly_groups_${activeBotId}`, JSON.stringify(newGroups));
    }
  };

  const handleGenerateInvite = () => {
    const randomId = Math.random().toString(36).substring(7);
    const link = `${window.location.origin}/invite?code=${randomId}&role=${encodeURIComponent(inviteRole)}`;
    setInviteLink(link);
  };

  const handleCompleteInvite = () => {
    if (!inviteLink) return;
    const name = `Member #${members.length + 1}`;
    const newMember: TeamMember = {
      id: Math.random().toString(36).substring(7),
      name,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?auto=format&fit=crop&w=80&h=80`,
      role: inviteRole,
      inboxSeat: inviteRole !== 'Viewer',
      billing: inviteRole === 'Admin'
    };
    const updated = [...members, newMember];
    saveMembers(updated);
    setIsInviteOpen(false);
    setInviteLink('');
    setInviteRole('Viewer');
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: TeamGroup = {
      id: Math.random().toString(36).substring(7),
      name: newGroupName.trim(),
      memberIds: selectedGroupMembers
    };
    const updated = [...groups, newGroup];
    saveGroups(updated);
    setIsCreateGroupOpen(false);
    setNewGroupName('');
    setSelectedGroupMembers([]);
  };

  const handleDeleteGroup = (groupId: string) => {
    const updated = groups.filter(g => g.id !== groupId);
    saveGroups(updated);
  };

  const editingMember = members.find(m => m.id === editingMemberId);

  if (editingMemberId && editingMember) {
    return (
      <div className="space-y-6 text-left">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 select-none">
          <button
            onClick={() => setEditingMemberId(null)}
            className="hover:text-slate-700 transition-colors cursor-pointer"
          >
            Team members
          </button>
          <span>&gt;</span>
          <span className="text-slate-700">{getMemberName(editingMember)}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm divide-y divide-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-center">
            <div className="lg:col-span-3">
              <span className="text-xs font-bold text-slate-800">Name</span>
            </div>
            <div className="lg:col-span-9 flex items-center gap-3">
              <img
                src={getMemberAvatar(editingMember)}
                alt={getMemberName(editingMember)}
                className="w-8 h-8 rounded-full object-cover border border-slate-100"
              />
              <span className="text-xs font-bold text-slate-700">{getMemberName(editingMember)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="text-xs font-bold text-slate-800">Role</span>
            </div>
            <div className="lg:col-span-5">
              <select
                value={editingMember.role}
                onChange={(e) => {
                  const updated = members.map(m => m.id === editingMember.id ? { ...m, role: e.target.value } : m);
                  saveMembers(updated);
                }}
                disabled={editingMember.isMe}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="Owner">Owner</option>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Inbox Agent">Inbox Agent</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div className="lg:col-span-4">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {ROLE_DESCRIPTIONS[editingMember.role] || ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="text-xs font-bold text-slate-800">Seat type</span>
            </div>
            <div className="lg:col-span-5 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingMember.inboxSeat}
                  disabled={editingMember.isMe}
                  onChange={(e) => {
                    const updated = members.map(m => m.id === editingMember.id ? { ...m, inboxSeat: e.target.checked } : m);
                    saveMembers(updated);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700 select-none">Inbox seat</span>
              </label>
            </div>
            <div className="lg:col-span-4">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Team member has full access to Inbox.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="text-xs font-bold text-slate-800">Billing</span>
            </div>
            <div className="lg:col-span-5 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingMember.billing}
                  disabled={editingMember.isMe}
                  onChange={(e) => {
                    const updated = members.map(m => m.id === editingMember.id ? { ...m, billing: e.target.checked } : m);
                    saveMembers(updated);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700 select-none">Has permissions</span>
              </label>
            </div>
            <div className="lg:col-span-4">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Anyone who has billing permissions can access Billing section in Settings, add or remove payment option, edit invoice details and view invoice history.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="text-xs font-bold text-slate-800">Conversations assignment limit</span>
            </div>
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>Unlimited</span>
                <HelpCircle size={13} className="text-slate-400 cursor-help" />
              </span>
              <button
                type="button"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer text-center"
              >
                Set Up The Limit
              </button>
            </div>
            <div className="lg:col-span-4">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                A team member is eligible for auto-assignment if their status is 'Accept new conversations' and they have fewer conversations assigned to them than the assignment limit.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="text-xs font-bold text-slate-800">Remove team member</span>
            </div>
            <div className="lg:col-span-5">
              <button
                type="button"
                disabled
                className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-400 text-xs font-bold rounded-xl select-none cursor-not-allowed"
              >
                Remove
              </button>
            </div>
            <div className="lg:col-span-4">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                You cannot remove yourself, the account owner, or the last team member with billing permissions. If you're looking to leave an account, go to 'Settings' -&gt; 'General'.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('members')}
          className={`px-4 py-2 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'members'
              ? 'border-blue-600 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Team members
        </button>
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`px-4 py-2 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'groups'
              ? 'border-blue-600 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Groups
        </button>
      </div>

      {activeSubTab === 'members' ? (
        <div className="space-y-6 text-left animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-700">
                Team members for {botName}
              </h3>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Invite New Member</span>
              </button>
            </div>

            <div className="p-5 border-b border-slate-100 bg-slate-50/40">
              <h4 className="text-xs font-bold text-slate-800 mb-1">Owner</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Owner controls contact roles management. Owner can also disable and clone the bot, share its contents, create and install templates, manage billing and payments. There is only one owner role per account.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/10 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">
                      <span className="flex items-center gap-1">
                        <span>Inbox seat</span>
                        <HelpCircle size={11} />
                      </span>
                    </th>
                    <th className="px-6 py-3">
                      <span className="flex items-center gap-1">
                        <span>Billing</span>
                        <HelpCircle size={11} />
                      </span>
                    </th>
                    <th className="px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={getMemberAvatar(m)}
                          alt={getMemberName(m)}
                          className="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{getMemberName(m)}</p>
                          {m.isMe && <p className="text-[10px] text-slate-400 mt-0.5">It's me</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {m.inboxSeat && <Check size={16} className="text-slate-400" />}
                      </td>
                      <td className="px-6 py-4">
                        {m.billing && <Check size={16} className="text-slate-400" />}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingMemberId(m.id)}
                          className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 text-left animate-in fade-in duration-150">
          {groups.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                <Users size={20} />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-extrabold text-slate-800 text-sm">Create your first Group</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Group team members based on skill, experience, support-level etc. Use groups to organize your team work and assign Inbox conversations.
                </p>
              </div>
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>+ Group</span>
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
              <div className="p-5 flex justify-between items-center border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-700">Team Groups</h3>
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Group</span>
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {groups.map((group) => (
                  <div key={group.id} className="p-5 flex items-center justify-between hover:bg-slate-50/20 transition-all">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">{group.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {group.memberIds.length} members
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-rose-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isInviteOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Invite New Member
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsInviteOpen(false);
                  setInviteLink('');
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                  Select Role
                </label>
                <div className="space-y-2">
                  {['Admin', 'Editor', 'Inbox Agent', 'Viewer'].map((role) => (
                    <label key={role} className="flex items-center gap-3 select-none cursor-pointer">
                      <input
                        type="radio"
                        name="inviteRole"
                        checked={inviteRole === role}
                        onChange={() => {
                          setInviteRole(role);
                          setInviteLink('');
                        }}
                        className="w-4 h-4 border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-[11px] text-slate-400 font-medium leading-relaxed">
                {ROLE_DESCRIPTIONS[inviteRole] || ''}
              </div>

              {inviteLink && (
                <div className="space-y-2 bg-indigo-50/30 border border-indigo-150 p-3 rounded-2xl animate-fade-in">
                  <span className="block text-[9px] font-extrabold text-indigo-500 uppercase tracking-wider">
                    Invitation link generated
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 px-3 py-1.5 border border-slate-200 focus:outline-none rounded-xl text-xs font-semibold bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        handleCompleteInvite();
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <LinkIcon size={12} />
                      <span>Copy & Add</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-2 border-t border-slate-100">
              {!inviteLink && (
                <button
                  type="button"
                  onClick={handleGenerateInvite}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Generate A Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateGroup} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Create Group
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter new group name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Group Members
                </label>
                <div className="bg-blue-50/40 border border-blue-150 p-3 rounded-2xl text-[11px] text-blue-700 leading-normal flex items-start gap-2 mb-3 select-none">
                  <HelpCircle size={14} className="shrink-0 mt-0.5" />
                  <span>Only team members with Inbox Seats will be available for conversations assignment.</span>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider select-none">
                        <th className="px-4 py-2">Team member</th>
                        <th className="px-4 py-2">Inbox seat</th>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {members.filter(m => m.inboxSeat).map((m) => {
                        const isChecked = selectedGroupMembers.includes(m.id);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/20">
                            <td className="px-4 py-3 flex items-center gap-2">
                              <img src={getMemberAvatar(m)} alt={getMemberName(m)} className="w-6 h-6 rounded-full object-cover" />
                              <span className="font-bold text-slate-800">{getMemberName(m)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Check size={14} className="text-slate-400" />
                            </td>
                            <td className="px-4 py-3 text-slate-400">{m.role}</td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGroupMembers([...selectedGroupMembers, m.id]);
                                  } else {
                                    setSelectedGroupMembers(selectedGroupMembers.filter(id => id !== m.id));
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                      {members.filter(m => m.inboxSeat).length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-400 italic">No members with Inbox Seats</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 select-none">
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newGroupName.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
