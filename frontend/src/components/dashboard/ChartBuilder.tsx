import { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { queryChartData, type ChartQueryRequest, type AnalysisResponse } from '../../api/analysis';
import { toast } from 'sonner';

interface ChartBuilderProps {
  datasetId: string;
  summary: AnalysisResponse;
  filters?: Record<string, any>;
}

export const ChartBuilder = ({ datasetId, summary, filters = {} }: ChartBuilderProps) => {
  const allColumns = Object.keys(summary.data_types);
  const numericColumns = Object.keys(summary.numerical_stats);
  const categoricalColumns = Object.keys(summary.categorical_stats);

  const isTechnicalColumn = (col: string) => {
    const lower = col.toLowerCase();
    return lower === 'id' || 
           lower === 'index' || 
           lower === '_id' || 
           lower === 'row_id' || 
           lower.includes('unnamed') ||
           lower.endsWith('_id');
  };

  const getDefaultX = () => {
    const validCategorical = categoricalColumns.filter(c => !isTechnicalColumn(c));
    if (validCategorical.length === 0) {
      const validAll = allColumns.filter(c => !isTechnicalColumn(c));
      return validAll.length > 0 ? validAll[0] : (allColumns[0] || '');
    }
    
    const keywords = ['channel', 'product', 'region', 'customer', 'category', 'department', 'name', 'type', 'segment', 'date', 'month', 'year'];
    for (const keyword of keywords) {
      const match = validCategorical.find(c => c.toLowerCase().includes(keyword));
      if (match) return match;
    }
    return validCategorical[0];
  };

  const getDefaultY = () => {
    const validNumeric = numericColumns.filter(c => !isTechnicalColumn(c));
    if (validNumeric.length === 0) return '';
    
    const keywords = ['revenue', 'sales', 'profit', 'quantity', 'cost', 'price', 'amount', 'total', 'value', 'margin'];
    for (const keyword of keywords) {
      const match = validNumeric.find(c => c.toLowerCase().includes(keyword));
      if (match) return match;
    }
    return validNumeric[0];
  };

  const [request, setRequest] = useState<ChartQueryRequest>({
    x_axis: getDefaultX(),
    y_axis: getDefaultY(),
    chart_type: 'bar',
    agg_func: 'sum'
  });

  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Sync request state when dataset changes (Bug 3)
  useEffect(() => {
    setRequest({
      x_axis: getDefaultX(),
      y_axis: getDefaultY(),
      chart_type: 'bar',
      agg_func: 'sum',
      sort_order: 'desc',
      limit: 10
    });
    setChartData(null);
  }, [datasetId, summary]);

  useEffect(() => {
    if (!request.x_axis) return;
    
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const payload = { ...request };
        if (Object.keys(filters).length > 0) {
          payload.filters = filters;
        }
        
        // Intelligent validation
        if (payload.chart_type === 'scatter' && !payload.y_axis) {
          setLoading(false);
          setChartData(null);
          return;
        }
        
        const response = await queryChartData(datasetId, payload);
        if (isMounted) setChartData(response);
      } catch (error) {
        console.error(error);
        toast.error('Failed to generate chart data.');
        if (isMounted) setChartData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [datasetId, request, filters]);

  const handleChange = (field: keyof ChartQueryRequest, value: any) => {
    setRequest(prev => ({ ...prev, [field]: value }));
  };

  const getPlotlyData = (): any[] => {
    if (!chartData) return [];
    
    const { chart_type, labels, values } = chartData;
    
    if (chart_type === 'pie') {
      return [{
        values: values,
        labels: labels,
        type: 'pie',
        hole: 0.4
      }];
    }
    
    if (chart_type === 'box') {
      return [{
        y: labels, // For box plot we just sent raw X data in labels
        type: 'box',
        name: chartData.x_axis_label,
        boxpoints: 'outliers'
      }];
    }
    
    if (chart_type === 'histogram') {
      return [{
        x: labels, // Raw X data
        type: 'histogram',
        name: chartData.x_axis_label
      }];
    }
    
    if (chart_type === 'scatter') {
      return [{
        x: labels,
        y: values,
        mode: 'markers',
        type: 'scatter',
        marker: { size: 8 }
      }];
    }
    
    if (chart_type === 'area') {
      return [{
        x: labels,
        y: values,
        type: 'scatter',
        fill: 'tozeroy',
        mode: 'lines',
      }];
    }

    return [{
      x: labels,
      y: values,
      type: chart_type as 'bar' | 'scatter' | 'pie', // scatter with mode lines = line
      mode: chart_type === 'line' ? 'lines+markers' : undefined,
    }];
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-10 mb-8 transition-shadow hover:shadow-md">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Interactive Chart Builder</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visualize and analyze your data across multiple dimensions.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-blue-500/20">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Chart
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chart Type</label>
          <select 
            value={request.chart_type}
            onChange={(e) => handleChange('chart_type', e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer hover:border-slate-300 appearance-none"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Donut Chart</option>
            <option value="area">Area Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="histogram">Histogram</option>
            <option value="box">Box Plot</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">X-Axis</label>
          <select 
            value={request.x_axis}
            onChange={(e) => handleChange('x_axis', e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer hover:border-slate-300 appearance-none"
          >
            {allColumns.map(col => <option key={col} value={col}>{col}</option>)}
          </select>
        </div>

        {['bar', 'line', 'pie', 'scatter'].includes(request.chart_type) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Y-Axis</label>
            <select 
              value={request.y_axis}
              onChange={(e) => handleChange('y_axis', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer hover:border-slate-300 appearance-none"
            >
              <option value="">-- None (Count) --</option>
              {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>
        )}

        {['bar', 'line', 'pie', 'area'].includes(request.chart_type) && request.y_axis && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aggregation</label>
            <select 
              value={request.agg_func}
              onChange={(e) => handleChange('agg_func', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer hover:border-slate-300 appearance-none"
            >
              <option value="sum">Sum</option>
              <option value="mean">Average</option>
              <option value="count">Count</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </select>
          </div>
        )}

        {['bar', 'line', 'pie', 'area'].includes(request.chart_type) && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sort Order</label>
              <select 
                value={request.sort_order || 'desc'}
                onChange={(e) => handleChange('sort_order', e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer hover:border-slate-300 appearance-none"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Limit Results</label>
              <select 
                value={request.limit || 10}
                onChange={(e) => handleChange('limit', parseInt(e.target.value))}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer hover:border-slate-300 appearance-none"
              >
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
                <option value="100">Top 100</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="relative w-full h-[600px] xl:h-[700px] border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] p-2">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500">Generating chart...</p>
          </div>
        ) : chartData ? (
          <Plot
            data={getPlotlyData()}
            layout={{
              autosize: true,
              margin: { t: 40, r: 40, b: 60, l: 60 },
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { color: '#64748b' }, // slate-500
              hovermode: 'closest',
              showlegend: request.chart_type === 'pie',
              xaxis: { 
                title: chartData.x_axis_label, 
                gridcolor: '#334155',
                showgrid: false, // Disables vertical gridlines completely to prevent them from intersecting bars
                tickson: 'boundaries',
                type: ['bar', 'box'].includes(chartData.chart_type) ? 'category' : undefined
              },
              yaxis: { title: chartData.y_axis_label, gridcolor: '#334155' },
              title: { 
                text: `${chartData.y_axis_label ? chartData.y_axis_label.charAt(0).toUpperCase() + chartData.y_axis_label.slice(1) : ''} by ${chartData.x_axis_label ? chartData.x_axis_label.charAt(0).toUpperCase() + chartData.x_axis_label.slice(1) : ''}`
              }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true, displayModeBar: true, displaylogo: false }}
          />
        ) : null}
      </div>
    </div>
  );
};
