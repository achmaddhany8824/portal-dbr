import React, { useState, useEffect } from 'react';
import { Database, FileEdit, ClipboardCheck, BarChart2, MessageSquare, AlertTriangle, CheckSquare } from 'lucide-react';
import { getCounts } from '../services/dataService';

interface DashboardViewProps {
  user: any;
  isDemoMode: boolean;
  appId: string;
}

export default function DashboardView({ user, isDemoMode, appId }: DashboardViewProps) {
  const [counts, setCounts] = useState({
    observations: 0,
    validations: 0,
    taskAnalyses: 0,
    interviews: 0,
    evaluations: 0
  });

  useEffect(() => {
    if (isDemoMode) {
      setCounts({
        observations: 1, // Demo data
        validations: 0,
        taskAnalyses: 0,
        interviews: 0,
        evaluations: 0
      });
      return;
    }

    if (!user) return;

    const fetchCounts = async () => {
      try {
        const data = await getCounts();
        setCounts(data);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };

    fetchCounts();
  }, [user, isDemoMode, appId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Portal Manajemen Data DBR</h1>
          <p className="text-blue-100 max-w-2xl">
            Sistem terintegrasi untuk mengelola Instrumen Penelitian MFL & CMR.
          </p>
        </div>
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
      </div>

      {isDemoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-sm">Mode Demo / Offline</h3>
            <p className="text-xs mt-1 opacity-90">
              Aplikasi berjalan tanpa koneksi Firebase (API Key tidak ditemukan). Data yang Anda input hanya tersimpan sementara di memori browser dan akan hilang saat refresh.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDemoMode ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
            <Database size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Status Database</h3>
          <p className="text-sm text-slate-500 mb-4">
            {isDemoMode ? 'Penyimpanan Lokal (Sementara)' : 'Terhubung (Supabase)'}
          </p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">ID Sesi:</span>
            <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{user?.id?.substring(0,8)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4">
            <FileEdit size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Total Observasi</h3>
          <p className="text-sm text-slate-500 mb-4">Data ALT yang direkam di kelas.</p>
          <div className="text-3xl font-bold text-slate-800">{counts.observations} <span className="text-base font-normal text-slate-500">Catatan</span></div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <ClipboardCheck size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Validasi Pakar</h3>
          <p className="text-sm text-slate-500 mb-4">Reviewer yang telah menilai.</p>
          <div className="text-3xl font-bold text-slate-800">{counts.validations} <span className="text-base font-normal text-slate-500">Orang</span></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4">
            <BarChart2 size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Analisis Tugas</h3>
          <p className="text-sm text-slate-500 mb-4">Rekapitulasi LKS siswa.</p>
          <div className="text-3xl font-bold text-slate-800">{counts.taskAnalyses} <span className="text-base font-normal text-slate-500">Sesi</span></div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
            <MessageSquare size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Wawancara</h3>
          <p className="text-sm text-slate-500 mb-4">Transkrip wawancara klinis.</p>
          <div className="text-3xl font-bold text-slate-800">{counts.interviews} <span className="text-base font-normal text-slate-500">Sesi</span></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <CheckSquare size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-1">Evaluasi CMR</h3>
          <p className="text-sm text-slate-500 mb-4">Skor Pre-Test & Post-Test.</p>
          <div className="text-3xl font-bold text-slate-800">{counts.evaluations} <span className="text-base font-normal text-slate-500">Nilai</span></div>
        </div>
      </div>
    </div>
  );
}
