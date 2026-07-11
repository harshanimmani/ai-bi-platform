
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DatasetsPage } from './pages/Datasets';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<div className="p-8 text-slate-900 dark:text-slate-100">Welcome to the AI Business Intelligence Platform. Select Datasets to begin.</div>} />
          <Route path="datasets" element={<DatasetsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
