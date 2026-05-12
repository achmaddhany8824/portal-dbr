import React, { useState, useEffect } from 'react';
import { Plus, Save, Loader2, MessageSquare, ChevronLeft, User } from 'lucide-react';
import { InterviewSession } from '../types';
import { getInterviewSessions, createInterviewSession } from '../services/dataService';

interface InterviewViewProps {
  user: any;
  isDemoMode: boolean;
  appId: string;
}

export default function InterviewView({ user, isDemoMode, appId }: InterviewViewProps) {
  const [interviews, setInterviews] = useState<InterviewSession[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<InterviewSession>>({
    studentCode: '',
    date: new Date().toISOString().split('T')[0],
    topic: 'Pertemuan 1',
    criticalMoments: '',
    hltAlignment: 'sesuai',
    deviationNote: '',
    notes: ''
  });

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    if (isDemoMode) {
      if (interviews.length === 0) {
        setInterviews([]);
      }
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getInterviewSessions();
        setInterviews(data);
      } catch (error) {
        console.error("Error fetching interviews:", error);
      }
    };

    fetchData();
  }, [user, isDemoMode, appId]);

  const getQuestions = (topic: string) => {
    switch (topic) {
      case 'Pertemuan 1':
        return [
          "1. Bagaimana kalian menggunakan aturan bilangan bulat positif (pemasukan) dan negatif (pengeluaran) untuk menemukan baris mutasi yang salah?",
          "2. Tolong jelaskan langkah perhitungan kalian saat membandingkan biaya akhir menggunakan Promo Diskon dibanding metode pembayaran lain.",
          "3. (Plausibility) Di soal essay pengambilan keputusan, kalian memilih [Tunai / PayLater]. Apa argumen matematis yang kalian gunakan? Apakah kalian menemukan ada biaya tersembunyi?",
          "4. (Novelty) Apakah ada cara yang lebih cepat untuk memperkirakan mana yang lebih murah tanpa harus menghitung harga akhirnya sampai rupiah terkecil?"
        ];
      case 'Pertemuan 2':
        return [
          "1. Pola perkalian atau pangkat seperti apa yang kalian temukan dari tahun ke tahun pada tabel Time Traveler?",
          "2. Mengapa inflasi dihitung bertahap dari harga tahun sebelumnya (bunga majemuk), bukan langsung dari harga awal?",
          "3. (Plausibility) Coba buktikan secara matematis, apa maksudnya 'merugi' menabung di celengan padahal jumlah lembaran uang tidak berkurang?"
        ];
      case 'Pertemuan 3':
        return [
          "1. Di aktivitas pajak, variabel x ini mewakili besaran apa dalam kehidupan nyata?",
          "2. Saat memecahkan persamaan (PLSV) pajak, apa prinsip matematika yang kalian pakai?",
          "3. (Novelty) Bagaimana cara kalian menggabungkan Capital Gain dan Dividen menjadi satu persentase keuntungan total?",
          "4. (Plausibility) Mengapa membayar kewajiban (pajak) dan mendapatkan passive income (dividen) sama-sama penting?"
        ];
      case 'Pertemuan 4':
        return [
          "1. Bagaimana angka Range membantu kalian menilai apakah suatu instrumen cocok untuk orang yang takut rugi?",
          "2. (Average Fallacy) Aset ini rata-rata untung 10%. Apakah jaminan pasti untung 10% tahun depan? Coba bantah/setujui dengan data volatilitas.",
          "3. (Greedy Algorithm) Kenapa tidak 'All-in' saja ke aset dengan potensi untung terbesar? Tunjukkan hitungan Worst-Case Scenario kalian."
        ];
      default:
        return [];
    }
  };

  const handleSaveInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.studentCode) return;

    setIsSaving(true);

    const newSession: InterviewSession = {
      id: `int-${Date.now()}`,
      studentCode: formData.studentCode || '',
      date: formData.date || '',
      topic: formData.topic || 'Pertemuan 1',
      criticalMoments: formData.criticalMoments || '',
      hltAlignment: formData.hltAlignment as any,
      deviationNote: formData.deviationNote || '',
      notes: formData.notes || '',
      createdAt: Date.now()
    };

    if (isDemoMode) {
      setInterviews(prev => [newSession, ...prev]);
      setIsSaving(false);
      setViewMode('list');
      setFormData({
        studentCode: '',
        date: new Date().toISOString().split('T')[0],
        topic: 'Pertemuan 1',
        criticalMoments: '',
        hltAlignment: 'sesuai',
        deviationNote: '',
        notes: ''
      });
      return;
    }

    try {
      const { id, ...data } = newSession;
      const savedSession = await createInterviewSession(data);
      setInterviews(prev => [savedSession, ...prev]);
      setViewMode('list');
      setFormData({
        studentCode: '',
        date: new Date().toISOString().split('T')[0],
        topic: 'Pertemuan 1',
        criticalMoments: '',
        hltAlignment: 'sesuai',
        deviationNote: '',
        notes: ''
      });
    } catch (error) {
      console.error("Gagal menyimpan wawancara:", error);
      alert("Gagal menyimpan ke database.");
    }
    setIsSaving(false);
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Wawancara Klinis</h2>
            <p className="text-slate-500">Dokumentasi wawancara semi-terstruktur (MFL & CMR).</p>
          </div>
          <button 
            onClick={() => setViewMode('form')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center font-medium transition-colors"
          >
            <Plus size={18} className="mr-2" /> Input Wawancara
          </button>
        </div>

        <div className="grid gap-6">
          {interviews.map((int) => (
            <div key={int.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{int.studentCode}</h3>
                    <p className="text-xs text-slate-500">{int.topic} • {int.date}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  int.hltAlignment === 'sesuai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {int.hltAlignment === 'sesuai' ? 'Sesuai HLT' : 'Deviasi'}
                </span>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Momen Kritis (Bukti CMR)</p>
                <p className="text-sm text-slate-700 italic">"{int.criticalMoments}"</p>
              </div>

              {int.hltAlignment === 'deviasi' && (
                <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-800 border border-amber-100">
                  <span className="font-bold">Catatan Deviasi:</span> {int.deviationNote}
                </div>
              )}
            </div>
          ))}
          
          {interviews.length === 0 && (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada data wawancara.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-right duration-300">
      <button 
        onClick={() => setViewMode('list')}
        className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ChevronLeft size={20} className="mr-1" /> Kembali ke Daftar
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 text-center uppercase tracking-wide">Pedoman Wawancara Klinis</h2>
          <p className="text-center text-slate-500 text-sm mt-2">Fokus: Literasi Finansial Matematis (MFL) & Penalaran Kreatif (CMR)</p>
        </div>

        <form onSubmit={handleSaveInterview} className="p-8 space-y-8">
          {/* Identitas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kode Siswa / Kelompok</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.studentCode}
                onChange={e => setFormData({...formData, studentCode: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Wawancara</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Topik LKS</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.topic}
                onChange={e => setFormData({...formData, topic: e.target.value})}
              >
                <option value="Pertemuan 1">Pertemuan 1 (The Auditor)</option>
                <option value="Pertemuan 2">Pertemuan 2 (Time & Money)</option>
                <option value="Pertemuan 3">Pertemuan 3 (Wealth)</option>
                <option value="Pertemuan 4">Pertemuan 4 (Risk)</option>
              </select>
            </div>
          </div>

          {/* Kisi-Kisi Pertanyaan */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-3 flex items-center">
              <MessageSquare size={18} className="mr-2" />
              Kisi-Kisi Pertanyaan ({formData.topic})
            </h3>
            <ul className="space-y-2 text-sm text-blue-900">
              {getQuestions(formData.topic || 'Pertemuan 1').map((q, idx) => (
                <li key={idx} className="pl-4 -indent-4">{q}</li>
              ))}
            </ul>
            <p className="text-xs text-blue-600 mt-4 italic">*Gunakan sebagai pemantik. Kejar jawaban dengan "Kenapa?" atau "Bagaimana bisa?". Minta siswa menunjuk LKS.</p>
          </div>

          {/* Hasil Wawancara */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Momen Kritis (Bukti CMR)</label>
              <p className="text-xs text-slate-500 mb-2">Catat kutipan langsung ucapan siswa yang menunjukkan Novelty, Plausibility, atau Math Foundation.</p>
              <textarea 
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Contoh: Siswa A berkata 'Saya tidak pakai rumus bunga, tapi saya hitung manual per tahun karena...'"
                value={formData.criticalMoments}
                onChange={e => setFormData({...formData, criticalMoments: e.target.value})}
                required
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-700 mb-3">Kesesuaian dengan Dugaan (HLT)</label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="hltAlignment"
                    value="sesuai"
                    checked={formData.hltAlignment === 'sesuai'}
                    onChange={() => setFormData({...formData, hltAlignment: 'sesuai'})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-slate-700 text-sm">Sesuai dengan Dugaan HLT</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="hltAlignment"
                    value="deviasi"
                    checked={formData.hltAlignment === 'deviasi'}
                    onChange={() => setFormData({...formData, hltAlignment: 'deviasi'})}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-slate-700 text-sm">Terjadi Deviasi / Muncul strategi baru</span>
                </label>
              </div>

              {formData.hltAlignment === 'deviasi' && (
                <div className="mt-3 ml-6 animate-in slide-in-from-top duration-200">
                  <textarea 
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 focus:ring-2 focus:ring-amber-500 outline-none text-sm bg-white"
                    placeholder="Jelaskan mengapa deviasi ini terjadi..."
                    value={formData.deviationNote}
                    onChange={e => setFormData({...formData, deviationNote: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl flex items-center shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
              Simpan Wawancara
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
