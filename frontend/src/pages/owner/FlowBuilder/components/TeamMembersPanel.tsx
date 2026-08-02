import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Check, Users, Plus } from 'lucide-react';
import { useBotStore } from '../../../../store/useBotStore';
import { useBotsQuery } from '../../../../hooks/bot/useBotsQuery';
import { useAuthStore } from '../../../../store/useAuthStore';
import { t } from '../../../../i18n/config';
import {
  getTeamMembersApi,
  inviteMemberApi,
  cancelInvitationApi,
  updateMemberApi,
  removeMemberApi
} from '../../../../api/teamApi';
import type { TeamMemberResponse } from '../../../../api/teamApi';
import { isValidAvatarUrl, getInitials } from '../../../../utils/avatar';

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
  const botName = bots.find((b) => b.id === activeBotId)?.name || 'Launchly Official';
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
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErrorMsg(message || 'Failed to send invitation');
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

  const renderMemberAvatar = (m: TeamMemberResponse, sizeClass = 'w-8 h-8') => {
    const avatarUrl = m.userId === currentUser?.id && currentUser?.avatar ? currentUser.avatar : m.avatar;
    const name = getMemberName(m);
    if (isValidAvatarUrl(avatarUrl)) {
      return (
        <img
          src={avatarUrl!}
          alt={name}
          className={`${sizeClass} rounded-full object-cover border-2 border-[#0A0A0A] shrink-0`}
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-[#0A0A0A] text-[#F2EBDD] font-black flex items-center justify-center text-xs shrink-0 select-none border-2 border-[#0A0A0A]`}>
        {getInitials(name)}
      </div>
    );
  };

  const editingMember = members.find(m => m.id === editingMemberId);

  if (editingMemberId && editingMember) {
    const isMe = editingMember.userId === currentUser?.id;
    const isOwner = editingMember.role === 'Owner';

    return (
      <div className="space-y-6 text-left font-['JetBrains_Mono',monospace]">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 select-none">
          <button
            onClick={() => setEditingMemberId(null)}
            className="hover:text-[#0A0A0A] transition-colors cursor-pointer uppercase"
          >
            {t('settings.members.breadcrumb')}
          </button>
          <span>&gt;</span>
          <span className="text-[#0A0A0A] uppercase">{getMemberName(editingMember)}</span>
        </div>

        <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl divide-y-2 divide-[#0A0A0A]/15 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-center">
            <div className="lg:col-span-3">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.name')}</span>
            </div>
            <div className="lg:col-span-9 flex items-center gap-3">
              {renderMemberAvatar(editingMember)}
              <span className="text-xs font-bold text-[#0A0A0A]">{getMemberName(editingMember)}</span>
              {editingMember.isPending && (
                <span className="px-2 py-0.5 bg-amber-200 border-2 border-[#0A0A0A] text-[#0A0A0A] rounded-md font-black text-[10px] uppercase">
                  {t('settings.members.pending_invite')}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.role_label')}</span>
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
                className="w-full px-3 py-2 rounded-xl border-2 border-[#0A0A0A] focus:outline-none text-xs font-bold bg-white text-[#0A0A0A] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="Owner" disabled>Owner</option>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Inbox Agent">Inbox Agent</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
            <div className="lg:col-span-4">
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                {getRoleDescription(editingMember.role)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.seat_type')}</span>
            </div>
            <div className="lg:col-span-5 flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
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
                  className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#0A0A0A] select-none">{t('settings.members.inbox_seat')}</span>
              </label>
            </div>
            <div className="lg:col-span-4">
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                {t('settings.members.inbox_seat_desc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.billing')}</span>
            </div>
            <div className="lg:col-span-5 flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
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
                  className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                />
                <span className="text-xs font-bold text-[#0A0A0A] select-none">{t('settings.members.has_permissions')}</span>
              </label>
            </div>
            <div className="lg:col-span-4">
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                {t('settings.members.billing_desc')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
            <div className="lg:col-span-3 pt-1">
              <span className="font-['Anybody',sans-serif] text-xs font-black text-[#0A0A0A] uppercase">{t('settings.members.remove')}</span>
            </div>
            <div className="lg:col-span-5">
              <button
                type="button"
                onClick={() => handleRemoveMemberOrInvite(editingMember)}
                disabled={isOwner || (isMe && editingMember.role === 'Owner')}
                className="w-full py-2 bg-rose-200 hover:bg-rose-300 border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-black uppercase rounded-xl select-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingMember.isPending ? t('settings.members.btn.cancel_inv') : isMe ? t('settings.members.btn.leave_ws') : t('settings.members.btn.remove_mem')}
              </button>
            </div>
            <div className="lg:col-span-4">
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
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
    <div className="space-y-6 font-['JetBrains_Mono',monospace]">
      <div className="flex border-b-2 border-[#0A0A0A]">
        <button
          onClick={() => setActiveSubTab('members')}
          className={`px-4 py-2 text-xs font-black uppercase cursor-pointer transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'members'
              ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#F2EBDD]'
              : 'border-transparent text-[#0A0A0A] hover:bg-white'
          }`}
        >
          {t('settings.members.breadcrumb')}
        </button>
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`px-4 py-2 text-xs font-black uppercase cursor-pointer transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'groups'
              ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#F2EBDD]'
              : 'border-transparent text-[#0A0A0A] hover:bg-white'
          }`}
        >
          {t('settings.members.groups')}
        </button>
      </div>

      {activeSubTab === 'members' ? (
        <div className="space-y-6 text-left animate-in fade-in duration-150">
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b-2 border-[#0A0A0A]">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">
                {t('settings.members.title', { name: botName })}
              </h3>
              <button
                onClick={() => {
                  setErrorMsg('');
                  setIsInviteOpen(true);
                }}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>{t('settings.members.invite_btn')}</span>
              </button>
            </div>

            <div className="overflow-x-auto p-4">
              <div className="border-2 border-[#0A0A0A] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#0A0A0A] bg-[#F2EBDD] text-xs font-black text-[#0A0A0A] uppercase tracking-wider select-none">
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
                  <tbody className="divide-y-2 divide-[#0A0A0A]/15 text-xs font-bold text-[#0A0A0A] bg-white">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-[#F2EBDD]/50 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                          {renderMemberAvatar(m)}
                          <div>
                            <p className="font-bold text-[#0A0A0A]">{getMemberName(m)}</p>
                            {m.userId === currentUser?.id && <p className="text-[10px] text-slate-700 uppercase font-bold">{t('settings.members.table.it_is_me')}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span>{m.role}</span>
                            {m.isPending && (
                              <span className="px-1.5 py-0.5 bg-amber-200 border-2 border-[#0A0A0A] text-[#0A0A0A] rounded text-[9px] font-black uppercase">
                                {t('settings.members.table.pending')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {m.inboxSeat && <Check size={16} className="text-[#0A0A0A]" />}
                        </td>
                        <td className="px-6 py-4">
                          {m.billingPermission && <Check size={16} className="text-[#0A0A0A]" />}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditingMemberId(m.id)}
                            className="text-[#0A0A0A] hover:underline font-black uppercase cursor-pointer"
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
        </div>
      ) : (
        <div className="space-y-6 text-left animate-in fade-in duration-150">
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 select-none">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#0A0A0A] border-2 border-[#0A0A0A]">
              <Users size={20} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-sm uppercase">{t('settings.members.groups.empty_title')}</h3>
              <p className="text-xs text-slate-700 font-bold leading-relaxed">
                {t('settings.members.groups.empty_desc')}
              </p>
            </div>
            <button
              onClick={() => {}}
              className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>{t('settings.members.groups.add_btn')}</span>
            </button>
          </div>
        </div>
      )}

      {isInviteOpen && (
        <div 
          onClick={() => {
            setIsInviteOpen(false);
            setInviteEmail('');
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <form 
            onSubmit={handleSendInvite}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[8px_8px_0px_0px_#0A0A0A] w-full max-w-md flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wide">
                {t('settings.members.invite_btn')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsInviteOpen(false);
                  setInviteEmail('');
                }}
                className="p-1 hover:bg-white rounded-lg text-[#0A0A0A] transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
              >
                <X size={16} />
              </button>
            </div>

            {errorMsg && (
              <div className="px-4 py-2.5 bg-rose-200 border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-bold rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
                  {t('settings.members.invite.email_label')}
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('settings.members.invite.email_placeholder')}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-2.5">
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
                        className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[#0A0A0A]">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t-2 border-b-2 border-[#0A0A0A]/15">
                <span className="text-xs font-bold text-[#0A0A0A]">{t('settings.members.invite.assign_inbox')}</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inviteInboxSeat}
                    onChange={(e) => setInviteInboxSeat(e.target.checked)}
                    className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A]/15">
                <span className="text-xs font-bold text-[#0A0A0A]">{t('settings.members.invite.grant_billing')}</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inviteBilling}
                    onChange={(e) => setInviteBilling(e.target.checked)}
                    className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                  />
                </label>
              </div>

              <div className="bg-white border-2 border-[#0A0A0A] p-4 rounded-2xl text-xs text-slate-700 font-bold leading-relaxed">
                {getRoleDescription(inviteRole)}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t-2 border-[#0A0A0A]/15 select-none">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.members.invite.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !inviteEmail.trim()}
                className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-55 text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
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
