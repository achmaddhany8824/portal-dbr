import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  MessageSquare, 
  FileEdit, 
  BarChart2, 
  CheckSquare,
  Loader2,
  LogOut,
  BrainCircuit
} from 'lucide-react';

import DashboardView from './components/DashboardView';
import ObservasiView from './components/ObservasiView';
import ValidationView from './components/ValidationView';
import TaskAnalysisView from './components/TaskAnalysisView';
import InterviewView from './components/InterviewView';
import EvaluationView from './components/EvaluationView';
import AnalyticsView from './components/AnalyticsView';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'dbr-mfl-app';

export default function PortalRisetDBR() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      // Periksa apakah URL Google Apps Script sudah dikonfigurasi
      const gasUrl = import.meta.env.VITE_GAS_WEB_APP_URL || "YOUR_CODE_GOOGLE_APPSCRIPT";
      
      if (!gasUrl) {
        setIsDemoMode(true);
        setUser({ id: 'demo-user', email: 'demo@example.com' });
      } else {
        setIsDemoMode(false);
        // Karena GAS tidak memiliki autentikasi bawaan seperti Supabase/Firebase,
        // kita set user dummy untuk UI.
        setUser({ id: 'researcher-1', email: 'researcher@dbr.com' });
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleLogout = async () => {
    try {
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Memuat Portal Riset...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const props = { user, isDemoMode, appId };

    switch (activeTab) {
      case 'dashboard': return <DashboardView {...props} />;
      case 'inst1': return <ValidationView {...props} />;
      case 'inst2': return <InterviewView {...props} />;
      case 'inst3': return <ObservasiView {...props} />;
      case 'inst4': return <TaskAnalysisView {...props} />;
      case 'inst5': return <EvaluationView {...props} />;
      case 'analytics': return <AnalyticsView />;
      default: return <DashboardView {...props} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 transition-all duration-300">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/50">
            <span className="font-bold text-xl">D</span>
          </div>
          <div className="ml-3 hidden lg:block">
            <h1 className="font-bold text-lg leading-tight">DBR Portal</h1>
            <p className="text-xs text-slate-400">Research Mgmt</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          
          <div className="pt-4 pb-2 px-3 hidden lg:block">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instrumen Riset</p>
          </div>

          <SidebarItem 
            icon={<ClipboardCheck size={20} />} 
            label="1. Validasi Pakar" 
            active={activeTab === 'inst1'} 
            onClick={() => setActiveTab('inst1')} 
          />
          <SidebarItem 
            icon={<MessageSquare size={20} />} 
            label="2. Wawancara Klinis" 
            active={activeTab === 'inst2'} 
            onClick={() => setActiveTab('inst2')} 
          />
          <SidebarItem 
            icon={<FileEdit size={20} />} 
            label="3. Catatan Lapangan" 
            active={activeTab === 'inst3'} 
            onClick={() => setActiveTab('inst3')} 
          />
          <SidebarItem 
            icon={<BarChart2 size={20} />} 
            label="4. Analisis Tugas" 
            active={activeTab === 'inst4'} 
            onClick={() => setActiveTab('inst4')} 
          />
          <SidebarItem 
            icon={<CheckSquare size={20} />} 
            label="5. Rubrik Evaluasi" 
            active={activeTab === 'inst5'} 
            onClick={() => setActiveTab('inst5')} 
          />

          <div className="pt-4 pb-2 px-3 hidden lg:block">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advanced</p>
          </div>
          
          <SidebarItem 
            icon={<BrainCircuit size={20} />} 
            label="Analisis AI (Python)" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center lg:justify-start w-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="ml-3 hidden lg:block text-sm font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Overview'}
              {activeTab === 'inst1' && 'Instrumen 1: Validasi'}
              {activeTab === 'inst2' && 'Instrumen 2: Wawancara'}
              {activeTab === 'inst3' && 'Instrumen 3: Observasi'}
              {activeTab === 'inst4' && 'Instrumen 4: Analisis Tugas'}
              {activeTab === 'inst5' && 'Instrumen 5: Evaluasi'}
              {activeTab === 'analytics' && 'Analisis Lanjutan (Python)'}
            </h2>
            <p className="text-sm text-slate-500">
              {user?.email || 'Peneliti'} • {isDemoMode ? 'Offline Mode' : 'Online'}
            </p>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'researcher'}`} alt="Avatar" />
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
        {icon}
      </div>
      <span className={`ml-3 text-sm font-medium hidden lg:block ${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
        {label}
      </span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full hidden lg:block"></div>}
    </button>
  );
}
