import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GISPage } from './pages/GISPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataMethodologyPage } from './pages/DataMethodologyPage';
import type { ActiveTab } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('gis');

  const renderContent = () => {
    switch (activeTab) {
      case 'gis':
        return <GISPage key="gis" initialMetric="topsis_score" />;
      case 'hazard':
        return <GISPage key="hazard" initialMetric="hazard_exposure" />;
      case 'vulnerability':
        return <GISPage key="vulnerability" initialMetric="demographic_sensitivity" />;
      case 'capacity':
        return <GISPage key="capacity" initialMetric="shelter_capacity" />;
      case 'relocation':
        return <GISPage key="relocation" initialMetric="topsis_score" />;
      case 'hosts':
        return <GISPage key="hosts" initialMetric="safe_area_fraction" />;
      case 'simulation':
        return <GISPage key="simulation" initialMetric="scenario_topsis_score" initialOpenSimulation={true} />;
      case 'actions':
        return <GISPage key="actions" initialMetric="topsis_score" />;
      case 'dashboard':
        return (
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              <DashboardPage onNavigateToGIS={() => setActiveTab('gis')} />
            </div>
          </div>
        );
      case 'data':
      case 'methodology':
        return (
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto">
              <DataMethodologyPage onLaunchGIS={() => setActiveTab('gis')} />
            </div>
          </div>
        );
      default:
        return <GISPage key="gis" initialMetric="topsis_score" />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 flex flex-col font-sans select-none">
      <Header pilotState="Andhra Pradesh" />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950/60">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
