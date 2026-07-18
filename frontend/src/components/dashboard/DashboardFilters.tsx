import { Filter, X } from 'lucide-react';
import type { AnalysisResponse } from '../../api/analysis';
import { downloadFilteredDataset } from '../../api/analysis';

interface DashboardFiltersProps {
  baseSummary: AnalysisResponse;
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
}

export const DashboardFilters = ({ baseSummary, filters, setFilters }: DashboardFiltersProps) => {
  // Find top categorical columns suitable for filtering (e.g., less than 50 unique values)
  const filterableCols = Object.entries(baseSummary.categorical_stats)
    .filter(([_, stats]) => stats.unique_count <= 50 && stats.unique_count > 1)
    .sort((a, b) => a[1].unique_count - b[1].unique_count)
    .slice(0, 5); // Take top 5 to avoid clutter

  if (filterableCols.length === 0) {
    return null;
  }

  const handleFilterChange = (col: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters[col];
    } else {
      newFilters[col] = value;
    }
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-8 transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-blue-500" />
          Dashboard Filters
        </h3>
        <div className="flex gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </button>
          )}
          <button
            onClick={() => downloadFilteredDataset(baseSummary.dataset_id, filters)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500/20"
          >
            Export Filtered CSV
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filterableCols.map(([col, stats]) => (
          <div key={col}>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              {col}
            </label>
            <select
              value={filters[col] || ''}
              onChange={(e) => handleFilterChange(col, e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer hover:border-slate-300 appearance-none"
            >
              <option value="">All {col}s</option>
              {Object.keys(stats.top_values).map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
