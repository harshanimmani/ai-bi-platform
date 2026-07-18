import { apiClient } from './client';

export interface MissingValuesSummary {
  count: number;
  percentage: number;
}

export interface NumericalStats {
  count: number;
  mean: number | null;
  std: number | null;
  min: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  max: number | null;
}

export interface CategoricalStats {
  unique_count: number;
  top_values: Record<string, number>;
}

export interface AnalysisResponse {
  dataset_id: string;
  row_count: number;
  col_count: number;
  data_types: Record<string, string>;
  missing_values: Record<string, MissingValuesSummary>;
  duplicate_rows: number;
  numerical_stats: Record<string, NumericalStats>;
  categorical_stats: Record<string, CategoricalStats>;
  correlation_matrix: Record<string, Record<string, number | null>>;
}

export interface DatasetPreviewResponse {
  columns: string[];
  rows: Record<string, any>[];
  total_rows: number;
  page: number;
  limit: number;
}

export interface ChartQueryRequest {
  x_axis: string;
  y_axis?: string;
  chart_type: string;
  agg_func?: string;
  group_by?: string;
}

export interface ChartQueryResponse {
  labels: any[];
  values: any[];
  chart_type: string;
  x_axis_label: string;
  y_axis_label: string;
}

export const getDatasetSummary = async (datasetId: string): Promise<AnalysisResponse> => {
  const response = await apiClient.get<AnalysisResponse>(`/analysis/${datasetId}/summary`);
  return response.data;
};

export const getDatasetPreview = async (
  datasetId: string,
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<DatasetPreviewResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) params.append('search', search);

  const response = await apiClient.get<DatasetPreviewResponse>(`/analysis/${datasetId}/preview?${params.toString()}`);
  return response.data;
};

export const queryChartData = async (
  datasetId: string,
  request: ChartQueryRequest
): Promise<ChartQueryResponse> => {
  const response = await apiClient.post<ChartQueryResponse>(`/analysis/${datasetId}/query`, request);
  return response.data;
};
