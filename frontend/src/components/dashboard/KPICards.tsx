import type { AnalysisResponse } from '../../api/analysis';
import { Database, FileDigit, AlertTriangle, Copy, Hash, Type, HardDrive } from 'lucide-react';

interface KPICardsProps {
  summary: AnalysisResponse;
  fileSize: number; // passed from dataset model
}

export const KPICards = ({ summary, fileSize }: KPICardsProps) => {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const totalMissing = Object.values(summary.missing_values).reduce((acc, curr) => acc + curr.count, 0);

  const kpis = [
    { label: 'Total Rows', value: summary.row_count.toLocaleString(), icon: Database, color: 'text-blue-500' },
    { label: 'Total Columns', value: summary.col_count.toLocaleString(), icon: FileDigit, color: 'text-indigo-500' },
    { label: 'Missing Values', value: totalMissing.toLocaleString(), icon: AlertTriangle, color: 'text-amber-500', tooltip: 'Total missing cell count across the entire dataset (not just rows)' },
    { label: 'Duplicate Rows', value: summary.duplicate_rows.toLocaleString(), icon: Copy, color: 'text-rose-500' },
    { label: 'Numerical Cols', value: Object.keys(summary.numerical_stats).length.toString(), icon: Hash, color: 'text-emerald-500' },
    { label: 'Categorical Cols', value: Object.keys(summary.categorical_stats).length.toString(), icon: Type, color: 'text-violet-500' },
    { label: 'Dataset Size', value: formatBytes(fileSize), icon: HardDrive, color: 'text-cyan-500' },
  ];

  return (
    <div className="flex flex-wrap justify-start gap-4 xl:gap-6">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div key={idx} className="flex-1 min-w-[200px] xl:min-w-[240px] group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex items-center space-x-4">
            <div className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-800 ${kpi.color} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center mb-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
                {kpi.tooltip && (
                  <div className="ml-1.5 relative group/tooltip cursor-help">
                    <svg className="w-4 h-4 text-slate-400 hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-xs text-white p-2 rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10 text-center pointer-events-none">
                      {kpi.tooltip}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                )}
              </div>
              <h4 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{kpi.value}</h4>
            </div>
          </div>
        );
      })}
    </div>
  );
};
