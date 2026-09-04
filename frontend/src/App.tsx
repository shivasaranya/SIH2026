import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GISPage } from './pages/GISPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataMethodologyPage } from './pages/DataMethodologyPage';
import { LandingScreen } from './pages/LandingScreen';
import { StateSelectionScreen } from './pages/StateSelectionScreen';
import { CitizenPage } from './pages/CitizenPage';
import type { ActiveTab } from './types';

export type PortalRole = 
  | 'landing' 
  | 'government_state_selection' 
  | 'government_ap' 
  | 'citizen';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('gis');
  const [selectedState, setSelectedState] = useState<string>('Andhra Pradesh');
  
  // Determine initial portal view from URL hash
  const getInitialPortal = (): PortalRole => {
    if (typeof window === 'undefined') return 'landing';
    const hash = window.location.hash.toLowerCase();
    if (hash === '#government/select-state' || hash === '#government/states') return 'government_state_selection';
    if (hash === '#government/ap' || hash === '#government/andhra-pradesh' || hash === '#government') return 'government_ap';
    if (hash === '#citizen' || hash.startsWith('#citizen/')) return 'citizen';
    return 'landing';
  };

  const [portalRole, setPortalRole] = useState<PortalRole>(getInitialPortal);

  // Sync state with hash change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#government/select-state' || hash === '#government/states') {
        setPortalRole('government_state_selection');
      } else if (hash === '#government/ap' || hash === '#government/andhra-pradesh' || hash === '#government') {
        setPortalRole('government_ap');
      } else if (hash === '#citizen' || hash.startsWith('#citizen/')) {
        setPortalRole('citizen');
      } else {
        setPortalRole('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // From Landing: Government -> State Selection, Citizen -> Citizen Portal
  const handleSelectRoleFromLanding = (role: 'government' | 'citizen') => {
    if (role === 'government') {
      setPortalRole('government_state_selection');
      window.location.hash = '#government/select-state';
    } else {
      setPortalRole('citizen');
      window.location.hash = '#citizen';
    }
  };

  // From State Selection: Choose state
  const handleSelectState = (stateName: string) => {
    setSelectedState(stateName);
    setPortalRole('government_ap');
    window.location.hash = '#government/ap';
  };

  const handleNavigateToStateSelection = () => {
    setPortalRole('government_state_selection');
    window.location.hash = '#government/select-state';
  };

  const handleReturnToLanding = () => {
    setPortalRole('landing');
    window.location.hash = '#access';
  };

  // If in Citizen Portal mode
  if (portalRole === 'citizen') {
    return (
      <CitizenPage
        onBackToLanding={handleReturnToLanding}
        onNavigateToGovernment={() => handleSelectRoleFromLanding('government')}
      />
    );
  }

  // If on Initial Landing / Access-Selection Screen
  if (portalRole === 'landing') {
    return <LandingScreen onSelectRole={handleSelectRoleFromLanding} />;
  }

  // If on Government State Selection Screen (India Map)
  if (portalRole === 'government_state_selection') {
    return (
      <StateSelectionScreen
        onSelectState={handleSelectState}
        onBackToLanding={handleReturnToLanding}
      />
    );
  }

  // Government Decision-Support Dashboard (Andhra Pradesh Active Implementation)
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
      <Header 
        pilotState={selectedState} 
        onBackToLanding={handleReturnToLanding}
        onNavigateToStateSelection={handleNavigateToStateSelection}
      />
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

