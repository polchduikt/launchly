import apiClient from '../../../lib/axios';
import type { IntegrationResponse, IntegrationCreateRequest } from '../types';

export const getIntegrationsApi = async (): Promise<IntegrationResponse[]> => {
  const response = await apiClient.get<IntegrationResponse[]>('/integrations');
  return response.data;
};

export const createIntegrationApi = async (
  request: IntegrationCreateRequest
): Promise<IntegrationResponse> => {
  const response = await apiClient.post<IntegrationResponse>('/integrations', request);
  return response.data;
};

export const updateIntegrationApi = async (
  id: number,
  request: IntegrationCreateRequest
): Promise<IntegrationResponse> => {
  const response = await apiClient.put<IntegrationResponse>(`/integrations/${id}`, request);
  return response.data;
};

export const deleteIntegrationApi = async (id: number): Promise<void> => {
  await apiClient.delete(`/integrations/${id}`);
};

export const toggleIntegrationApi = async (id: number): Promise<IntegrationResponse> => {
  const response = await apiClient.post<IntegrationResponse>(`/integrations/${id}/toggle`);
  return response.data;
};

export const exportExcelApi = async (
  botId: number,
  dataType: 'LEADS' | 'ORDERS'
): Promise<Blob> => {
  const response = await apiClient.get<Blob>('/integrations/export/excel', {
    params: { botId, dataType },
    responseType: 'blob',
  });
  return response.data;
};
