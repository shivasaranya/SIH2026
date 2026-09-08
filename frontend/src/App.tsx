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
  const { currentState, stateId, setStateId, selectStateByName } = useActiveState();
  const [activeTab, setActiveTab] = useState<ActiveTab>('gis');
  const [selectedMandalForGIS, setSelectedMandalForGIS] = useState<MandalProperties | null>(null);
  
  // Determine initial portal view from URL hash
  const getInitialPortal = (): PortalRole => {
    if (typeof window === 'undefined') return 'landing';
    const hash = window.location.hash.toLowerCase();
    if (hash === '#government/select-state' || hash === '#government/states') return 'government_state_selection';
    if (
      hash.startsWith('#government/ml') ||
      hash.startsWith('#government/meghalaya') ||
      hash.startsWith('#government/nl') ||
      hash.startsWith('#government/nagaland') ||
      hash.startsWith('#government/ar') ||
      hash.startsWith('#government/arunachal') ||
      hash.startsWith('#government/sk') ||
      hash.startsWith('#government/sikkim') ||
      hash.startsWith('#government/uk') ||
      hash.startsWith('#government/uttarakhand') ||
      hash.startsWith('#government/uttaranchal') ||
      hash.startsWith('#government/od') ||
      hash.startsWith('#government/odisha') ||
      hash.startsWith('#government/orissa') ||
      hash.startsWith('#government/wb') ||
      hash.startsWith('#government/west_bengal') ||
      hash.startsWith('#government/bengal') ||
      hash.startsWith('#government/br') ||
      hash.startsWith('#government/bihar') ||
      hash.startsWith('#government/up') ||
      hash.startsWith('#government/uttar_pradesh') ||
      hash.startsWith('#government/uttar') ||
      hash.startsWith('#government/as') ||
      hash.startsWith('#government/assam') ||
      hash.startsWith('#government/ap') || 
      hash.startsWith('#government/tn') || 
      hash.startsWith('#government/andhra') || 
      hash.startsWith('#government/tamil') || 
      hash === '#government'
    ) {
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
      } else if (hash.includes('/ml') || hash.includes('/meghalaya')) {
        setPortalRole('government_portal');
        setStateId('meghalaya');
        setActiveStateId('meghalaya');
      } else if (hash.includes('/nl') || hash.includes('/nagaland')) {
        setPortalRole('government_portal');
        setStateId('nagaland');
        setActiveStateId('nagaland');
      } else if (hash.includes('/ar') || hash.includes('/arunachal')) {
        setPortalRole('government_portal');
        setStateId('arunachal_pradesh');
        setActiveStateId('arunachal_pradesh');
      } else if (hash.includes('/sk') || hash.includes('/sikkim')) {
        setPortalRole('government_portal');
        setStateId('sikkim');
        setActiveStateId('sikkim');
      } else if (hash.includes('/uk') || hash.includes('/uttarakhand') || hash.includes('/uttaranchal')) {
        setPortalRole('government_portal');
        setStateId('uttarakhand');
        setActiveStateId('uttarakhand');
      } else if (hash.includes('/od') || hash.includes('/odisha') || hash.includes('/orissa')) {
        setPortalRole('government_portal');
        setStateId('odisha');
        setActiveStateId('odisha');
      } else if (hash.includes('/wb') || hash.includes('/west_bengal') || hash.includes('/bengal')) {
        setPortalRole('government_portal');
        setStateId('west_bengal');
        setActiveStateId('west_bengal');
      } else if (hash.includes('/br') || hash.includes('/bihar')) {
        setPortalRole('government_portal');
        setStateId('bihar');
        setActiveStateId('bihar');
      } else if (hash.includes('/as') || hash.includes('/assam')) {
        setPortalRole('government_portal');
        setStateId('assam');
        setActiveStateId('assam');
      } else if (hash.includes('/tn') || hash.includes('/tamil')) {
        setPortalRole('government_portal');
        setStateId('tamil_nadu');
        setActiveStateId('tamil_nadu');
      } else if (hash.includes('/up') || hash.includes('/uttar_pradesh') || (hash.includes('/uttar') && !hash.includes('uttarakhand') && !hash.includes('uttaranchal'))) {
        setPortalRole('government_portal');
        setStateId('uttar_pradesh');
        setActiveStateId('uttar_pradesh');
      } else if (hash.includes('/ap') || hash.includes('/andhra') || hash === '#government') {
        setPortalRole('government_portal');
        setStateId('andhra_pradesh');
        setActiveStateId('andhra_pradesh');
      } else if (hash === '#citizen' || hash.startsWith('#citizen/')) {
        setPortalRole('citizen');
      } else {
        setPortalRole('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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

  // From State Selection: Choose state
  const handleSelectState = (stateName: string) => {
    const isML = stateName.toLowerCase().includes('meghalaya') || stateName.toLowerCase() === 'ml';
    const isNL = stateName.toLowerCase().includes('nagaland') || stateName.toLowerCase() === 'nl';
    const isAR = stateName.toLowerCase().includes('arunachal') || stateName.toLowerCase() === 'ar';
    const isSK = stateName.toLowerCase().includes('sikkim') || stateName.toLowerCase() === 'sk';
    const isUK = stateName.toLowerCase().includes('uttarakhand') || stateName.toLowerCase().includes('uttaranchal') || stateName.toLowerCase() === 'uk';
    const isOD = stateName.toLowerCase().includes('odisha') || stateName.toLowerCase().includes('orissa') || stateName.toLowerCase() === 'od';
    const isWB = stateName.toLowerCase().includes('bengal') || stateName.toLowerCase() === 'wb';
    const isAS = stateName.toLowerCase().includes('assam');
    const isTN = stateName.toLowerCase().includes('tamil');
    const isBR = stateName.toLowerCase().includes('bihar');
    const isUP = !isUK && (stateName.toLowerCase().includes('uttar') || stateName.toLowerCase() === 'up');
    const targetStateId = isML ? 'meghalaya' : (isNL ? 'nagaland' : (isAR ? 'arunachal_pradesh' : (isSK ? 'sikkim' : (isUK ? 'uttarakhand' : (isOD ? 'odisha' : (isWB ? 'west_bengal' : (isAS ? 'assam' : (isTN ? 'tamil_nadu' : (isBR ? 'bihar' : (isUP ? 'uttar_pradesh' : 'andhra_pradesh'))))))))));
    selectStateByName(stateName);
    setActiveStateId(targetStateId);
    setSelectedMandalForGIS(null);
    setPortalRole('government_portal');
    window.location.hash = isML ? '#government/ml' : (isNL ? '#government/nl' : (isAR ? '#government/ar' : (isSK ? '#government/sk' : (isUK ? '#government/uk' : (isOD ? '#government/od' : (isWB ? '#government/wb' : (isAS ? '#government/as' : (isTN ? '#government/tn' : (isBR ? '#government/br' : (isUP ? '#government/up' : '#government/ap'))))))))));
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
