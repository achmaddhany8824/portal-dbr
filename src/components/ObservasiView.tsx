import React, { useState, useEffect } from 'react';
import { Plus, Save, Loader2, Database } from 'lucide-react';
import { Observation } from '../types';
import { getObservations, createObservation } from '../services/dataService';

interface ObservasiViewProps {
  user: any;
  isDemoMode: boolean;
  appId: string;
}

export default function ObservasiView({ user, isDemoMode, appId }: ObservasiViewProps) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    pertemuan: '1',
    waktu: '',
    aktivitas: '',
    hlt: '',
    alt: ''
  });

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      if (observations.length === 0) {
        setObservations([
          {
            id: 'demo-1',
            pertemuan: '1',
            waktu: '10:00',
            aktivitas: 'Diskusi Kelompok',
            hlt: 'Siswa menggunakan media visual',
            alt: 'Siswa lebih suka berhitung langsung',
            createdAt: Date.now()
          }
        ]);
      }
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getObservations();
        setObservations(data);
      } catch (error) {
        console.error("Error fetching observations:", error);
      }
    };

    fetchData();
  }, [user, isDemoMode, appId]);

  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.waktu || !formData.alt) return;

    setIsSaving(true);
    
    if (isDemoMode) {
      const newObs: Observation = {
        id: `local-${Date.now()}`,
        ...formData,
        createdAt: Date.now()
      };
      setObservations(prev => [newObs, ...prev]);
      
      setFormData({
        pertemuan: formData.pertemuan,
        waktu: '',
        aktivitas: '',
        hlt: '',
        alt: ''
      });
      setIsSaving(false);
      return;
    }

    try {
      const newObs = await createObservation(formData);
      setObservations(prev => [newObs, ...prev]);
      setFormData({
        pertemuan: formData.pertemuan,
        waktu: '',
        aktivitas: '',
        hlt: '',
        alt: ''
      });
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("Gagal menyimpan ke database cloud.");
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lembar Observasi Kelas</h2>
          <p className="text-slate-500">Rekam momen kritis ALT (Actual Learning Trajectory) secara real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Input */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit sticky top-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Plus size={18} className="mr-2"/> Input Catatan Baru</h3>
          <form onSubmit={handleSaveObservation} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pertemuan</label>
              <select 
                value={formData.pertemuan}
                onChange={(e) => setFormData({...formData, pertemuan: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="1">1 (The Auditor)</option>
                <option value="2">2 (Time & Money)</option>
                <option value="3">3 (Wealth & Obligation)</option>
                <option value="4">4 (Risk Management)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Waktu / Timecode Video *</label>
              <input 
                type="text" 
                required
                placeholder="Misal: 14:20" 
                value={formData.waktu}
                onChange={(e) => setFormData({...formData, waktu: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target HLT (Conjecture)</label>
              <textarea 
                placeholder="Dugaan yang sedang diamati..." 
                value={formData.hlt}
                onChange={(e) => setFormData({...formData, hlt: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kenyataan (ALT) & Kutipan *</label>
              <textarea 
                required
                placeholder="Catat ucapan/perilaku aktual siswa di sini..." 
                value={formData.alt}
                onChange={(e) => setFormData({...formData, alt: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-28"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSaving}
              className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${isDemoMode ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="mr-2" />}
              {isSaving ? 'Menyimpan...' : (isDemoMode ? 'Simpan (Lokal)' : 'Simpan ke Database')}
            </button>
          </form>
        </div>

        {/* Daftar Data Tersimpan */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Arsip Catatan Lapangan</h3>
              <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-full">{observations.length} Entri</span>
            </div>
            <div className="p-0 max-h-[600px] overflow-y-auto">
              {observations.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                  <Database size={32} className="mb-2 text-slate-300" />
                  <p>Belum ada data observasi tersimpan.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {observations.map((obs) => (
                    <li key={obs.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                          Pertemuan {obs.pertemuan}
                        </span>
                        <span className="text-xs font-mono text-slate-400 font-semibold bg-slate-100 px-2 py-1 rounded">
                          {obs.waktu}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Dugaan HLT</p>
                          <p className="text-sm text-slate-700">{obs.hlt || '-'}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <p className="text-xs font-bold text-blue-600 uppercase mb-1">Kenyataan (ALT)</p>
                          <p className="text-sm text-slate-800 font-medium">{obs.alt}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
