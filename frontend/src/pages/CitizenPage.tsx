import React, { useState } from 'react';
import { 
  Shield, 
  ArrowLeft, 
  PhoneCall, 
  AlertTriangle, 
  MapPin, 
  BellRing, 
  Users, 
  Send, 
  CheckCircle2, 
  Clock, 
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface CitizenPageProps {
  onBackToLanding: () => void;
  onNavigateToGovernment: () => void;
}

export const CitizenPage: React.FC<CitizenPageProps> = ({
  onBackToLanding,
  onNavigateToGovernment,
}) => {
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('waterlogging');
  const [reportDescription, setReportDescription] = useState('');

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitted(true);
    setTimeout(() => {
      setReportSubmitted(false);
      setReportDescription('');
    }, 4000);
  };

  const emergencyContacts = [
    { label: 'National Emergency', number: '112', desc: 'Police, Fire, Ambulance' },
    { label: 'AP State Disaster Helpline', number: '1070', desc: 'SDMA Control Room' },
    { label: 'District Emergency (AP)', number: '1077', desc: 'Collectorate Control' },
    { label: 'Medical & Health', number: '108', desc: 'Emergency Medical Service' },
  ];

  const citizenAlerts = [
    {
      id: 'ALT-AP-01',
      type: 'Cyclone & Surge Alert',
      severity: 'High',
      mandal: 'Machilipatnam, Krishna District',
      time: '15 mins ago',
      message: 'Coastal surge advisory issued for low-lying mandals. Residents advised to prepare for safe shelter transit if directed.',
    },
    {
      id: 'ALT-AP-02',
      type: 'Safe Shelter Capacity Update',
      severity: 'Info',
      mandal: 'Narasapuram, West Godavari',
      time: '1 hour ago',
      message: 'Cyclone Relief Centre #4 has active capacity for 350 persons with backup power and clean water supplies.',
    }
  ];

  const nearbyShelters = [
    { name: 'Government High School Cyclone Shelter', distance: '1.2 km', mandal: 'Machilipatnam Urban', capacity: '500 persons', status: 'Available' },
    { name: 'Community Cyclone Centre #3', distance: '2.8 km', mandal: 'Bandar', capacity: '350 persons', status: 'Available' },
    { name: 'Mandal Parishad Relief Centre', distance: '4.1 km', mandal: 'Pedana', capacity: '400 persons', status: 'Near Capacity' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Background GIS Grid */}
      <div className="absolute inset-0 bg-gis-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Return & Branding */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
              title="Return to Access Selection"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    RakshaSethu
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                    CITIZEN PORTAL
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block">
                  Community Emergency Assistance &amp; Safety Network
                </p>
              </div>
            </div>
          </div>

          {/* Right: Switch to Government System */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateToGovernment}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/40 text-xs font-semibold transition shadow-sm"
            >
              <span className="hidden sm:inline">Government Portal</span>
              <span className="sm:hidden">Gov Portal</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Emergency Helplines Fast Access Bar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Direct Emergency Helpline Numbers</span>
            </div>
            <span className="text-[11px] text-emerald-400/90 font-mono">24/7 Toll-Free Toll Response</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {emergencyContacts.map((contact, idx) => (
              <a
                key={idx}
                href={`tel:${contact.number}`}
                className="group p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md flex items-center justify-between"
              >
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">{contact.label}</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight group-hover:scale-105 transition-transform">
                    {contact.number}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{contact.desc}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Notice & Architecture Information Banner */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 flex items-start gap-3 shadow-inner">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200">Citizen Workflow Ready:</span>
            <p className="leading-relaxed">
              This citizen interface provides community-facing emergency channels (Incident Reporting, Safe Shelter Discovery, Official Alert Broadcasts). The workflows are designed to connect to state and district emergency dispatch systems.
            </p>
          </div>
        </div>

        {/* 2-Column Grid: Left (Reporting & Status), Right (Shelters & Alerts) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Report Incident & Family Safety (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Box 1: Report Incident & SOS */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Report Hazard or Request Assistance</h3>
                    <p className="text-[11px] text-slate-400">Send geo-tagged incident details to disaster coordinators</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/30">
                  SOS READY
                </span>
              </div>

              {reportSubmitted ? (
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-in fade-in">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-emerald-300">Incident Reported Successfully</p>
                  <p className="text-xs text-slate-300">
                    Your location and report details have been queued for district disaster coordination.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Hazard / Emergency Category
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'waterlogging', label: 'Flood / Water' },
                        { id: 'cyclone_damage', label: 'Wind / Cyclone' },
                        { id: 'medical_aid', label: 'Medical SOS' },
                        { id: 'road_blocked', label: 'Road Blocked' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold text-center transition border ${
                            selectedCategory === cat.id
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Location &amp; Landmark
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
                        <span className="font-mono text-xs text-slate-300">Detected: Machilipatnam Coastal Mandal (16.18° N, 81.13° E)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Brief Description / Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Describe the immediate situation (e.g. water level rising, family of 4 stranded near coastal road)..."
                      className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500/50"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/20 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmit Incident Report to Control Center</span>
                  </button>
                </form>
              )}
            </div>

            {/* Box 2: Family Safety Check-In */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Family Safety Check-In</h3>
                  <p className="text-[11px] text-slate-400">Broadcast your safe evacuation status to registered emergency contacts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => alert('Status updated: "I AM SAFE IN RELIEF SHELTER"')}
                  className="p-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-left transition space-y-1"
                >
                  <p className="text-xs font-bold text-emerald-300">✅ I Am Safe</p>
                  <p className="text-[10px] text-slate-400">At safe shelter / home with power and water</p>
                </button>
                <button
                  onClick={() => alert('Status updated: "CURRENTLY EVACUATING"')}
                  className="p-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-left transition space-y-1"
                >
                  <p className="text-xs font-bold text-amber-300">⚠️ In Transit / Evacuating</p>
                  <p className="text-[10px] text-slate-400">Moving toward designated relief location</p>
                </button>
              </div>
            </div>

          </div>

          {/* Right: Shelters & Official Alerts (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Box 3: Nearby Safe Cyclone Shelters */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Nearby Safe Shelters</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">AP Coastal Grid</span>
              </div>

              <div className="space-y-3">
                {nearbyShelters.map((shelter, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold text-slate-100">{shelter.name}</p>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {shelter.distance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Mandal: {shelter.mandal}</span>
                      <span className="text-slate-300 font-medium">Cap: {shelter.capacity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 4: Official Broadcasts & Alerts */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Official SDMA Alerts</h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 animate-pulse">LIVE BROADCAST</span>
              </div>

              <div className="space-y-3">
                {citizenAlerts.map((alt) => (
                  <div key={alt.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">{alt.type}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{alt.time}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{alt.message}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Target: {alt.mandal}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RakshaSethu Citizen Safety Network &bull; Smart India Hackathon 2026</span>
          <button
            onClick={onNavigateToGovernment}
            className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 mx-auto sm:mx-0"
          >
            <span>Access Government Decision-Support System</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
