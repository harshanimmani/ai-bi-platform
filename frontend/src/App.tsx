
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<div className="p-8">Welcome to the AI Business Intelligence Platform.</div>} />
          {/* We will add more routes here in future modules */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
