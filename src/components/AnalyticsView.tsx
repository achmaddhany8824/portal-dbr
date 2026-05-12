import React from 'react';
import { ExternalLink, AlertTriangle, BrainCircuit } from 'lucide-react';

export default function AnalyticsView() {
  // TODO: Replace this with your actual Hugging Face Space URL after deployment
  // Example: "https://huggingface.co/spaces/username/space-name"
  // Ensure your Space is set to "Public" or handle authentication if private.
  // For embedding, you might need to use the direct embed URL:
  // "https://username-space-name.hf.space"
  const HF_SPACE_URL = "https://huggingface.co/spaces/YOUR_USERNAME/YOUR_SPACE_NAME"; 
  const EMBED_URL = ""; // If empty, we show instructions. Set this to "https://YOUR_SPACE.hf.space" to embed.

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BrainCircuit className="text-purple-600" />
            Advanced Analytics (Python Backend)
          </h2>
          <p className="text-slate-500">Analisis Kualitatif (NVivo-like) & Kuantitatif Otomatis.</p>
        </div>
        <a 
          href={HF_SPACE_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex items-center font-medium transition-colors"
        >
          <ExternalLink size={18} className="mr-2" /> Buka di Tab Baru
        </a>
      </div>

      {EMBED_URL ? (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
          <iframe 
            src={EMBED_URL} 
            className="w-full h-full border-0"
            title="Analytics Dashboard"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <div className="flex-1 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <BrainCircuit size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Backend Python Belum Terhubung</h3>
          <p className="text-slate-600 max-w-lg mb-6">
            Fitur ini memerlukan backend Python (Streamlit) yang berjalan terpisah untuk melakukan analisis teks kompleks (NLP) dan visualisasi data tingkat lanjut.
          </p>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-left max-w-2xl w-full shadow-sm">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Panduan Deployment (Hugging Face Spaces):
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
              <li>Buka folder <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">backend/</code> di project ini.</li>
              <li>Buat Space baru di <a href="https://huggingface.co/spaces" target="_blank" className="text-blue-600 hover:underline">Hugging Face</a> dengan SDK <strong>Streamlit</strong>.</li>
              <li>Upload file <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">app.py</code> dan <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">requirements.txt</code> ke Space tersebut.</li>
              <li>Di Settings Space, tambahkan <strong>Repository Secrets</strong> (Opsional, karena sudah ada fallback di kode):
                <ul className="list-disc list-inside ml-4 mt-1 text-slate-500">
                  <li><code className="text-xs">GAS_URL</code>: (Salin URL Google Apps Script Anda)</li>
                </ul>
              </li>
              <li>Setelah Space berjalan (Running), salin URL embed-nya (biasanya format <code>https://username-space.hf.space</code>).</li>
              <li>Update variabel <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">EMBED_URL</code> di file <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">src/components/AnalyticsView.tsx</code>.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
