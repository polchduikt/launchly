import { useCallback } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Edge } from '@xyflow/react';
import type { AudienceCondition, CampaignResponse, UpdateCampaignRequest } from '../../types';
import type { CustomNode } from '../../types/broadcast';
import { ROUTES } from '../../routes/paths';
import { resolveFilter } from './useBroadcastAudience';

interface UseBroadcastSchedulerParams {
  campaign?: CampaignResponse;
  campaignId: number;
  campaignName: string;
  conditions: AudienceCondition[];
  nodes: CustomNode[];
  edges: Edge[];
  messageText: string;
  updateCampaignMut: UseMutationResult<CampaignResponse, Error, { campaignId: number; req: UpdateCampaignRequest }>;
  sendCampaignMut: UseMutationResult<CampaignResponse, Error, number | { botId: number; campaignId: number }>;
  setIsDirty: (dirty: boolean) => void;
  navigate: (path: string) => void;
}

export const useBroadcastScheduler = ({
  campaign,
  campaignId,
  campaignName,
  conditions,
  nodes,
  edges,
  messageText,
  updateCampaignMut,
  sendCampaignMut,
  setIsDirty,
  navigate,
}: UseBroadcastSchedulerParams) => {
  const getPayload = useCallback(() => {
    const { filterType, filterValue } = resolveFilter(conditions);
    const mainMsgNode = nodes.find((n) => n.type === 'MESSAGE');
    const finalMessage = (mainMsgNode?.data?.text as string) || messageText || 'Hello!';

    return {
      name: campaignName,
      message: finalMessage,
      filterType,
      filterValue,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
    };
  }, [conditions, nodes, messageText, campaignName, edges]);

  const handleSaveDraft = useCallback(() => {
    if (!campaign) return;

    updateCampaignMut.mutate(
      {
        campaignId,
        req: getPayload(),
      },
      {
        onSuccess: () => {
          setIsDirty(false);
        },
      }
    );
  }, [campaign, campaignId, getPayload, updateCampaignMut, setIsDirty]);

  const handleSendCampaign = useCallback(async () => {
    if (!campaign) return;

    try {
      await updateCampaignMut.mutateAsync({
        campaignId,
        req: getPayload(),
      });
      setIsDirty(false);

      sendCampaignMut.mutate(campaignId, {
        onSuccess: () => {
          navigate(ROUTES.BROADCASTS);
        },
      });
    } catch (err) {
      console.error('Failed to save campaign before sending:', err);
    }
  }, [campaign, campaignId, getPayload, updateCampaignMut, sendCampaignMut, setIsDirty, navigate]);

  const handleScheduleCampaign = useCallback(
    async (dateTimeIso: string) => {
      if (!campaign) return;
      try {
        await updateCampaignMut.mutateAsync({
          campaignId,
          req: {
            ...getPayload(),
            scheduledAt: dateTimeIso,
          },
        });
        setIsDirty(false);
        navigate(ROUTES.BROADCASTS);
      } catch (err) {
        console.error('Failed to schedule campaign:', err);
      }
    },
    [campaign, campaignId, getPayload, updateCampaignMut, setIsDirty, navigate]
  );

  return {
    handleSaveDraft,
    handleSendCampaign,
    handleScheduleCampaign,
  };
};
