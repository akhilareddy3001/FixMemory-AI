import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import ServicesPage from './pages/ServicesPage';
import EngineersPage from './pages/EngineersPage';
import RunbooksPage from './pages/RunbooksPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AgentPage from './pages/AgentPage';
import MemoryPage from './pages/MemoryPage';
import BeforeAfterPage from './pages/BeforeAfterPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="create-incident" element={<CreateIncidentPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="engineers" element={<EngineersPage />} />
          <Route path="runbooks" element={<RunbooksPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          
          {/* FixMemory Hindsight AI Features */}
          <Route path="agent" element={<AgentPage />} />
          <Route path="memory" element={<MemoryPage />} />
          <Route path="before-after-memory" element={<BeforeAfterPage />} />
          <Route path="settings" element={<SettingsPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
