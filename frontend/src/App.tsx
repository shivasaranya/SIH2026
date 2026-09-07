import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GISPage } from './pages/GISPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataMethodologyPage } from './pages/DataMethodologyPage';
import { RelocationPlanningPage } from './pages/RelocationPlanningPage';
import { HazardRiskPage } from './pages/HazardRiskPage';
import { CommunityVulnerabilityPage } from './pages/CommunityVulnerabilityPage';
import { EmergencyCapacityPage } from './pages/EmergencyCapacityPage';
import { CandidateLocationsPage } from './pages/CandidateLocationsPage';
import { SimulationPage } from './pages/SimulationPage';
import { ActionPlanPage } from './pages/ActionPlanPage';
import { PriorityDirectoryPage } from './pages/PriorityDirectoryPage';
import { LandingScreen } from './pages/LandingScreen';
import { StateSelectionScreen } from './pages/StateSelectionScreen';
import { CitizenPage } from './pages/CitizenPage';
import { StateProvider, useActiveState } from './context/StateContext';
import { setActiveStateId } from './services/api';
import type { ActiveTab } from './types';
import type { MandalProperties } from './types/gis';

export type PortalRole = 
  | 'landing' 
  | 'government_state_selection' 
  | 'government_portal' 
  | 'citizen';

function AppContent() {
  const { currentState, stateId, selectStateByName } = useActiveState();
  const [activeTab, setActiveTab] = useState<ActiveTab>('gis');
  const [selectedMandalForGIS, setSelectedMandalForGIS] = useState<MandalProperties | null>(null);
  
  // Determine initial portal view from URL hash
  const getInitialPortal = (): PortalRole => {
    if (typeof window === 'undefined') return 'landing';
    const hash = window.location.hash.toLowerCase();
    if (hash === '#government/select-state' || hash === '#government/states') return 'government_state_selection';
    if (hash.startsWith('#government') || hash.startsWith('#government/')) {
      return 'government_portal';
    }
    if (hash === '#citizen' || hash.startsWith('#citizen/')) return 'citizen';
    return 'landing';
  };

  const [portalRole, setPortalRole] = useState<PortalRole>(getInitialPortal);

  // Sync state and role with hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#government/select-state' || hash === '#government/states') {
        setPortalRole('government_state_selection');
      } else if (hash.startsWith('#government/')) {
        setPortalRole('government_portal');
        const stateKey = hash.replace('#government/', '').trim();
        if (stateKey) {
          selectStateByName(stateKey);
        }
      } else if (hash === '#government') {
        setPortalRole('government_portal');
      } else if (hash === '#citizen' || hash.startsWith('#citizen/')) {
        setPortalRole('citizen');
      } else {
        setPortalRole('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [selectStateByName]);

  // Keep API module-level state aligned with active stateId
  useEffect(() => {
    setActiveStateId(stateId);
  }, [stateId]);

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

  // From State Selection: Choose state dynamically
  const handleSelectState = (stateName: string) => {
    selectStateByName(stateName);
    const slug = stateName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setSelectedMandalForGIS(null);
    setPortalRole('government_portal');
    window.location.hash = `#government/${slug}`;
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

  // Government Decision-Support Dashboard (Active State Implementation: AP or TN)
  const renderContent = () => {
    switch (activeTab) {
      case 'gis':
        return (
          <GISPage 
            key={`gis-${stateId}`} 
            initialMetric="topsis_score" 
            initialSelectedMandal={selectedMandalForGIS} 
            onNavigateToTab={setActiveTab} 
          />
        );
      case 'priority_directory':
        return (
          <PriorityDirectoryPage 
            key={`priority-${stateId}`}
            onSelectMandalOnMap={(m) => {
              setSelectedMandalForGIS(m);
              setActiveTab('gis');
            }} 
          />
        );
      case 'hazard':
        return <HazardRiskPage key={`hazard-${stateId}`} onSelectMandalOnMap={() => setActiveTab('gis')} />;
      case 'vulnerability':
        return <CommunityVulnerabilityPage key={`vuln-${stateId}`} onSelectMandalOnMap={() => setActiveTab('gis')} />;
      case 'capacity':
        return <EmergencyCapacityPage key={`cap-${stateId}`} onSelectMandalOnMap={() => setActiveTab('gis')} />;
      case 'relocation':
        return <RelocationPlanningPage key={`reloc-${stateId}`} onSelectMandalOnMap={() => setActiveTab('gis')} />;
      case 'hosts':
        return <CandidateLocationsPage key={`hosts-${stateId}`} />;
      case 'simulation':
        return <SimulationPage key={`sim-${stateId}`} />;
      case 'actions':
        return <ActionPlanPage key={`actions-${stateId}`} />;
      case 'dashboard':
        return <DashboardPage key={`dash-${stateId}`} onNavigateToGIS={() => setActiveTab('gis')} />;
      case 'data':
        return <DataMethodologyPage key={`data-${stateId}`} initialTab="sources" onLaunchGIS={() => setActiveTab('gis')} />;
      case 'methodology':
        return <DataMethodologyPage key={`method-${stateId}`} initialTab="methodology" onLaunchGIS={() => setActiveTab('gis')} />;
      default:
        return <GISPage key={`gis-${stateId}`} initialMetric="topsis_score" onNavigateToTab={setActiveTab} />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-900 flex flex-col font-sans select-none">
      <Header 
        pilotState={currentState.name} 
        onBackToLanding={handleReturnToLanding}
        onNavigateToStateSelection={handleNavigateToStateSelection}
        onSelectState={handleSelectState}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main key={stateId} className="flex-1 flex flex-col overflow-hidden p-2 sm:p-2.5 gap-2.5 bg-[#f4f6fa]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <StateProvider>
      <AppContent />
    </StateProvider>
  );
}

export default App;
