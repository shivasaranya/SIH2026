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
    // Any #government/... URL (including all 14 operational states and any future ones) is the portal
    if (hash.startsWith('#government')) return 'government_portal';
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
        const vState = (hash.includes('/tn/') || hash.includes('tamil') || hash.includes('/tn')) ? 'tamil_nadu' : 'andhra_pradesh';
        setStateId(vState);
        setActiveStateId(vState);
        return;
      }
      if (hash === '#government/select-state' || hash === '#government/states') {
        setPortalRole('government_state_selection');
      } else if (hash === '#citizen' || hash.startsWith('#citizen/')) {
        setPortalRole('citizen');
      } else if (hash.startsWith('#government')) {
        // ── Resolve state from URL slug ─────────────────────────────────────
        // Strips the leading #government/ and reads the slug segment.
        const slugSegment = hash.replace('#government/', '').split('/')[0];
        const slug = slugSegment || 'ap';

        // slug → stateId lookup (mirrors resolveStateFromName above)
        let resolvedStateId = 'andhra_pradesh';
        if (slug === 'ap' || slug.includes('andhra'))         resolvedStateId = 'andhra_pradesh';
        else if (slug === 'mz' || slug.includes('mizoram'))   resolvedStateId = 'mizoram';
        else if (slug === 'hp' || slug.includes('himachal'))  resolvedStateId = 'himachal_pradesh';
        else if (slug === 'tn' || slug.includes('tamil'))     resolvedStateId = 'tamil_nadu';
        else if (slug === 'as' || slug.includes('assam'))     resolvedStateId = 'assam';
        else if (slug === 'br' || slug.includes('bihar'))     resolvedStateId = 'bihar';
        else if (slug === 'wb' || slug.includes('west-bengal') || slug.includes('bengal')) resolvedStateId = 'west_bengal';
        else if (slug === 'od' || slug.includes('odisha') || slug.includes('orissa'))      resolvedStateId = 'odisha';
        else if (slug === 'up' || slug.includes('uttar-pradesh'))  resolvedStateId = 'uttar_pradesh';
        else if (slug === 'uk' || slug.includes('uttarakhand'))    resolvedStateId = 'uttarakhand';
        else if (slug === 'sk' || slug.includes('sikkim'))         resolvedStateId = 'sikkim';
        else if (slug === 'ar' || slug.includes('arunachal'))      resolvedStateId = 'arunachal_pradesh';
        else if (slug === 'nl' || slug.includes('nagaland'))       resolvedStateId = 'nagaland';
        else if (slug === 'ml' || slug.includes('meghalaya'))      resolvedStateId = 'meghalaya';
        else resolvedStateId = slug; // non-operational: preserve slug as stateId

        setPortalRole('government_portal');
        setStateId(resolvedStateId);
        setActiveStateId(resolvedStateId);
        if (hash.includes('hosts') || hash.includes('safer-locations')) setActiveTab('hosts');
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

  // ─── Centralised state name → { stateId, hashSlug } lookup ───────────────
  // Covers every state visible on the national India map.
  // stateName comes from the GeoJSON feature properties (raw display name).
  const resolveStateFromName = (stateName: string): { stateId: string; hashSlug: string } => {
    const n = stateName.trim().toLowerCase();
    if (n.includes('andhra'))       return { stateId: 'andhra_pradesh',    hashSlug: 'ap' };
    if (n.includes('mizo'))         return { stateId: 'mizoram',           hashSlug: 'mizoram' };
    if (n.includes('himachal'))     return { stateId: 'himachal_pradesh',  hashSlug: 'himachal-pradesh' };
    if (n.includes('tamil'))        return { stateId: 'tamil_nadu',        hashSlug: 'tamil-nadu' };
    if (n.includes('assam'))        return { stateId: 'assam',             hashSlug: 'assam' };
    if (n.includes('bihar'))        return { stateId: 'bihar',             hashSlug: 'bihar' };
    if (n.includes('west bengal') || n.includes('westbengal')) return { stateId: 'west_bengal', hashSlug: 'west-bengal' };
    if (n.includes('odisha') || n.includes('orissa')) return { stateId: 'odisha', hashSlug: 'odisha' };
    if (n.includes('uttar pradesh') || n.includes('uttarpradesh')) return { stateId: 'uttar_pradesh', hashSlug: 'uttar-pradesh' };
    if (n.includes('uttarakhand') || n.includes('uttaranchal')) return { stateId: 'uttarakhand', hashSlug: 'uttarakhand' };
    if (n.includes('sikkim'))       return { stateId: 'sikkim',            hashSlug: 'sikkim' };
    if (n.includes('arunachal'))    return { stateId: 'arunachal_pradesh', hashSlug: 'arunachal-pradesh' };
    if (n.includes('nagaland'))     return { stateId: 'nagaland',          hashSlug: 'nagaland' };
    if (n.includes('meghalaya'))    return { stateId: 'meghalaya',         hashSlug: 'meghalaya' };
    // Non-operational states — build a clean slug so the URL is correct
    // even though the dashboard will show a coming-soon / placeholder view.
    const slug = n.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return { stateId: slug, hashSlug: slug };
  };

  // From State Selection: Choose state
  const handleSelectState = (stateName: string) => {
    const { stateId: targetStateId, hashSlug } = resolveStateFromName(stateName);
    selectStateByName(stateName);
    setActiveStateId(targetStateId);
    setSelectedMandalForGIS(null);
    setPortalRole('government_portal');
    window.location.hash = `#government/${hashSlug}`;
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
  const getStatePrefix = (sId: string) => {
    const slugMap: Record<string, string> = {
      andhra_pradesh:    'ap',
      mizoram:           'mizoram',
      himachal_pradesh:  'himachal-pradesh',
      tamil_nadu:        'tamil-nadu',
      assam:             'assam',
      bihar:             'bihar',
      west_bengal:       'west-bengal',
      odisha:            'odisha',
      uttar_pradesh:     'uttar-pradesh',
      uttarakhand:       'uttarakhand',
      sikkim:            'sikkim',
      arunachal_pradesh: 'arunachal-pradesh',
      nagaland:          'nagaland',
      meghalaya:         'meghalaya',
    };
    const slug = slugMap[sId] ?? sId.replace(/_/g, '-');
    return `government/${slug}`;
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
