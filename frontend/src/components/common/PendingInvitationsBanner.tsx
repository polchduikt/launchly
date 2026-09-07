import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Check, X, Loader2 } from 'lucide-react';
import { getMyPendingInvitationsApi, acceptInvitationApi, declineInvitationApi } from '../../api/teamApi';
import { useBotStore } from '../../store/useBotStore';
import { t } from '../../i18n/config';

export const PendingInvitationsBanner: React.FC = () => {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const { data: invitations = [] } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: getMyPendingInvitationsApi,
    refetchInterval: 5000,
  });

  const acceptMutation = useMutation({
    mutationFn: ({ invitationId }: { invitationId: number; botId?: number }) => acceptInvitationApi(invitationId),
    onSuccess: (_, variables) => {
      if (variables.botId) {
        useBotStore.getState().setActiveBotId(variables.botId);
      }
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setProcessingId(null);
      window.location.reload();
    },
    onError: () => {
      setProcessingId(null);
    },
  });

  const declineMutation = useMutation({
    mutationFn: (invitationId: number) => declineInvitationApi(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      setProcessingId(null);
    },
    onError: () => {
      setProcessingId(null);
    },
  });

  if (!invitations || invitations.length === 0) return null;

  return (
    <div className="bg-amber-300 border-b-4 border-[#0A0A0A] p-4 text-[#0A0A0A] font-['JetBrains_Mono',monospace] relative z-40 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {invitations.map((invite) => {
          const isProcessing = processingId === invite.id;
          return (
            <div key={invite.id} className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-2xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                  <Users size={20} className="text-[#0A0A0A]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-tight text-[#0A0A0A]">
                    {t('invitations.banner.title', 'Запрошення до команди')}
                  </h4>
                  <p className="text-[11.5px] font-bold text-slate-800 leading-snug">
                    {t('invitations.banner.user_invited', 'Користувач')}{' '}
                    <strong className="text-[#0A0A0A] underline">{invite.name || invite.email || 'Користувач'}</strong>{' '}
                    {t('invitations.banner.invited_you', 'запросив вас приєднатися до команди у ролі')}{' '}
                    <span className="bg-white px-1.5 py-0.5 rounded border border-[#0A0A0A] font-extrabold text-xs">
                      {invite.role}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setProcessingId(invite.id);
                    acceptMutation.mutate({ invitationId: invite.id, botId: invite.botId });
                  }}
                  className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  <span>{t('common.accept', 'Прийняти')}</span>
                </button>

                <button
                  disabled={isProcessing}
                  onClick={() => {
                    setProcessingId(invite.id);
                    declineMutation.mutate(invite.id);
                  }}
                  className="px-4 py-2 bg-white hover:bg-rose-100 text-rose-700 border-2 border-[#0A0A0A] text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  <X size={14} />
                  <span>{t('common.decline', 'Відхилити')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
