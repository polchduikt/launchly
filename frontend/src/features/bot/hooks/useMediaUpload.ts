import { useMutation } from '@tanstack/react-query';
import apiClient from '../../../lib/axios';

interface UploadResult {
  url: string;
  publicId: string;
}

const uploadMedia = async (file: File, folder: string): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await apiClient.post<UploadResult>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const useMediaUpload = (folder: string = 'general') => {
  return useMutation({
    mutationFn: (file: File) => uploadMedia(file, folder),
  });
};
