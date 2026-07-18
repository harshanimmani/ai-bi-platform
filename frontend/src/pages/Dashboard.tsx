import { useState, useEffect } from 'react';
import { datasetsApi, type Dataset } from '../api/datasets';
import { getDatasetSummary, type AnalysisResponse } from '../api/analysis';
import { KPICards } from '../components/dashboard/KPICards';
import { ChartBuilder } from '../components/dashboard/ChartBuilder';
import { DatasetPreview } from '../components/dashboard/DatasetPreview';
import { DashboardFilters } from '../components/dashboard/DashboardFilters';
import { BarChart3, Database } from 'lucide-react';
import { toast } from 'sonner';

export const DashboardPage = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [baseSummary, setBaseSummary] = useState<AnalysisResponse | null>(null);
  const [summary, setSummary] = useState<AnalysisResponse | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch all datasets on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await datasetsApi.getDatasets();
        setDatasets(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load datasets.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch base summary when selected dataset changes
  useEffect(() => {
    if (!selectedId) {
      setBaseSummary(null);
      setFilters({});
      return;
    }
    
    let isMounted = true;
    const fetchBaseSummary = async () => {
      try {
        const data = await getDatasetSummary(selectedId);
        if (isMounted) {
          setBaseSummary(data);
          setFilters({}); // Reset filters on new dataset
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load base dataset summary.');
      }
    };
    
    fetchBaseSummary();
    return () => { isMounted = false; };
  }, [selectedId]);

  // Fetch filtered summary whenever filters or selectedId changes
  useEffect(() => {
    if (!selectedId) {
      setSummary(null);
      return;
    }
    
    let isMounted = true;
    setSummaryLoading(true);
    const fetchFilteredSummary = async () => {
      try {
        const data = await getDatasetSummary(selectedId, filters);
        if (isMounted) setSummary(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load filtered dataset summary.');
      } finally {
        if (isMounted) setSummaryLoading(false);
      }
    };
    
    fetchFilteredSummary();
    return () => { isMounted = false; };
  }, [selectedId, filters]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center text-center px-4">
        <Database className="h-16 w-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No Datasets Found</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          You need to upload a dataset before you can use the analysis dashboard. Head over to the Datasets tab to upload your first CSV or Excel file.
        </p>
      </div>
    );
  }

  const selectedDataset = datasets.find(d => d.id === selectedId);

  return (
    <div className="w-full max-w-[95%] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Interactive visualization and analysis for your datasets. Select a dataset below to begin exploring.
          </p>
        </div>
        
        <div className="w-full sm:w-80">
          <label htmlFor="dataset-select" className="sr-only">Select Dataset</label>
          <div className="relative">
            <Database className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 pointer-events-none" />
            <select
              id="dataset-select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="block w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-10 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 transition-shadow shadow-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 appearance-none"
            >
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.filename}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {baseSummary && (
        <DashboardFilters 
          baseSummary={baseSummary} 
          filters={filters} 
          setFilters={setFilters} 
        />
      )}

      {summary && selectedDataset ? (
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out space-y-8 ${summaryLoading ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
          <KPICards summary={summary} fileSize={selectedDataset.file_size} />
          <ChartBuilder datasetId={selectedId} summary={summary} filters={filters} />
          <DatasetPreview datasetId={selectedId} filters={filters} />
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};
