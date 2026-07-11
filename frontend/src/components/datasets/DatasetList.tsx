import { Database, Trash2, Calendar, FileType, BarChart } from 'lucide-react';
import type { Dataset } from '../../api/datasets';
import { formatDistanceToNow } from 'date-fns';

interface DatasetListProps {
  datasets: Dataset[];
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export const DatasetList = ({ datasets, onDelete, isLoading }: DatasetListProps) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-8 flex justify-center shadow-sm">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
        <Database className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No datasets found</h3>
        <p className="text-slate-500 mt-1">Upload your first dataset to get started with analysis.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Your Datasets</h3>
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {datasets.map((dataset) => (
          <li key={dataset.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <FileType className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {dataset.filename}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center">
                      <Calendar className="mr-1.5 h-4 w-4" />
                      {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                    </div>
                    <div className="flex items-center">
                      <Database className="mr-1.5 h-4 w-4" />
                      {(dataset.file_size / 1024).toFixed(1)} KB
                    </div>
                    <div className="flex items-center">
                      <BarChart className="mr-1.5 h-4 w-4" />
                      {dataset.row_count} rows, {dataset.col_count} cols
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <button
                  onClick={() => onDelete(dataset.id)}
                  className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Delete Dataset"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
