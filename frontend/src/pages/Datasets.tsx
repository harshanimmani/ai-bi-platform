import { useEffect, useState } from 'react';
import { DatasetUpload } from '../components/datasets/DatasetUpload';
import { DatasetList } from '../components/datasets/DatasetList';
import { datasetsApi } from '../api/datasets';
import type { Dataset } from '../api/datasets';
import { toast } from 'sonner';

export const DatasetsPage = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDatasets = async () => {
    try {
      setIsLoading(true);
      const data = await datasetsApi.getDatasets();
      setDatasets(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load datasets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this dataset?')) return;
    
    try {
      await datasetsApi.deleteDataset(id);
      toast.success('Dataset deleted successfully');
      setDatasets(datasets.filter(d => d.id !== id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete dataset.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Hub</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Upload and manage your business datasets for AI analysis.
        </p>
      </div>

      <DatasetUpload onUploadSuccess={fetchDatasets} existingDatasets={datasets} />
      
      <DatasetList 
        datasets={datasets} 
        onDelete={handleDelete} 
        isLoading={isLoading} 
      />
    </div>
  );
};
