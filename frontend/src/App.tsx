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
      hash.startsWith('#government/mz') || 
      hash.startsWith('#government/hp') || 
      hash.startsWith('#government/jk') || 
      hash.startsWith('#government/mp') || 
      hash.startsWith('#government/andhra') || 
      hash.startsWith('#government/tamil') || 
      hash.startsWith('#government/mizoram') || 
      hash.startsWith('#government/himachal') || 
      hash.startsWith('#government/jammu') || 
      hash.startsWith('#government/kashmir') || 
      hash.startsWith('#government/madhya') || 
      hash.startsWith('#government/gujarat') ||
      hash.startsWith('#government/gj') ||
      hash.startsWith('#government/kerala') ||
      hash.startsWith('#government/kl') ||
      hash.startsWith('#government/maharashtra') ||
      hash.startsWith('#government/mh') ||
      hash.startsWith('#government/haryana') ||
      hash.startsWith('#government/hr') ||
      hash.startsWith('#government/punjab') ||
      hash.startsWith('#government/pb') ||
      hash.startsWith('#government/chhattisgarh') ||
      hash.startsWith('#government/cg') ||
      hash === '#government' ||
      hash.includes('hosts') ||
      hash.includes('safer-locations')
    ) {
      return 'government_portal';
    }
    if (hash === '#citizen' || hash.startsWith('#citizen/')) return 'citizen';
    return 'landing';
  };

  const [portalRole, setPortalRole] = useState<PortalRole>(getInitialPortal);

  // Sync state, tab, and role with hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      const villageMatch = hash.match(/\/village\/(\d+)/i);
      const isReport = hash.includes('/report');
      if (villageMatch) {
        const vCode = parseInt(villageMatch[1], 10);
        setSelectedVillageCode(vCode);
        setActiveTab(isReport ? 'village_report' : 'village');
        setPortalRole('government_portal');
        setStateId('andhra_pradesh');
        setActiveStateId('andhra_pradesh');
        return;
      }
      if (hash === '#government/select-state' || hash === '#government/states') {
        setPortalRole('government_state_selection');
      } else if (hash.includes('/mz') || hash.includes('/mizoram')) {
        setPortalRole('government_portal');
        setStateId('mizoram');
        setActiveStateId('mizoram');
        if (hash.includes('hosts')) setActiveTab('hosts');
      } else if (hash.includes('/tn') || hash.includes('/tamil')) {
        setPortalRole('government_portal');
        setStateId('tamil_nadu');
        setActiveStateId('tamil_nadu');
        if (hash.includes('hosts')) setActiveTab('hosts');
      } else if (hash.includes('/hp') || hash.includes('/himachal')) {
        setPortalRole('government_portal');
        setStateId('himachal_pradesh');
        setActiveStateId('himachal_pradesh');
        if (hash.includes('hosts')) setActiveTab('hosts');
      } else if (hash.includes('/jk') || hash.includes('/kashmir') || hash.includes('/jammu')) {
        setPortalRole('government_portal');
        setStateId('jammu_kashmir');
        setActiveStateId('jammu_kashmir');
        if (hash.includes('hosts')) setActiveTab('hosts');
      } else if (hash.includes('/mp') || hash.includes('/madhya')) {
        setPortalRole('government_portal');
        setStateId('madhya_pradesh');
        setActiveStateId('madhya_pradesh');
        if (hash.includes('hosts')) setActiveTab('hosts');
      } else if (hash.includes('/up') || hash.includes('/uttar_pradesh') || hash.includes('/uttar')) {
        setPortalRole('government_portal');
        setStateId('uttar_pradesh');
        setActiveStateId('uttar_pradesh');
      } else if (hash.includes('/gujarat') || hash.includes('/gj')) {
        setPortalRole('government_portal');
        setStateId('gujarat');
        setActiveStateId('gujarat');
      } else if (hash.includes('/kerala') || hash.includes('/kl') || hash.includes('/kerela')) {
        setPortalRole('government_portal');
        setStateId('kerala');
        setActiveStateId('kerala');
      } else if (hash.includes('/maharashtra') || hash.includes('/mh') || hash.includes('/maharastra')) {
        setPortalRole('government_portal');
        setStateId('maharashtra');
        setActiveStateId('maharashtra');
      } else if (hash.includes('/haryana') || hash.includes('/hr')) {
        setPortalRole('government_portal');
        setStateId('haryana');
        setActiveStateId('haryana');
      } else if (hash.includes('/punjab') || hash.includes('/pb')) {
        setPortalRole('government_portal');
        setStateId('punjab');
        setActiveStateId('punjab');
      } else if (hash.includes('/chhattisgarh') || hash.includes('/cg') || hash.includes('/ct')) {
        setPortalRole('government_portal');
        setStateId('chhattisgarh');
        setActiveStateId('chhattisgarh');
      } else if (hash.includes('/ap') || hash.includes('/andhra') || hash === '#government' || hash.includes('hosts') || hash.includes('safer-locations')) {
        setPortalRole('government_portal');
        setStateId('andhra_pradesh');
        setActiveStateId('andhra_pradesh');
        if (hash.includes('hosts') || hash.includes('safer-locations')) setActiveTab('hosts');
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
    const isMZ = stateName.toLowerCase().includes('mizo');
    const isHP = stateName.toLowerCase().includes('himachal') || stateName.toLowerCase() === 'hp';
    const isGJ = stateName.toLowerCase().includes('gujarat') || stateName.toLowerCase() === 'gj';
    const isKL = stateName.toLowerCase().includes('kerala') || stateName.toLowerCase().includes('kerela') || stateName.toLowerCase() === 'kl';
    const isMH = stateName.toLowerCase().includes('maharashtra') || stateName.toLowerCase().includes('maharastra') || stateName.toLowerCase() === 'mh';
    const isHR = stateName.toLowerCase().includes('haryana') || stateName.toLowerCase() === 'hr';
    const isPB = stateName.toLowerCase().includes('punjab') || stateName.toLowerCase() === 'pb';
    const isCG = stateName.toLowerCase().includes('chhattisgarh') || stateName.toLowerCase().includes('chhatisgarh') || stateName.toLowerCase() === 'cg' || stateName.toLowerCase() === 'ct';
    const isML = stateName.toLowerCase().includes('meghalaya') || stateName.toLowerCase() === 'ml';
    const isNL = stateName.toLowerCase().includes('nagaland') || stateName.toLowerCase() === 'nl';
    const isAR = stateName.toLowerCase().includes('arunachal') || stateName.toLowerCase() === 'ar';
    const isSK = stateName.toLowerCase().includes('sikkim') || stateName.toLowerCase() === 'sk';
    const isUK = stateName.toLowerCase().includes('uttarakhand') || stateName.toLowerCase().includes('uttaranchal') || stateName.toLowerCase() === 'uk';
    const isOD = stateName.toLowerCase().includes('odisha') || stateName.toLowerCase().includes('orissa') || stateName.toLowerCase() === 'od';
    const isWB = stateName.toLowerCase().includes('bengal') || stateName.toLowerCase() === 'wb';
    const isAS = stateName.toLowerCase().includes('assam');
    const isTN = stateName.toLowerCase().includes('tamil');
    const isJK = stateName.toLowerCase().includes('kashmir') || stateName.toLowerCase().includes('jammu') || stateName.toLowerCase() === 'jk';
    const isMP = stateName.toLowerCase().includes('madhya') || stateName.toLowerCase() === 'mp';
    const isBR = stateName.toLowerCase().includes('bihar');
    const isUP = !isUK && (stateName.toLowerCase().includes('uttar') || stateName.toLowerCase() === 'up');

    const targetStateId: any = isMZ ? 'mizoram' : (isHP ? 'himachal_pradesh' : (isJK ? 'jammu_kashmir' : (isMP ? 'madhya_pradesh' : (isGJ ? 'gujarat' : (isKL ? 'kerala' : (isMH ? 'maharashtra' : (isHR ? 'haryana' : (isPB ? 'punjab' : (isCG ? 'chhattisgarh' : (isML ? 'meghalaya' : (isNL ? 'nagaland' : (isAR ? 'arunachal_pradesh' : (isSK ? 'sikkim' : (isUK ? 'uttarakhand' : (isOD ? 'odisha' : (isWB ? 'west_bengal' : (isAS ? 'assam' : (isTN ? 'tamil_nadu' : (isBR ? 'bihar' : (isUP ? 'uttar_pradesh' : 'andhra_pradesh'))))))))))))))))))));

    const slug = isMZ ? 'mz' : (isHP ? 'hp' : (isJK ? 'jk' : (isMP ? 'mp' : (isGJ ? 'gujarat' : (isKL ? 'kerala' : (isMH ? 'maharashtra' : (isHR ? 'haryana' : (isPB ? 'punjab' : (isCG ? 'chhattisgarh' : (isML ? 'ml' : (isNL ? 'nl' : (isAR ? 'ar' : (isSK ? 'sk' : (isUK ? 'uk' : (isOD ? 'od' : (isWB ? 'wb' : (isAS ? 'as' : (isTN ? 'tn' : (isBR ? 'br' : (isUP ? 'up' : 'ap'))))))))))))))))))));

    selectStateByName(stateName);
    setActiveStateId(targetStateId);
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

  // Government Decision-Support Dashboard
  const getStatePrefix = (sId: string) => {
    if (sId === 'mizoram') return 'government/mz';
    if (sId === 'tamil_nadu') return 'government/tn';
    if (sId === 'himachal_pradesh') return 'government/hp';
    if (sId === 'andhra_pradesh') return 'government/ap';
    return `government/${sId.replace('_', '')}`;
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
