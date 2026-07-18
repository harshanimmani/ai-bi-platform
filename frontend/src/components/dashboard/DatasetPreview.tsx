import { useEffect, useState } from 'react';
import { getDatasetPreview, type DatasetPreviewResponse } from '../../api/analysis';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';

interface DatasetPreviewProps {
  datasetId: string;
}

export const DatasetPreview = ({ datasetId }: DatasetPreviewProps) => {
  const [data, setData] = useState<DatasetPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync state when dataset changes (Bug 3)
  useEffect(() => {
    setPage(1);
    setSearch('');
    setDebouncedSearch('');
    setData(null);
  }, [datasetId]);

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const response = await getDatasetPreview(datasetId, page, 20, debouncedSearch);
        if (isMounted) setData(response);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load dataset preview.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPreview();
    return () => { isMounted = false; };
  }, [datasetId, page, debouncedSearch]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[600px] xl:h-[700px] transition-shadow hover:shadow-md">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dataset Preview</h3>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700/50 rounded-full leading-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm transition-all shadow-sm"
            placeholder="Search rows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading && !data ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data?.rows.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
            No rows found.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
              <tr>
                {(() => {
                  const seen = new Set<string>();
                  const uniqueCols: string[] = [];
                  data?.columns.forEach(col => {
                    const normalized = col.toLowerCase().trim();
                    if (!seen.has(normalized)) {
                      seen.add(normalized);
                      uniqueCols.push(col);
                    }
                  });
                  return uniqueCols.map((col, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ));
                })()}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-100 dark:divide-slate-800/50">
              {data?.rows.map((row, rowIdx) => {
                const seen = new Set<string>();
                const uniqueCols: string[] = [];
                data.columns.forEach(col => {
                  const normalized = col.toLowerCase().trim();
                  if (!seen.has(normalized)) {
                    seen.add(normalized);
                    uniqueCols.push(col);
                  }
                });
                return (
                  <tr key={rowIdx} className="hover:bg-blue-50 dark:hover:bg-slate-800/50 even:bg-slate-50/50 dark:even:bg-slate-900/30 transition-colors">
                    {uniqueCols.map((col, colIdx) => {
                      const val = row[col];
                      return (
                        <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                          {val === null ? <span className="text-slate-400 italic font-light">null</span> : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-b-2xl">
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{(page - 1) * 20 + 1}</span> to{' '}
          <span className="font-medium">
            {data ? Math.min(page * 20, data.total_rows) : 0}
          </span>{' '}
          of <span className="font-medium">{data?.total_rows || 0}</span> results
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data || page * 20 >= data.total_rows || loading}
            className="p-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
