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
    if (hash === '#government/gujarat') {
      setSelectedState('Gujarat');
      return 'government_ap';
    }
    if (hash === '#government/kerala' || hash === '#government/kerela') {
      setSelectedState('Kerala');
      return 'government_ap';
    }
    if (hash === '#government/maharashtra' || hash === '#government/maharastra' || hash === '#government/mh') {
      setSelectedState('Maharashtra');
      return 'government_ap';
    }
    if (hash === '#government/haryana' || hash === '#government/hr') {
      setSelectedState('Haryana');
      return 'government_ap';
    }
    if (hash === '#government/punjab' || hash === '#government/pb') {
      setSelectedState('Punjab');
      return 'government_ap';
    }
    if (hash === '#government/chhattisgarh' || hash === '#government/cg' || hash === '#government/ct') {
      setSelectedState('Chhattisgarh');
      return 'government_ap';
    }
    if (hash === '#government/ap' || hash === '#government/andhra-pradesh' || hash === '#government') {
      setSelectedState('Andhra Pradesh');
      return 'government_ap';
    }
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
      } else if (hash === '#government/gujarat') {
        setSelectedState('Gujarat');
        setPortalRole('government_ap');
      } else if (hash === '#government/kerala' || hash === '#government/kerela') {
        setSelectedState('Kerala');
        setPortalRole('government_ap');
      } else if (hash === '#government/maharashtra' || hash === '#government/maharastra' || hash === '#government/mh') {
        setSelectedState('Maharashtra');
        setPortalRole('government_ap');
      } else if (hash === '#government/haryana' || hash === '#government/hr') {
        setSelectedState('Haryana');
        setPortalRole('government_ap');
      } else if (hash === '#government/punjab' || hash === '#government/pb') {
        setSelectedState('Punjab');
        setPortalRole('government_ap');
      } else if (hash === '#government/chhattisgarh' || hash === '#government/cg' || hash === '#government/ct') {
        setSelectedState('Chhattisgarh');
        setPortalRole('government_ap');
      } else if (hash === '#government/ap' || hash === '#government/andhra-pradesh' || hash === '#government') {
        setSelectedState('Andhra Pradesh');
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
    let slug = 'ap';
    if (stateName.toLowerCase().includes('gujarat')) slug = 'gujarat';
    else if (stateName.toLowerCase().includes('kerala') || stateName.toLowerCase().includes('kerela')) slug = 'kerala';
    else if (stateName.toLowerCase().includes('maharashtra') || stateName.toLowerCase().includes('maharastra')) slug = 'maharashtra';
    else if (stateName.toLowerCase().includes('haryana') || stateName.toLowerCase() === 'hr') slug = 'haryana';
    else if (stateName.toLowerCase().includes('punjab') || stateName.toLowerCase() === 'pb') slug = 'punjab';
    else if (stateName.toLowerCase().includes('chhattisgarh') || stateName.toLowerCase().includes('chhatisgarh') || stateName.toLowerCase() === 'cg') slug = 'chhattisgarh';
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
  const renderContent = () => {
    switch (activeTab) {
      case 'gis':
        return <GISPage key={`gis-${selectedState}`} initialMetric="topsis_score" selectedState={selectedState} />;
      case 'hazard':
        return <GISPage key={`hazard-${selectedState}`} initialMetric="hazard_exposure" selectedState={selectedState} />;
      case 'vulnerability':
        return <GISPage key={`vulnerability-${selectedState}`} initialMetric="demographic_sensitivity" selectedState={selectedState} />;
      case 'capacity':
        return <GISPage key={`capacity-${selectedState}`} initialMetric="shelter_capacity" selectedState={selectedState} />;
      case 'relocation':
        return <GISPage key={`relocation-${selectedState}`} initialMetric="topsis_score" selectedState={selectedState} />;
      case 'hosts':
        return <GISPage key={`hosts-${selectedState}`} initialMetric="safe_area_fraction" selectedState={selectedState} />;
      case 'simulation':
        return <GISPage key={`simulation-${selectedState}`} initialMetric="scenario_topsis_score" initialOpenSimulation={true} selectedState={selectedState} />;
      case 'actions':
        return <GISPage key={`actions-${selectedState}`} initialMetric="topsis_score" selectedState={selectedState} />;
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
        return <GISPage key={`gis-${selectedState}`} initialMetric="topsis_score" selectedState={selectedState} />;
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

