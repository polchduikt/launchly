import apiClient from '../../../lib/axios';

export interface TeamMemberResponse {
  id: number;
  userId: number | null;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  inboxSeat: boolean;
  billingPermission: boolean;
  isPending: boolean;
  createdAt: string;
}

export interface InviteMemberRequest {
  email: string;
  role: string;
  inboxSeat: boolean;
  billingPermission: boolean;
}

export interface UpdateMemberRequest {
  role: string;
  inboxSeat: boolean;
  billingPermission: boolean;
}

export const getTeamMembersApi = async (botId: number): Promise<TeamMemberResponse[]> => {
  const response = await apiClient.get<TeamMemberResponse[]>(`/bots/${botId}/members`);
  return response.data;
};

export const inviteMemberApi = async (botId: number, data: InviteMemberRequest): Promise<TeamMemberResponse> => {
  const response = await apiClient.post<TeamMemberResponse>(`/bots/${botId}/invitations`, data);
  return response.data;
};

export const cancelInvitationApi = async (botId: number, invitationId: number): Promise<void> => {
  await apiClient.delete(`/bots/${botId}/invitations/${invitationId}`);
};

export const updateMemberApi = async (botId: number, userId: number, data: UpdateMemberRequest): Promise<TeamMemberResponse> => {
  const response = await apiClient.put<TeamMemberResponse>(`/bots/${botId}/members/${userId}`, data);
  return response.data;
};

export const removeMemberApi = async (botId: number, userId: number): Promise<void> => {
  await apiClient.delete(`/bots/${botId}/members/${userId}`);
};

export const getMyPendingInvitationsApi = async (): Promise<TeamMemberResponse[]> => {
  const response = await apiClient.get<TeamMemberResponse[]>('/bots/invitations/pending');
  return response.data;
};

export const acceptInvitationApi = async (invitationId: number): Promise<void> => {
  await apiClient.post(`/bots/invitations/${invitationId}/accept`);
};

export const declineInvitationApi = async (invitationId: number): Promise<void> => {
  await apiClient.post(`/bots/invitations/${invitationId}/decline`);
};
