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
import { VillageAnalysisPage } from './pages/VillageAnalysisPage';
import { VillageAnalysisReportPage } from './pages/VillageAnalysisReportPage';
import { StateProvider, useActiveState, resolveStateId, getStateSlug } from './context/StateContext';
import { setActiveStateId } from './services/api';
import type { ActiveTab } from './types';
import type { MandalProperties } from './types/gis';

export type PortalRole = 
  | 'landing' 
  | 'government_state_selection' 
  | 'government_portal' 
  | 'citizen';

function AppContent() {
  const { currentState, stateId, setStateId, selectStateByName } = useActiveState();
  // Determine initial tab from URL hash
  const getInitialTab = (): ActiveTab => {
    if (typeof window === 'undefined') return 'gis';
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('village') && hash.includes('report')) return 'village_report';
    if (hash.includes('village')) return 'village';
    if (hash.includes('hosts') || hash.includes('safer-locations')) return 'hosts';
    if (hash.includes('relocation')) return 'relocation';
    if (hash.includes('priority')) return 'priority_directory';
    if (hash.includes('hazard')) return 'hazard';
    if (hash.includes('capacity')) return 'capacity';
    if (hash.includes('vulnerability')) return 'vulnerability';
    if (hash.includes('simulation')) return 'simulation';
    if (hash.includes('actions')) return 'actions';
    if (hash.includes('methodology')) return 'methodology';
    if (hash.includes('data')) return 'data';
    if (hash.includes('dashboard')) return 'dashboard';
    return 'gis';
  };

  const getInitialVillageCode = (): number | null => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.toLowerCase();
    const match = hash.match(/\/village\/(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  };

  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [selectedVillageCode, setSelectedVillageCode] = useState<number | null>(getInitialVillageCode);
  const [selectedMandalForGIS, setSelectedMandalForGIS] = useState<MandalProperties | null>(null);
  
  // Determine initial portal view from URL hash or pathname
  const getInitialPortal = (): PortalRole => {
    if (typeof window === 'undefined') return 'landing';
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    if (hash === '#government/select-state' || hash === '#government/states' || pathname === '/government/select-state') {
      return 'government_state_selection';
    }
    if (
      hash.startsWith('#government/') ||
      hash === '#government' ||
      pathname.startsWith('/government/') ||
      pathname === '/government' ||
      hash.includes('hosts') ||
      hash.includes('safer-locations')
    ) {
      return 'government_portal';
    }
    if (hash === '#citizen' || hash.startsWith('#citizen/') || pathname.startsWith('/citizen')) return 'citizen';
    return 'landing';
  };

  const [portalRole, setPortalRole] = useState<PortalRole>(getInitialPortal);

  // Sync state, tab, and role with hash and URL changes
  useEffect(() => {
    const handleUrlSync = () => {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const fullUrl = `${pathname}${hash}`;

      const villageMatch = fullUrl.match(/\/village\/(\d+)/i);
      const isReport = fullUrl.includes('/report');
      if (villageMatch) {
        const vCode = parseInt(villageMatch[1], 10);
        setSelectedVillageCode(vCode);
        setActiveTab(isReport ? 'village_report' : 'village');
        setPortalRole('government_portal');
        setStateId('andhra_pradesh');
        setActiveStateId('andhra_pradesh');
        return;
      }
      if (hash === '#government/select-state' || hash === '#government/states' || pathname === '/government/select-state') {
        setPortalRole('government_state_selection');
      } else if (fullUrl.includes('government/') || hash === '#government' || pathname === '/government') {
        setPortalRole('government_portal');
        const match = fullUrl.match(/government\/([a-z0-9_-]+)/i);
        if (match && match[1] && match[1] !== 'select-state' && match[1] !== 'states') {
          const resolved = resolveStateId(match[1]);
          setStateId(resolved);
          setActiveStateId(resolved);
        }
        if (fullUrl.includes('hosts') || fullUrl.includes('safer-locations')) setActiveTab('hosts');
      } else if (hash === '#citizen' || hash.startsWith('#citizen/') || pathname.startsWith('/citizen')) {
        setPortalRole('citizen');
      } else {
        setPortalRole('landing');
      }
    };

    window.addEventListener('hashchange', handleUrlSync);
    window.addEventListener('popstate', handleUrlSync);
    return () => {
      window.removeEventListener('hashchange', handleUrlSync);
      window.removeEventListener('popstate', handleUrlSync);
    };
  }, [setStateId]);

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
    const targetStateId = resolveStateId(stateName);
    const slug = getStateSlug(targetStateId);

    selectStateByName(stateName);
    setStateId(targetStateId);
    setActiveStateId(targetStateId);
    setSelectedMandalForGIS(null);
    setPortalRole('government_portal');
    window.location.hash = `#government/${slug}`;
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', `/government/${slug}`);
    }
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

  // Government Decision-Support Dashboard
  const getStatePrefix = (sId: string) => {
    return `government/${sId.replace(/_/g, '-')}`;
  };
  const renderContent = () => {
    switch (activeTab) {
      case 'gis':
        return (
          <GISPage 
            key={`gis-${stateId}`}
            initialMetric="topsis_score" 
            initialSelectedMandal={selectedMandalForGIS} 
            onNavigateToTab={setActiveTab} 
            onNavigateToVillage={(vCode) => {
              setSelectedVillageCode(vCode);
              setActiveTab('village');
              window.location.hash = `#${getStatePrefix(stateId)}/village/${vCode}`;
            }}
          />
        );
      case 'village':
        return (
          <VillageAnalysisPage
            key={`village-${selectedVillageCode || 588383}`}
            villageCode={selectedVillageCode || 588383}
            onSelectVillage={(vCode) => {
              setSelectedVillageCode(vCode);
              window.location.hash = `#${getStatePrefix(stateId)}/village/${vCode}`;
            }}
            onBackToRiskMap={() => {
              setActiveTab('gis');
              window.location.hash = `#${getStatePrefix(stateId)}/gis`;
            }}
            onNavigateToActionPlan={() => {
              setActiveTab('actions');
              window.location.hash = `#${getStatePrefix(stateId)}/actions`;
            }}
            onNavigateToReport={(vCode) => {
              setSelectedVillageCode(vCode);
              setActiveTab('village_report');
              window.location.hash = `#${getStatePrefix(stateId)}/village/${vCode}/report`;
            }}
          />
        );
      case 'village_report':
        return (
          <VillageAnalysisReportPage
            key={`village-report-${selectedVillageCode || 588383}`}
            villageCode={selectedVillageCode || 588383}
            onBackToVillage={() => {
              setActiveTab('village');
              window.location.hash = `#${getStatePrefix(stateId)}/village/${selectedVillageCode || 588383}`;
            }}
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

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.location.hash = `#${getStatePrefix(stateId)}/${tab}`;
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
        <Sidebar activeTab={activeTab} onSelectTab={handleSelectTab} />
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
