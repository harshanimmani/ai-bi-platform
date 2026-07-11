import { apiClient } from './client';

export interface ColumnMetadata {
  name: string;
  type: string;
}

export interface Dataset {
  id: string;
  filename: string;
  file_size: number;
  row_count: number;
  col_count: number;
  columns_metadata: ColumnMetadata[];
  created_at: string;
}

export const datasetsApi = {
  getDatasets: async (): Promise<Dataset[]> => {
    const response = await apiClient.get<Dataset[]>('/datasets/');
    return response.data;
  },

  getDataset: async (id: string): Promise<Dataset> => {
    const response = await apiClient.get<Dataset>(`/datasets/${id}`);
    return response.data;
  },

  uploadDataset: async (
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<Dataset> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<Dataset>('/datasets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  deleteDataset: async (id: string): Promise<void> => {
    await apiClient.delete(`/datasets/${id}`);
  },
};
