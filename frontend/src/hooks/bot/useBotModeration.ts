import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBotModerationSettingsApi,
  updateBotModerationSettingsApi,
  testBotModerationApi,
  type BotModerationRuleDto,
  type UpdateBotModerationRuleRequest,
  type TestModerationRequest,
  type TestModerationResponse,
} from '../../api/bot';
import { queryKeys } from '../../api/queryKeys';

export const useBotModerationQuery = (botId?: number) => {
  return useQuery<BotModerationRuleDto>({
    queryKey: botId ? queryKeys.bots.moderation(botId) : ['bot_moderation', 0],
    queryFn: () => getBotModerationSettingsApi(botId!),
    enabled: !!botId && botId > 0,
  });
};

export const useUpdateBotModerationMutation = (botId?: number) => {
  const queryClient = useQueryClient();

  return useMutation<BotModerationRuleDto, Error, UpdateBotModerationRuleRequest>({
    mutationFn: (data: UpdateBotModerationRuleRequest) => updateBotModerationSettingsApi(botId!, data),
    onSuccess: (updated) => {
      if (botId) {
        queryClient.setQueryData(queryKeys.bots.moderation(botId), updated);
      }
    },
  });
};

export const useTestBotModerationMutation = (botId?: number) => {
  return useMutation<TestModerationResponse, Error, TestModerationRequest>({
    mutationFn: (data: TestModerationRequest) => testBotModerationApi(botId!, data),
  });
};
