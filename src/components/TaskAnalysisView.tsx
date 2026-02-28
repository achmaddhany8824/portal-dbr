import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { Plus, Save, Loader2, BarChart2, ChevronLeft, AlertTriangle } from 'lucide-react';
import { TaskAnalysisSession, TaskActivity } from '../types';

interface TaskAnalysisViewProps {
  user: any;
  db: any;
  isDemoMode: boolean;
  appId: string;
}

export default function TaskAnalysisView({ user, db, isDemoMode, appId }: TaskAnalysisViewProps) {
  const [taskAnalyses, setTaskAnalyses] = useState<TaskAnalysisSession[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<TaskAnalysisSession>>({
    totalStudents: 0,
    results: {},
    qualitativeAnalysis: []
  });

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    if (isDemoMode || !db) {
      if (taskAnalyses.length === 0) {
        setTaskAnalyses([]);
      }
      return;
    }

    const taskRef = collection(db, 'artifacts', appId, 'users', user.uid, 'task_analyses');
    const q = query(taskRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskAnalysisSession));
      data.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
          return timeB - timeA;
      });
      setTaskAnalyses(data);
    });

    return () => unsubscribe();
  }, [user, isDemoMode, db, appId]);

  const activities: TaskActivity[] = [
    { id: 'p1-a1', pertemuan: 1, name: 'Aktivitas 1 (The Auditor)', indicator: 'Mampu menemukan baris mutasi yang salah menggunakan aturan operasi bilangan bulat (+/-).' },
    { id: 'p1-a2', pertemuan: 1, name: 'Aktivitas 2 (Promo Hunter)', indicator: 'Mampu membandingkan rasio persentase vs diskon nominal untuk menentukan harga riil termurah.' },
    { id: 'p1-a3', pertemuan: 1, name: 'Keputusan (Tunai vs PayLater)', indicator: 'Mampu memberikan argumen logis (Plausibility) menolak PayLater karena adanya hidden fee (bunga).' },
    { id: 'p2-a1', pertemuan: 2, name: 'Aktivitas 1 (Time Traveler)', indicator: 'Mampu merumuskan pola bilangan/eksponen dari kenaikan harga akibat inflasi.' },
    { id: 'p2-a2', pertemuan: 2, name: 'Aktivitas 2 (Inflation Impact)', indicator: 'Mampu menghitung secara bertahap (bunga majemuk), tidak terjebak pada perhitungan bunga tunggal.' },
    { id: 'p2-a3', pertemuan: 2, name: 'Pesan Finansial (Celengan)', indicator: 'Mampu berargumen bahwa nilai riil/daya beli uang di celengan menyusut (Math Foundation).' },
    { id: 'p3-a1', pertemuan: 3, name: 'Aktivitas 1 (Tax Consultant)', indicator: 'Mampu memisalkan komponen pajak dengan variabel x dan menyelesaikan persamaan (PLSV) dengan tepat.' },
    { id: 'p3-a2', pertemuan: 3, name: 'Aktivitas 2 (Stock Analyst)', indicator: 'Mampu menggabungkan nilai Capital Gain dan Dividen untuk menghitung total persentase keuntungan aset.' },
    { id: 'p3-a3', pertemuan: 3, name: 'Pesan Manager (Kewajiban)', indicator: 'Mampu menyimpulkan argumen tentang keseimbangan bayar pajak (kewajiban) dan investasi (kekayaan).' },
    { id: 'p4-a1', pertemuan: 4, name: 'Aktivitas 1 (Risk Profiling)', indicator: 'Mampu menghitung Range (jangkauan data) dan menyimpulkan tingkat risiko volatilitas aset tersebut.' },
    { id: 'p4-a2', pertemuan: 4, name: 'Aktivitas 2 (Portfolio Mgr)', indicator: 'Mampu menghitung Worst-Case Scenario dan menolak strategi All-in (menghindari Greedy Algorithm).' },
  ];

  const getSuccessCategory = (percentage: number) => {
    if (percentage >= 81) return { label: 'Sangat Baik', color: 'text-emerald-600 bg-emerald-50' };
    if (percentage >= 61) return { label: 'Baik', color: 'text-blue-600 bg-blue-50' };
    if (percentage >= 41) return { label: 'Cukup', color: 'text-amber-600 bg-amber-50' };
    return { label: 'Kurang', color: 'text-red-600 bg-red-50' };
  };

  const handleSaveTaskAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.totalStudents || formData.totalStudents <= 0) {
      alert("Jumlah total siswa harus diisi.");
      return;
    }

    setIsSaving(true);

    const newSession: TaskAnalysisSession = {
      id: `task-${Date.now()}`,
      totalStudents: formData.totalStudents,
      results: formData.results || {},
      qualitativeAnalysis: formData.qualitativeAnalysis || [],
      createdAt: Date.now()
    };

    if (isDemoMode || !db) {
      setTaskAnalyses(prev => [newSession, ...prev]);
      setIsSaving(false);
      setViewMode('list');
      setFormData({ totalStudents: 0, results: {}, qualitativeAnalysis: [] });
      return;
    }

    try {
      const taskRef = collection(db, 'artifacts', appId, 'users', user.uid, 'task_analyses');
      const { id, ...data } = newSession;
      await addDoc(taskRef, {
        ...data,
        createdAt: serverTimestamp()
      });
      setViewMode('list');
      setFormData({ totalStudents: 0, results: {}, qualitativeAnalysis: [] });
    } catch (error) {
      console.error("Gagal menyimpan analisis tugas:", error);
      alert("Gagal menyimpan ke database.");
    }
    setIsSaving(false);
  };

  const handleQualitativeChange = (activityId: string, field: 'findings' | 'recommendation', value: string) => {
    const currentAnalysis = formData.qualitativeAnalysis || [];
    const existingIndex = currentAnalysis.findIndex(q => q.activityId === activityId);
    
    let newAnalysis = [...currentAnalysis];
    if (existingIndex >= 0) {
      newAnalysis[existingIndex] = { ...newAnalysis[existingIndex], [field]: value };
    } else {
      newAnalysis.push({ 
        activityId, 
        findings: field === 'findings' ? value : '', 
        recommendation: field === 'recommendation' ? value : '' 
      });
    }
    setFormData({ ...formData, qualitativeAnalysis: newAnalysis });
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Matriks Analisis Tugas</h2>
            <p className="text-slate-500">Retrospective Analysis (Analisis Kuantitatif LKS).</p>
          </div>
          <button 
            onClick={() => setViewMode('form')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center font-medium transition-colors"
          >
            <Plus size={18} className="mr-2" /> Input Analisis Baru
          </button>
        </div>

        <div className="grid gap-6">
          {taskAnalyses.map((analysis) => (
            <div key={analysis.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Analisis LKS</h3>
                  <p className="text-sm text-slate-500">Total Siswa: {analysis.totalStudents}</p>
                </div>
                <span className="text-xs text-slate-400">{new Date(analysis.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2">Aktivitas</th>
                      <th className="px-4 py-2 text-center">Berhasil</th>
                      <th className="px-4 py-2 text-center">%</th>
                      <th className="px-4 py-2 text-center">Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activities.map(act => {
                      const successCount = analysis.results[act.id] || 0;
                      const percentage = Math.round((successCount / analysis.totalStudents) * 100);
                      const category = getSuccessCategory(percentage);
                      return (
                        <tr key={act.id}>
                          <td className="px-4 py-2 font-medium text-slate-700">{act.name}</td>
                          <td className="px-4 py-2 text-center">{successCount}</td>
                          <td className="px-4 py-2 text-center font-bold">{percentage}%</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${category.color}`}>
                              {category.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {analysis.qualitativeAnalysis && analysis.qualitativeAnalysis.length > 0 && (
                <div className="mt-6 bg-slate-50 p-4 rounded-xl">
                  <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase">Analisis Deviasi Kualitatif</h4>
                  <div className="space-y-4">
                    {analysis.qualitativeAnalysis.map((qa, idx) => {
                      const actName = activities.find(a => a.id === qa.activityId)?.name || qa.activityId;
                      return (
                        <div key={idx} className="border-l-4 border-amber-400 pl-4">
                          <p className="font-bold text-sm text-slate-800">{actName}</p>
                          <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Temuan:</span> {qa.findings}</p>
                          <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Saran:</span> {qa.recommendation}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {taskAnalyses.length === 0 && (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <BarChart2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada data analisis tugas.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in slide-in-from-right duration-300">
      <button 
        onClick={() => setViewMode('list')}
        className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ChevronLeft size={20} className="mr-1" /> Kembali ke Daftar
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 text-center uppercase tracking-wide">Matriks Analisis Tugas (Task-Oriented Analysis)</h2>
          <p className="text-center text-slate-500 text-sm mt-2">Retrospective Analysis (Analisis Kuantitatif LKS)</p>
        </div>

        <form onSubmit={handleSaveTaskAnalysis} className="p-8 space-y-8">
          {/* Info Umum */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Total Siswa/Kelompok</label>
            <input 
              type="number" 
              min="1"
              required
              className="w-full md:w-1/3 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.totalStudents || ''}
              onChange={e => setFormData({...formData, totalStudents: parseInt(e.target.value) || 0})}
            />
          </div>

          {/* Tabel Input */}
          <div>
            <h3 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">B. Tabel Rekapitulasi Kuantitatif</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Pertemuan & Aktivitas</th>
                    <th className="px-4 py-3 w-1/3">Indikator Keberhasilan</th>
                    <th className="px-4 py-3 text-center w-32">Jml. Berhasil</th>
                    <th className="px-4 py-3 text-center w-24">Persentase</th>
                    <th className="px-4 py-3 text-center w-32 rounded-tr-lg">Kategori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.map((act) => {
                    const successCount = formData.results?.[act.id] || 0;
                    const total = formData.totalStudents || 1; // avoid div by zero
                    const percentage = Math.round((successCount / total) * 100);
                    const category = getSuccessCategory(percentage);
                    
                    return (
                      <tr key={act.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 align-top">
                          <span className="text-xs font-bold text-indigo-600 block mb-1">Pertemuan {act.pertemuan}</span>
                          <span className="font-medium text-slate-800">{act.name}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 align-top">{act.indicator}</td>
                        <td className="px-4 py-3 align-top">
                          <input 
                            type="number" 
                            min="0"
                            max={formData.totalStudents}
                            className="w-full px-2 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.results?.[act.id] || ''}
                            onChange={e => {
                              const val = Math.min(parseInt(e.target.value) || 0, formData.totalStudents || 0);
                              setFormData({
                                ...formData,
                                results: { ...formData.results, [act.id]: val }
                              });
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-bold align-top">
                          {formData.totalStudents ? `${percentage}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center align-top">
                          {formData.totalStudents ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${category.color}`}>
                              {category.label}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analisis Kualitatif */}
          <div>
            <h3 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">C. Analisis Deviasi Kualitatif</h3>
            <p className="text-sm text-slate-500 mb-4">Wajib diisi untuk aktivitas dengan persentase keberhasilan &lt; 60% (Kategori Cukup/Kurang).</p>
            
            <div className="space-y-6">
              {activities.map(act => {
                const successCount = formData.results?.[act.id] || 0;
                const total = formData.totalStudents || 1;
                const percentage = Math.round((successCount / total) * 100);
                
                // Show input only if percentage < 60 AND totalStudents is set
                if (!formData.totalStudents || percentage >= 60) return null;

                const qa = formData.qualitativeAnalysis?.find(q => q.activityId === act.id) || { findings: '', recommendation: '' };

                return (
                  <div key={act.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold">
                      <AlertTriangle size={18} />
                      {act.name} ({percentage}% - {getSuccessCategory(percentage).label})
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Temuan Analisis Kesalahan Siswa</label>
                        <textarea 
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                          placeholder="Contoh: Mayoritas siswa salah mengalikan..."
                          value={qa.findings}
                          onChange={e => handleQualitativeChange(act.id, 'findings', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Saran Perbaikan Desain</label>
                        <textarea 
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                          placeholder="Contoh: Perlu ditambahkan scaffolding..."
                          value={qa.recommendation}
                          onChange={e => handleQualitativeChange(act.id, 'recommendation', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl flex items-center shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
              Simpan Analisis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
