import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, serverTimestamp } from 'firebase/firestore';
import { Plus, Save, Loader2, ClipboardCheck, User as UserIcon, ChevronLeft } from 'lucide-react';
import { ValidationSession, ValidationCriteria } from '../types';

interface ValidationViewProps {
  user: any;
  db: any;
  isDemoMode: boolean;
  appId: string;
}

export default function ValidationView({ user, db, isDemoMode, appId }: ValidationViewProps) {
  const [validations, setValidations] = useState<ValidationSession[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ValidationSession>>({
    validatorName: '',
    institution: '',
    date: new Date().toISOString().split('T')[0],
    scores: {},
    comment: '',
    conclusion: 'layak_revisi'
  });

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    if (isDemoMode || !db) {
      if (validations.length === 0) {
        setValidations([]);
      }
      return;
    }

    const valRef = collection(db, 'artifacts', appId, 'users', user.uid, 'validations');
    const q = query(valRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ValidationSession));
      data.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
          return timeB - timeA;
      });
      setValidations(data);
    });

    return () => unsubscribe();
  }, [user, isDemoMode, db, appId]);

  // Default Criteria based on "Desain Pembelajaran Matematika Terintegrasi Literasi Finansial"
  const criteriaList: ValidationCriteria[] = [
    // I. Aspek Konstruksi MFL
    { id: 'c1', category: 'I. Aspek Konstruksi MFL', statement: 'Situasi finansial yang disajikan (diskon, pajak, risiko investasi) otentik, logis, dan sesuai dengan dunia nyata.', score: 0 },
    { id: 'c2', category: 'I. Aspek Konstruksi MFL', statement: 'Konsep matematika (Aritmatika, PLSV, Statistika) yang digunakan relevan untuk memecahkan masalah finansial pada tugas.', score: 0 },
    { id: 'c3', category: 'I. Aspek Konstruksi MFL', statement: 'Tugas menuntut siswa untuk membuat keputusan finansial yang didasarkan pada perhitungan matematis (bukan sekadar menebak).', score: 0 },
    
    // II. Aspek Creative Mathematical Reasoning (CMR)
    { id: 'c4', category: 'II. Aspek CMR', statement: 'Tugas memberikan ruang bagi siswa untuk memunculkan strategi atau cara penyelesaian baru yang tidak sekadar meniru contoh rutin (Novelty).', score: 0 },
    { id: 'c5', category: 'II. Aspek CMR', statement: 'Tugas menstimulasi siswa untuk mampu memberikan argumen yang logis atas strategi atau jawaban yang mereka pilih (Plausibility).', score: 0 },
    { id: 'c6', category: 'II. Aspek CMR', statement: 'Tugas mengarahkan siswa untuk mendasarkan argumen mereka pada sifat/prinsip matematika yang benar (Mathematical Foundation).', score: 0 },

    // III. Aspek Hypothetical Learning Trajectory (HLT)
    { id: 'c7', category: 'III. Aspek HLT', statement: 'Alur pembelajaran tersusun dengan scaffolding yang baik (dari prosedural menuju analitis/evaluatif).', score: 0 },
    { id: 'c8', category: 'III. Aspek HLT', statement: 'Dugaan pemikiran siswa (students\' thinking) yang dituliskan dalam HLT realistis dan sangat mungkin terjadi di kelas VII SMP.', score: 0 },
    { id: 'c9', category: 'III. Aspek HLT', statement: 'Antisipasi/respons guru yang dirancang dalam HLT tepat untuk membimbing siswa tanpa langsung memberikan jawaban akhir.', score: 0 },

    // IV. Aspek Bahasa dan Keterbacaan
    { id: 'c10', category: 'IV. Aspek Bahasa', statement: 'Bahasa, istilah finansial, dan instruksi pada tugas mudah dipahami oleh siswa kelas VII SMP.', score: 0 },
    { id: 'c11', category: 'IV. Aspek Bahasa', statement: 'Grafik, tabel, atau diagram pendukung (misal: grafik volatilitas harga) disajikan dengan jelas dan informatif.', score: 0 },
  ];

  const calculateScore = (scores: Record<string, number>) => {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    const max = values.length * 4; // Max score per item is 4
    return Math.round((sum / max) * 100);
  };

  const handleSaveValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.validatorName) return;

    setIsSaving(true);

    const newSession: ValidationSession = {
      id: `val-${Date.now()}`,
      validatorName: formData.validatorName || '',
      institution: formData.institution || '',
      date: formData.date || '',
      scores: formData.scores || {},
      comment: formData.comment || '',
      conclusion: formData.conclusion as any,
      createdAt: Date.now()
    };

    if (isDemoMode || !db) {
      setValidations(prev => [newSession, ...prev]);
      setIsSaving(false);
      setViewMode('list');
      setFormData({
        validatorName: '',
        institution: '',
        date: new Date().toISOString().split('T')[0],
        scores: {},
        comment: '',
        conclusion: 'layak_revisi'
      });
      return;
    }

    try {
      const valRef = collection(db, 'artifacts', appId, 'users', user.uid, 'validations');
      const { id, ...data } = newSession;
      await addDoc(valRef, {
        ...data,
        createdAt: serverTimestamp()
      });
      setViewMode('list');
      setFormData({
        validatorName: '',
        institution: '',
        date: new Date().toISOString().split('T')[0],
        scores: {},
        comment: '',
        conclusion: 'layak_revisi'
      });
    } catch (error) {
      console.error("Gagal menyimpan validasi:", error);
      alert("Gagal menyimpan ke database.");
    }
    setIsSaving(false);
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Validasi Pakar</h2>
            <p className="text-slate-500">Rekapitulasi penilaian validator terhadap desain HLT.</p>
          </div>
          <button 
            onClick={() => setViewMode('form')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center font-medium transition-colors"
          >
            <Plus size={18} className="mr-2" /> Tambah Validator
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {validations.map((val) => (
            <div key={val.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{val.validatorName}</h3>
                    <p className="text-xs text-slate-500">{val.institution}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold text-blue-600">{calculateScore(val.scores)}%</span>
                  <span className="text-xs text-slate-400">Validitas</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg mb-4 text-sm text-slate-600 italic">
                "{val.comment.length > 60 ? val.comment.substring(0, 60) + '...' : val.comment}"
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">{val.date}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  val.conclusion === 'layak_tanpa_revisi' ? 'bg-emerald-100 text-emerald-700' :
                  val.conclusion === 'layak_revisi' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {val.conclusion === 'layak_tanpa_revisi' ? 'Layak' :
                   val.conclusion === 'layak_revisi' ? 'Revisi' : 'Ditolak'}
                </span>
              </div>
            </div>
          ))}
          
          {validations.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <ClipboardCheck size={48} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada data validasi.</p>
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
          <h2 className="text-xl font-bold text-slate-800 text-center uppercase tracking-wide">Lembar Validasi Pakar (Expert Review)</h2>
          <p className="text-center text-slate-500 text-sm mt-2">Desain Pembelajaran Matematika Terintegrasi Literasi Finansial (MFL)</p>
        </div>

        <form onSubmit={handleSaveValidation} className="p-8 space-y-8">
          {/* Identitas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Validator</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.validatorName}
                onChange={e => setFormData({...formData, validatorName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Instansi / Keahlian</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.institution}
                onChange={e => setFormData({...formData, institution: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Validasi</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          {/* Tabel Penilaian */}
          <div>
            <h3 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">B. Tabel Penilaian</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Aspek / Indikator</th>
                    <th className="px-4 py-3 text-center w-12">1</th>
                    <th className="px-4 py-3 text-center w-12">2</th>
                    <th className="px-4 py-3 text-center w-12">3</th>
                    <th className="px-4 py-3 text-center w-12 rounded-tr-lg">4</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criteriaList.map((criteria) => (
                    <tr key={criteria.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-600 block text-xs mb-1">{criteria.category}</span>
                        {criteria.statement}
                      </td>
                      {[1, 2, 3, 4].map((score) => (
                        <td key={score} className="px-4 py-3 text-center">
                          <input 
                            type="radio" 
                            name={`score-${criteria.id}`}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            checked={formData.scores?.[criteria.id] === score}
                            onChange={() => setFormData({
                              ...formData, 
                              scores: { ...formData.scores!, [criteria.id]: score }
                            })}
                            required
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex gap-4">
              <span>1 = Sangat Kurang</span>
              <span>2 = Kurang</span>
              <span>3 = Baik</span>
              <span>4 = Sangat Baik</span>
            </div>
          </div>

          {/* Komentar & Kesimpulan */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">C. Komentar dan Saran Perbaikan</label>
              <textarea 
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Tuliskan catatan spesifik..."
                value={formData.comment}
                onChange={e => setFormData({...formData, comment: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kesimpulan</label>
              <div className="space-y-2">
                {[
                  { val: 'layak_tanpa_revisi', label: 'Layak digunakan tanpa revisi' },
                  { val: 'layak_revisi', label: 'Layak digunakan dengan revisi sesuai saran' },
                  { val: 'tidak_layak', label: 'Tidak layak digunakan dan harus dirombak ulang' }
                ].map((opt) => (
                  <label key={opt.val} className="flex items-center p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                    <input 
                      type="radio" 
                      name="conclusion"
                      value={opt.val}
                      checked={formData.conclusion === opt.val}
                      onChange={e => setFormData({...formData, conclusion: e.target.value as any})}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <span className="text-slate-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl flex items-center shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
              Simpan Validasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
