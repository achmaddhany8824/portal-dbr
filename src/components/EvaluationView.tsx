import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { CheckSquare, Plus, Save, Loader2, ChevronLeft, AlertTriangle, ChevronDown, Info } from 'lucide-react';
import { EvaluationSession } from '../types';

interface EvaluationViewProps {
  user: any;
  db: any;
  isDemoMode: boolean;
  appId: string;
}

export default function EvaluationView({ user, db, isDemoMode, appId }: EvaluationViewProps) {
  const [evaluations, setEvaluations] = useState<EvaluationSession[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [isSaving, setIsSaving] = useState(false);
  const [showRubric, setShowRubric] = useState(false);
  
  const [formData, setFormData] = useState<Partial<EvaluationSession>>({
    studentId: '',
    testType: 'pre-test',
    questionId: '',
    scores: {
      mathFoundation: 0,
      plausibility: 0,
      novelty: 0
    },
    notes: ''
  });

  const rubricGuidelines = [
    {
      title: "1. Mathematical Foundation (Fondasi Matematika)",
      scores: [
        { score: 0, desc: "Tidak ada perhitungan matematis, atau menggunakan prinsip matematika yang sama sekali salah." },
        { score: 1, desc: "Menggunakan konsep matematika dasar yang relevan, tetapi terdapat banyak kesalahan prosedural/kalkulasi yang fatal." },
        { score: 2, desc: "Perhitungan matematis sebagian besar benar, konsep yang digunakan tepat (misal: rasio, PLSV), namun ada sedikit kesalahan minor (selip hitung)." },
        { score: 3, desc: "Menggunakan prinsip matematika yang sangat tepat, perhitungan akurat 100%, dan terhubung erat dengan konteks finansial masalah." }
      ]
    },
    {
      title: "2. Plausibility (Masuk Akal / Logis)",
      scores: [
        { score: 0, desc: "Tidak ada argumen, sekadar menebak, atau argumen sama sekali tidak logis / tidak nyambung dengan soal." },
        { score: 1, desc: "Memberikan alasan, tetapi argumennya lemah, berbasis intuisi semata, atau tidak didukung oleh hasil perhitungan matematis di atasnya." },
        { score: 2, desc: "Memberikan argumen yang logis dan didukung oleh data/perhitungan matematis, tetapi penjelasannya kurang tuntas/kurang mendalam." },
        { score: 3, desc: "Memberikan argumen yang sangat kuat, sangat logis, mampu menjelaskan mengapa keputusan finansial tersebut diambil secara eksplisit berdasarkan bukti perhitungan." }
      ]
    },
    {
      title: "3. Novelty (Kebaruan / Fleksibilitas)",
      scores: [
        { score: 0, desc: "Algorithmic Reasoning murni. Siswa hanya menggunakan rumus kaku yang dihafal tanpa memahami maknanya, atau terpaku buta pada satu cara yang panjang." },
        { score: 1, desc: "Mencoba memodifikasi strategi/rumus, tetapi arahnya salah sehingga penyelesaian menjadi buntu." },
        { score: 2, desc: "Menunjukkan strategi mandiri yang benar (tidak hanya menghafal), namun langkahnya masih sangat panjang/konvensional." },
        { score: 3, desc: "Creative Reasoning. Siswa memunculkan strategi penyelesaian yang orisinal, efisien, inovatif, atau menggunakan representasi (gambar/tabel/pola) yang di luar dugaan namun terbukti benar." }
      ]
    }
  ];

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    if (isDemoMode || !db) {
      // Demo Data could be added here if needed
      return;
    }

    const evalRef = collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations');
    const q = query(evalRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EvaluationSession));
      data.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
          return timeB - timeA;
      });
      setEvaluations(data);
    });

    return () => unsubscribe();
  }, [user, isDemoMode, db, appId]);

  const calculateTotal = (scores: { mathFoundation: number, plausibility: number, novelty: number }) => {
    return (scores.mathFoundation || 0) + (scores.plausibility || 0) + (scores.novelty || 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    const totalScore = calculateTotal(formData.scores as any);

    const newSession: EvaluationSession = {
      id: `eval-${Date.now()}`,
      studentId: formData.studentId || '',
      testType: formData.testType as 'pre-test' | 'post-test',
      questionId: formData.questionId || '',
      scores: formData.scores as any,
      totalScore,
      notes: formData.notes || '',
      createdAt: Date.now()
    };

    if (isDemoMode || !db) {
      setEvaluations(prev => [newSession, ...prev]);
      setIsSaving(false);
      setViewMode('list');
      setFormData({
        studentId: '',
        testType: 'pre-test',
        questionId: '',
        scores: { mathFoundation: 0, plausibility: 0, novelty: 0 },
        notes: ''
      });
      return;
    }

    try {
      const evalRef = collection(db, 'artifacts', appId, 'users', user.uid, 'evaluations');
      const { id, ...data } = newSession;
      await addDoc(evalRef, {
        ...data,
        createdAt: serverTimestamp()
      });
      setViewMode('list');
      setFormData({
        studentId: '',
        testType: 'pre-test',
        questionId: '',
        scores: { mathFoundation: 0, plausibility: 0, novelty: 0 },
        notes: ''
      });
    } catch (error) {
      console.error("Gagal menyimpan evaluasi:", error);
      alert("Gagal menyimpan ke database.");
    }
    setIsSaving(false);
  };

  const ScoreInput = ({ label, field, desc }: { label: string, field: 'mathFoundation' | 'plausibility' | 'novelty', desc: string }) => (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <label className="block text-sm font-bold text-slate-800">{label}</label>
          <p className="text-xs text-slate-500 mt-1">{desc}</p>
        </div>
        <span className="text-2xl font-bold text-blue-600">{formData.scores?.[field]}</span>
      </div>
      <div className="flex gap-2 mt-3">
        {[0, 1, 2, 3].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => setFormData({
              ...formData,
              scores: { ...formData.scores!, [field]: score }
            })}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              formData.scores?.[field] === score
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-blue-50'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-400 flex justify-between px-1">
        <span>0: Tidak Ada</span>
        <span>3: Sangat Baik</span>
      </div>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Rubrik Evaluasi MFL & CMR</h2>
            <p className="text-slate-500">Penilaian Pre-Test & Post-Test berdasarkan indikator CMR.</p>
          </div>
          <button 
            onClick={() => setViewMode('form')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center font-medium transition-colors"
          >
            <Plus size={18} className="mr-2" /> Input Nilai Baru
          </button>
        </div>

        <div className="grid gap-4">
          {evaluations.map((ev) => (
            <div key={ev.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ev.testType === 'pre-test' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <CheckSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{ev.studentId}</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold">{ev.testType} • {ev.questionId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-blue-600">{ev.totalScore}</span>
                  <span className="text-xs text-slate-400 block">/ 9 Poin</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 p-2 rounded text-center">
                  <span className="block text-xs text-slate-400 uppercase">Math Found.</span>
                  <span className="font-bold text-slate-700">{ev.scores.mathFoundation}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center">
                  <span className="block text-xs text-slate-400 uppercase">Plausibility</span>
                  <span className="font-bold text-slate-700">{ev.scores.plausibility}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded text-center">
                  <span className="block text-xs text-slate-400 uppercase">Novelty</span>
                  <span className="font-bold text-slate-700">{ev.scores.novelty}</span>
                </div>
              </div>

              {ev.notes && (
                <div className="text-sm text-slate-600 italic border-t border-slate-50 pt-3">
                  "{ev.notes}"
                </div>
              )}
            </div>
          ))}
          
          {evaluations.length === 0 && (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <CheckSquare size={48} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada data evaluasi.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-right duration-300">
      <button 
        onClick={() => setViewMode('list')}
        className="flex items-center text-slate-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ChevronLeft size={20} className="mr-1" /> Kembali ke Daftar
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 text-center uppercase tracking-wide">Input Penilaian CMR</h2>
          <p className="text-center text-slate-500 text-sm mt-2">Skor Maksimal: 9 Poin (3 Indikator x 3 Poin)</p>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          {/* Identitas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kode Siswa</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.studentId}
                onChange={e => setFormData({...formData, studentId: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Tes</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.testType}
                onChange={e => setFormData({...formData, testType: e.target.value as any})}
              >
                <option value="pre-test">Pre-Test</option>
                <option value="post-test">Post-Test</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Topik / ID Soal</label>
              <input 
                type="text" 
                required
                placeholder="Contoh: Soal 1 (Diskon)"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.questionId}
                onChange={e => setFormData({...formData, questionId: e.target.value})}
              />
            </div>
          </div>

          {/* Rubric Guidelines Toggle */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 overflow-hidden">
            <button 
              type="button"
              onClick={() => setShowRubric(!showRubric)}
              className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-2 text-blue-800 font-bold">
                <Info size={20} />
                <span>Panduan Penilaian (Rubrik)</span>
              </div>
              <ChevronDown size={20} className={`transform transition-transform text-blue-600 ${showRubric ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            
            {showRubric && (
              <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-300 border-t border-blue-100">
                {rubricGuidelines.map((guide, idx) => (
                  <div key={idx}>
                    <h4 className="font-bold text-blue-900 mb-2 text-sm">{guide.title}</h4>
                    <ul className="space-y-2">
                      {guide.scores.map((s) => (
                        <li key={s.score} className="flex gap-3 text-sm text-blue-800">
                          <span className="font-bold min-w-[20px] bg-white px-2 rounded text-center border border-blue-100">{s.score}</span>
                          <span>{s.desc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scoring */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Indikator Penilaian (CMR)</h3>
            
            <ScoreInput 
              label="1. Mathematical Foundation" 
              field="mathFoundation" 
              desc="Apakah argumen didasarkan pada sifat/konsep matematika yang benar?" 
            />
            
            <ScoreInput 
              label="2. Plausibility (Kelogisan)" 
              field="plausibility" 
              desc="Apakah argumen masuk akal dan didukung bukti perhitungan?" 
            />
            
            <ScoreInput 
              label="3. Novelty (Kebaruan)" 
              field="novelty" 
              desc="Apakah siswa memunculkan strategi baru/efisien (bukan sekadar meniru rumus)?" 
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Catatan / Bukti Jawaban</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Kutipan jawaban siswa atau alasan pemberian skor..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl flex items-center shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
              Simpan Nilai
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
