import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Check, Users, Plus } from 'lucide-react';
import { useBotStore } from '../../../store/useBotStore';
import { useBotsQuery } from '../hooks/useBotsQuery';
import { useAuthStore } from '../../../store/useAuthStore';
import { t } from '../../../i18n';
import {
  getTeamMembersApi,
  inviteMemberApi,
  cancelInvitationApi,
  updateMemberApi,
  removeMemberApi
} from '../api/teamApi';
import type { TeamMemberResponse } from '../api/teamApi';

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'Owner': return t('settings.members.role.owner_desc');
    case 'Admin': return t('settings.members.role.admin_desc');
    case 'Editor': return t('settings.members.role.editor_desc');
    case 'Inbox Agent': return t('settings.members.role.agent_desc');
    case 'Viewer': return t('settings.members.role.viewer_desc');
    default: return '';
  }
};

export const TeamMembersPanel: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery(!!activeBotId);
  const botName = bots.find((b: any) => b.id === activeBotId)?.name || 'Launchly Official';
  const currentUser = useAuthStore((s) => s.user);

  const [activeSubTab, setActiveSubTab] = useState<'members' | 'groups'>('members');
  const [members, setMembers] = useState<TeamMemberResponse[]>([]);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');
  const [inviteInboxSeat, setInviteInboxSeat] = useState(false);
  const [inviteBilling, setInviteBilling] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMembers = async () => {
    if (!activeBotId) return;
    try {
      const data = await getTeamMembersApi(activeBotId);
      setMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeBotId]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBotId || !inviteEmail.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await inviteMemberApi(activeBotId, {
        email: inviteEmail.trim(),
        role: inviteRole,
        inboxSeat: inviteInboxSeat,
        billingPermission: inviteBilling
      });
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('Viewer');
      setInviteInboxSeat(false);
      setInviteBilling(false);
      fetchMembers();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async (
    targetUserId: number,
    updatedRole: string,
    updatedInboxSeat: boolean,
    updatedBilling: boolean
  ) => {
    if (!activeBotId) return;
    try {
      await updateMemberApi(activeBotId, targetUserId, {
        role: updatedRole,
        inboxSeat: updatedInboxSeat,
        billingPermission: updatedBilling
      });
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMemberOrInvite = async (member: TeamMemberResponse) => {
    if (!activeBotId) return;
    try {
      const isMe = member.userId === currentUser?.id;
      if (member.isPending) {
        await cancelInvitationApi(activeBotId, member.id);
      } else if (member.userId) {
        await removeMemberApi(activeBotId, member.userId);
      }
      setEditingMemberId(null);
      if (isMe) {
        window.location.href = '/';
      } else {
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMemberName = (m: TeamMemberResponse) => {
    if (m.userId === currentUser?.id && currentUser?.name) {
      return currentUser.name;
    }
    return m.name || m.email;
  };

  const getMemberAvatar = (m: TeamMemberResponse) => {
    if (m.userId === currentUser?.id && currentUser?.avatar) {
      return currentUser.avatar;
    }
    return m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80';
  };

  const editingMember = members.find(m => m.id === editingMemberId);

  if (editingMemberId && editingMember) {
    const isMe = editingMember.userId === currentUser?.id;
    const isOwner = editingMember.role === 'Owner';

    return (
      <div className="space-y-6 text-left">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 select-none">
          <button
            onClick={() => setEditingMemberId(null)}
            className="hover:text-slate-700 transition-colors cursor-pointer"
          >
            {t('settings.members.breadcrumb')}
          </button>
          <span>&gt;</span>
          <span className="text-slate-700">{getMemberName(editingMember)}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm divide-y divide-slate-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-center">
            <div className="lg:col-span-3">
              <span className="text-xs font-bold text-slate-800">{t('settings.members.name')}</span>
            </div>
            <div className="lg:col-span-9 flex items-center gap-3">
              <img
                src={getMemberAvatar(editingMember)}
                alt={getMemberName(editingMember)}
                className="w-8 h-8 rounded-full object-cover border border-slate-100"
              />
              <span className="text-xs font-bold text-slate-700">{getMemberName(editingMember)}</span>
              {editingMember.isPending && (
                <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-md font-bold text-[10px]">
                  {t('settings.members.pending_invite')}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="text-xs font-bold text-slate-800">{t('settings.members.role_label')}</span>
            </div>
            <div className="lg:col-span-5">
              <select
                value={editingMember.role}
                onChange={(e) => {
                  if (editingMember.userId) {
                    handleUpdatePermissions(
                      editingMember.userId,
                      e.target.value,
                      editingMember.inboxSeat,
                      editingMember.billingPermission
                    );
                  }
                }}
                disabled={isMe || isOwner || editingMember.isPending}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="Owner" disabled>Owner</option>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Inbox Agent">Inbox Agent</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div className="lg:col-span-4">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {getRoleDescription(editingMember.role)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="text-xs font-bold text-slate-800">{t('settings.members.seat_type')}</span>
            </div>
            <div className="lg:col-span-5 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingMember.inboxSeat}
                  disabled={isMe || isOwner || editingMember.isPending}
                  onChange={(e) => {
                    if (editingMember.userId) {
                      handleUpdatePermissions(
                        editingMember.userId,
                        editingMember.role,
                        e.target.checked,
                        editingMember.billingPermission
                      );
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700 select-none">{t('settings.members.inbox_seat')}</span>
              </label>
            </div>
            <div className="lg:col-span-4">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {t('settings.members.inbox_seat_desc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="text-xs font-bold text-slate-800">{t('settings.members.billing')}</span>
            </div>
            <div className="lg:col-span-5 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingMember.billingPermission}
                  disabled={isMe || isOwner || editingMember.isPending}
                  onChange={(e) => {
                    if (editingMember.userId) {
                      handleUpdatePermissions(
                        editingMember.userId,
                        editingMember.role,
                        editingMember.inboxSeat,
                        e.target.checked
                      );
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-xs font-semibold text-slate-700 select-none">{t('settings.members.has_permissions')}</span>
              </label>
            </div>
            <div className="lg:col-span-4">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {t('settings.members.billing_desc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="text-xs font-bold text-slate-800">{t('settings.members.remove')}</span>
            </div>
            <div className="lg:col-span-5">
              <button
                type="button"
                onClick={() => handleRemoveMemberOrInvite(editingMember)}
                disabled={isOwner || (isMe && editingMember.role === 'Owner')}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl select-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400"
              >
                {editingMember.isPending ? t('settings.members.btn.cancel_inv') : isMe ? t('settings.members.btn.leave_ws') : t('settings.members.btn.remove_mem')}
              </button>
            </div>
            <div className="lg:col-span-4">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                {isMe
                  ? isOwner
                    ? t('settings.members.desc.owner_leave')
                    : t('settings.members.desc.me_leave')
                  : isOwner
                  ? t('settings.members.desc.owner_remove')
                  : t('settings.members.desc.member_remove')}
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
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          {t('settings.members.breadcrumb')}
        </button>
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`px-4 py-2 text-xs font-bold cursor-pointer transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'groups'
              ? 'border-blue-600 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          {t('settings.members.groups')}
        </button>
      </div>

      {activeSubTab === 'members' ? (
        <div className="space-y-6 text-left animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-700">
                {t('settings.members.title', { name: botName })}
              </h3>
              <button
                onClick={() => {
                  setErrorMsg('');
                  setIsInviteOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>{t('settings.members.invite_btn')}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/10 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                    <th className="px-6 py-3">{t('settings.members.name')}</th>
                    <th className="px-6 py-3">{t('settings.members.role_label')}</th>
                    <th className="px-6 py-3">
                      <span className="flex items-center gap-1">
                        <span>{t('settings.members.inbox_seat')}</span>
                        <HelpCircle size={11} />
                      </span>
                    </th>
                    <th className="px-6 py-3">
                      <span className="flex items-center gap-1">
                        <span>{t('settings.members.billing')}</span>
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
                          {m.userId === currentUser?.id && <p className="text-[10px] text-slate-450 mt-0.5 font-bold">{t('settings.members.table.it_is_me')}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span>{m.role}</span>
                          {m.isPending && (
                            <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded text-[9px] font-black uppercase">
                              {t('settings.members.table.pending')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {m.inboxSeat && <Check size={16} className="text-slate-400" />}
                      </td>
                      <td className="px-6 py-4">
                        {m.billingPermission && <Check size={16} className="text-slate-400" />}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setEditingMemberId(m.id)}
                          className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                        >
                          {t('settings.members.table.edit')}
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
          <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm p-12 text-center flex flex-col items-center justify-center space-y-4 select-none">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
              <Users size={20} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-extrabold text-slate-800 text-sm">{t('settings.members.groups.empty_title')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('settings.members.groups.empty_desc')}
              </p>
            </div>
            <button
              onClick={() => {}}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{t('settings.members.groups.add_btn')}</span>
            </button>
          </div>
        </div>
      )}

      {isInviteOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSendInvite} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                {t('settings.members.invite_btn')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsInviteOpen(false);
                  setInviteEmail('');
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {errorMsg && (
              <div className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-650 text-xs font-bold rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('settings.members.invite.email_label')}
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('settings.members.invite.email_placeholder')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                  {t('settings.members.invite.select_role')}
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
                          setInviteInboxSeat(role !== 'Viewer');
                          setInviteBilling(role === 'Admin');
                        }}
                        className="w-4 h-4 border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-b border-slate-100">
                <span className="text-xs font-bold text-slate-750">{t('settings.members.invite.assign_inbox')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inviteInboxSeat}
                    onChange={(e) => setInviteInboxSeat(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-750">{t('settings.members.invite.grant_billing')}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inviteBilling}
                    onChange={(e) => setInviteBilling(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-[11px] text-slate-400 font-medium leading-relaxed">
                {getRoleDescription(inviteRole)}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 select-none">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-705 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                {t('settings.members.invite.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !inviteEmail.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {loading ? t('settings.members.invite.sending') : t('settings.members.invite.send_btn')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
