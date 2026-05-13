import streamlit as st
import requests
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import plotly.express as px
import plotly.graph_objects as go
from wordcloud import WordCloud
import networkx as nx
import pingouin as pg
import ast
import json
from sklearn.feature_extraction.text import CountVectorizer

# --- Configuration ---
st.set_page_config(page_title="DBR Research Analytics", layout="wide")

# --- Google Apps Script Connection ---
DEFAULT_GAS_URL = "YOUR_CODE_GOOGLE_APPSCRIPT"

try:
    GAS_URL = st.secrets.get("GAS_URL", DEFAULT_GAS_URL)
except:
    GAS_URL = DEFAULT_GAS_URL

# --- Data Fetching & Preprocessing ---
@st.cache_data(ttl=60)
def fetch_data(table_name):
    try:
        response = requests.get(f"{GAS_URL}?table={table_name}")
        response.raise_for_status()
        result = response.json()
        
        if result.get("status") == "success":
            data = result.get("data", [])
            df = pd.DataFrame(data)
            
            # Auto parse JSON strings in columns known to hold JSON objects
            for col in ['scores', 'results', 'evaluations', 'qualitative_analysis']:
                if col in df.columns:
                    df[col] = df[col].apply(lambda x: json.loads(x) if isinstance(x, str) and x.startswith('{') else x)
            return df
        else:
            st.error(f"Error database: {result.get('message')}")
            return pd.DataFrame()
    except Exception as e:
        st.error(f"Gagal mengambil data {table_name}: {e}")
        return pd.DataFrame()

# --- Stop Words ---
STOPWORDS_ID = set([
    "yang", "di", "ke", "dari", "ini", "itu", "pada", "untuk", "dengan", "dan", "atau", 
    "tapi", "tetapi", "namun", "juga", "karena", "sebab", "oleh", "ia", "dia", "mereka", 
    "kita", "kami", "kamu", "anda", "saya", "aku", "bisa", "dapat", "ada", "adalah", 
    "sebagai", "seperti", "jika", "kalau", "bila", "tentang", "bagi", "maka", "agar", 
    "supaya", "saat", "ketika", "dalam", "luar", "atas", "bawah", "depan", "belakang", 
    "sudah", "telah", "sedang", "akan", "masih", "belum", "tidak", "bukan", "ya", "tidak", 
    "ok", "oke", "baik", "benar", "salah", "apa", "siapa", "kapan", "dimana", "mengapa", 
    "bagaimana", "berapa", "sangat", "sekali", "paling", "lebih", "kurang", "cukup", 
    "hanya", "saja", "lagi", "pun", "kah", "lah", "tah", "dong", "kok", "deh", "sih", 
    "kan", "pak", "bu", "mas", "mbak", "kak", "dek", "bang", "neng", "om", "tante",
    "terus", "biar", "terus", "pas", "kayak"
])

# --- Helper Functions ---
def clean_text(text):
    if not isinstance(text, str): return ""
    tokens = text.lower().split()
    tokens = [t.strip(".,!?\"'()[]{}") for t in tokens if t.strip(".,!?\"'()[]{}")]
    tokens = [t for t in tokens if t and t not in STOPWORDS_ID]
    return " ".join(tokens)

# --- UI Layout ---
st.title("📊 Analisis Data Penelitian DBR (Makro & Mikro)")
st.markdown("Portal analisis Python untuk evaluasi Desain Pembelajaran (HLT vs ALT).")

tab_macro, tab_micro, tab_val, tab_raw = st.tabs([
    "🌎 Analisis Makro (Overall)", 
    "🔬 Analisis Mikro (Per Pertemuan)", 
    "🤝 Validitas Ahli (ICC)", 
    "📋 Data Mentah"
])

# ==========================================
# 1. ANALISIS MAKRO
# ==========================================
with tab_macro:
    st.header("Analisis Makro Pembelajaran")
    
    col_m1, col_m2 = st.columns(2)
    
    # 1A. Boxplot Pre-Test vs Post-Test
    with col_m1:
        st.subheader("Distribusi Peningkatan Skor CMR")
        df_eval = fetch_data("evaluation_sessions")
        if not df_eval.empty and "test_type" in df_eval.columns and "total_score" in df_eval.columns:
            fig_box = px.box(
                df_eval, 
                x="test_type", 
                y="total_score", 
                color="test_type",
                color_discrete_map={"pre-test": "#f6ad55", "post-test": "#4fd1c5"},
                labels={"total_score": "Total Skor", "test_type": "Jenis Tes"},
                category_orders={"test_type": ["pre-test", "post-test"]}
            )
            st.plotly_chart(fig_box, use_container_width=True)
        else:
            st.info("Data evaluasi Pre-Test / Post-Test belum tersedia.")
            
    # 1B. Radar Chart Dimensi CMR
    with col_m2:
        st.subheader("Peningkatan per Dimensi CMR")
        if not df_eval.empty and "scores" in df_eval.columns:
            try:
                # Membongkar dictionary ke kolom
                parsed_scores = [ast.literal_eval(s) if isinstance(s, str) else s for s in df_eval["scores"]]
                df_eval_scores = pd.json_normalize(parsed_scores)
                df_combined = pd.concat([df_eval.reset_index(drop=True), df_eval_scores], axis=1)
                
                # Menghitung rata-rata per dimensi
                avg_dims = df_combined.groupby('test_type')[['mathFoundation', 'plausibility', 'novelty']].mean().reset_index()
                
                if len(avg_dims) > 0:
                    fig_radar = go.Figure()
                    categories = ['Fondasi Matematis', 'Plausibility', 'Novelty']
                    
                    for r_idx, row in avg_dims.iterrows():
                        color = "#f6ad55" if row['test_type'] == 'pre-test' else "#4fd1c5"
                        fig_radar.add_trace(go.Scatterpolar(
                            r=[row['mathFoundation'], row['plausibility'], row['novelty']],
                            theta=categories,
                            fill='toself',
                            name=row['test_type'],
                            line_color=color
                        ))
                        
                    fig_radar.update_layout(polar=dict(radialaxis=dict(visible=True, range=[0, 3])))
                    st.plotly_chart(fig_radar, use_container_width=True)
            except Exception as e:
                st.warning(f"Gagal memproses Radar Chart: {e}")
        else:
            st.info("Data dimensi skor CMR belum lengkap.")

    col_m3, col_m4 = st.columns(2)
    
    # 1C. Perbandingan HLT vs ALT
    with col_m3:
        st.subheader("Dugaan HLT vs Kenyataan (ALT)")
        df_obs = fetch_data("observations")
        df_int = fetch_data("interview_sessions")
        
        # Kita gabungkan data deviasi dari Observations atau Interviews
        deviations = []
        if not df_obs.empty and 'hlt' in df_obs.columns and 'alt' in df_obs.columns:
            # Simple heuristic jika memakai field hlt/alt text similarity (bisa dikembangkan)
            pass 
        if not df_int.empty and 'topic' in df_int.columns and 'hlt_alignment' in df_int.columns:
            # Rename for display
            df_int_m3 = df_int.copy()
            df_int_m3['Status'] = df_int_m3['hlt_alignment'].apply(lambda x: "Sesuai HLT" if x == 'sesuai' else "Deviasi")
            
            # Hitung jumlah deviasi vs sesuai per pertemuan/topik
            agg_hlt = df_int_m3.groupby(['topic', 'Status']).size().reset_index(name='Jumlah')
            
            fig_bar_hlt = px.bar(
                agg_hlt,
                x='topic',
                y='Jumlah',
                color='Status',
                color_discrete_map={"Sesuai HLT": "#38b2ac", "Deviasi": "#e53e3e"},
                barmode='group',
                labels={"topic": "Siklus / Pertemuan"}
            )
            st.plotly_chart(fig_bar_hlt, use_container_width=True)
        else:
            st.info("Data deviasi wawancara belum lengkap dicatat.")

    # 1D. Bar Chart Success Rate
    with col_m4:
        st.subheader("Tingkat Keberhasilan Siswa (ALT)")
        st.caption("Ambang batas minimal keberhasilan HLT diatur pada 60%")
        
        df_task = fetch_data("task_analysis_sessions")
        if not df_task.empty and "results" in df_task.columns and "total_students" in df_task.columns:
            rates = []
            for _, row in df_task.iterrows():
                total = row.get("total_students", row.get("totalStudents", 1))
                res = row["results"]
                if isinstance(res, str): res = json.loads(res.replace("'", "\"")) if "{" in res else {}
                if isinstance(res, dict):
                    for act, count in res.items():
                        # Hanya coba hitung jika count angka
                        try:
                            rate = (int(count) / int(total)) * 100
                            rates.append({"Aktivitas": act, "Persentase": rate})
                        except: pass
            
            if rates:
                df_rates = pd.DataFrame(rates)
                # Ambil rata-rata jika ada duplikasi aktivitas
                df_rates = df_rates.groupby('Aktivitas').mean().reset_index()
                
                fig_success = px.bar(
                    df_rates, 
                    x='Aktivitas', 
                    y='Persentase',
                    color='Persentase',
                    color_continuous_scale=[[0, '#e53e3e'], [0.59, '#e53e3e'], [0.6, '#3182ce'], [1.0, '#3182ce']]
                )
                fig_success.add_hline(y=60, line_dash="dash", line_color="black", annotation_text="Batas 60%")
                st.plotly_chart(fig_success, use_container_width=True)
            else:
                st.info("Format hasil task analysis belum terisi.")
        else:
            st.info("Data Task Analysis belum tersedia.")


# ==========================================
# 2. ANALISIS MIKRO
# ==========================================
with tab_micro:
    st.header("Analisis Mikro: Ekstraksi Leksikal per Pertemuan")
    
    df_interviews = fetch_data("interview_sessions")
    if not df_interviews.empty and "topic" in df_interviews.columns and "critical_moments" in df_interviews.columns:
        topics = ["Semua Pertemuan"] + list(df_interviews["topic"].unique())
        selected_topic = st.selectbox("Pilih Topik/Pertemuan:", topics)
        
        if selected_topic == "Semua Pertemuan":
            df_micro = df_interviews.copy()
        else:
            df_micro = df_interviews[df_interviews["topic"] == selected_topic].copy()
            
        # Gabungkan semua teks untuk N-gram dan Word Cloud
        all_text_raw = df_micro["critical_moments"].dropna().astype(str).tolist()
        all_text_raw += df_micro.get("deviation_note", pd.Series()).dropna().astype(str).tolist()
        
        all_text_clean = [clean_text(t) for t in all_text_raw if str(t).strip()]
        combined_text = " ".join(all_text_clean)
        
        if combined_text.strip():
            col_u1, col_u2 = st.columns([1, 1])
            
            # 2A. N-Grams (Frasa Dominan)
            with col_u1:
                st.subheader("Frasa Penalaran Dominan (Bi-grams)")
                vectorizer = CountVectorizer(ngram_range=(2, 3), max_features=10) # Ambil top 10 Bigrams/Trigrams
                X = vectorizer.fit_transform(all_text_clean)
                ngram_counts = pd.DataFrame(
                    X.sum(axis=0).T, 
                    index=vectorizer.get_feature_names_out(), 
                    columns=['Frekuensi']
                ).sort_values(by='Frekuensi', ascending=True)
                
                fig_ngrams = px.bar(
                    ngram_counts, 
                    orientation='h',
                    color='Frekuensi',
                    color_continuous_scale="Greens"
                )
                fig_ngrams.update_layout(showlegend=False, yaxis_title="Frasa Konsep")
                st.plotly_chart(fig_ngrams, use_container_width=True)

            # 2B. Word Cloud
            with col_u2:
                st.subheader("Word Cloud: Leksikon Dominan")
                wordcloud = WordCloud(
                    width=600, height=400, 
                    background_color="white", 
                    colormap="ocean",
                    max_words=50
                ).generate(combined_text)
                
                fig_wc, ax_wc = plt.subplots(figsize=(6, 4))
                ax_wc.imshow(wordcloud, interpolation="bilinear")
                ax_wc.axis("off")
                st.pyplot(fig_wc)

            # 2C. Network Graph (Word Connection)
            st.subheader("Jejaring Keterkaitan Konsep (Word Connection)")
            st.caption("Menunjukkan kata/konsep yang sering muncul bersamaan dalam satu percakapan.")
            
            try:
                vectorizer_net = CountVectorizer(ngram_range=(1, 1), max_features=25)
                X_net = vectorizer_net.fit_transform(all_text_clean)
                words = vectorizer_net.get_feature_names_out()
                
                # Buat co-occurrence matrix (X.T * X)
                co_matrix = (X_net.T * X_net).toarray()
                np.fill_diagonal(co_matrix, 0) # Hilangkan self-connection
                
                # Buat Graph menggunakan networkx
                G = nx.Graph()
                for i in range(len(words)):
                    for j in range(i+1, len(words)):
                        if co_matrix[i][j] > 0: # Threshold bisa dinaikkan
                            G.add_edge(words[i], words[j], weight=co_matrix[i][j])
                            
                if G.number_of_nodes() > 0:
                    pos = nx.spring_layout(G, k=0.5, seed=42)
                    
                    fig_net, ax_net = plt.subplots(figsize=(10, 6))
                    
                    edges = G.edges(data=True)
                    weights = [d['weight'] for u, v, d in edges]
                    max_weight = max(weights) if weights else 1
                    scaled_weights = [w / max_weight * 5 for w in weights] # Ketebalan garis
                    
                    nx.draw_networkx_nodes(G, pos, ax=ax_net, node_color="#fbd38d", node_size=2000, edgecolors="black")
                    nx.draw_networkx_edges(G, pos, ax=ax_net, width=scaled_weights, alpha=0.5, edge_color="#a0aec0")
                    nx.draw_networkx_labels(G, pos, ax=ax_net, font_size=10, font_weight="bold")
                    
                    ax_net.axis("off")
                    st.pyplot(fig_net)
                else:
                    st.info("Variasi teks tidak cukup untuk membuat jejaring konsep.")
            except Exception as e:
                st.error(f"Error dalam membentuk jejaring koneksi: {e}")
                
        else:
            st.warning("Belum ada teks atau momen kritis yang dicatat pada topik ini.")
            
    else:
        st.info("Data Wawancara (Critical Moments) belum tersedia untuk Analisis Mikro.")


# ==========================================
# 3. ANALISIS VALIDITAS AHLI (ICC)
# ==========================================
with tab_val:
    st.header("Analisis Validitas Ahli & Kesepakatan Validator")
    st.markdown("Mengukur tingkat kesepakatan (Reliabilitas Inter-Rater) menggunakan **Intraclass Correlation Coefficient (ICC)**.")
    
    try:
        df_val = fetch_data("validation_sessions")
        if not df_val.empty and "evaluations" in df_val.columns:
            records = []
            for _, row in df_val.iterrows():
                validator = row.get("validatorName", row.get("validator_name", "Unknown"))
                instrument = row.get("instrumentType", row.get("instrument_type", "Unknown"))
                evals = row["evaluations"]
                
                if isinstance(evals, str):
                    evals = json.loads(evals.replace("'", "\"")) if "{" in evals else {}
                    
                if isinstance(evals, dict):
                    for crit_id, crit_data in evals.items():
                        score = crit_data.get("score", 0)
                        if score > 0:
                            records.append({
                                "Validator": validator,
                                "Instrumen": instrument,
                                "Kriteria": crit_id,
                                "Skor": int(score)
                            })
                            
            df_records = pd.DataFrame(records)
            
            if not df_records.empty:
                instruments = df_records["Instrumen"].unique()
                selected_inst = st.selectbox("Pilih Instrumen untuk dianalisis:", instruments)
                
                df_subset = df_records[df_records["Instrumen"] == selected_inst]
                
                col_a, col_b = st.columns([2, 1])
                
                with col_a:
                    st.subheader("Peta Persebaran Skor Validator")
                    pivot_df = df_subset.pivot_table(index="Validator", columns="Kriteria", values="Skor", aggfunc="mean").fillna(0)
                    fig_heat = px.imshow(
                        pivot_df, 
                        text_auto=True, 
                        color_continuous_scale="Blues", 
                        title=f"Heatmap Skor Validator ({selected_inst})",
                        labels=dict(color="Skor (1-4)")
                    )
                    st.plotly_chart(fig_heat, use_container_width=True)
                
                with col_b:
                    st.subheader("Kalkulasi ICC")
                    st.info("Kriteria Minimal: 2 validator menilai kriteria yang sama dengan variasi skor.")
                    try:
                        icc = pg.intraclass_corr(data=df_subset, targets='Kriteria', raters='Validator', ratings='Skor')
                        icc_value = icc.set_index('Type').loc['ICC3k', 'ICC']
                        
                        st.metric(label="Nilai ICC3k", value=f"{icc_value:.2f}")
                        
                        if icc_value >= 0.75:
                            st.success("Tinggi: Kesepakatan antar validator Kuat/Sangat Baik.")
                        elif icc_value >= 0.5:
                            st.warning("Sedang: Kesepakatan Moderat.")
                        else:
                            st.error("Rendah: Kesepakatan Lemah. Evaluasi ulang rubrik Anda.")
                            
                        with st.expander("Lihat Detail Metrik ICC"):
                            st.dataframe(icc[['Type', 'ICC', 'F', 'df1', 'df2', 'pval', 'CI95%']])
                    except Exception as e_icc:
                        st.error(f"Belum ada variasi data yang cukup untuk statistik ICC.")
            else:
                st.info("Belum ada skor yang tercatat dalam data validasi.")
        else:
            st.info("Belum ada data validasi ahli sama sekali.")
    except Exception as e:
        st.error(f"Error memuat data validasi: {e}")


# ==========================================
# 4. DATA MENTAH
# ==========================================
with tab_raw:
    st.header("Data Mentah (Tabel)")
    dataset = st.selectbox("Pilih Dataset:", ["interview_sessions", "evaluation_sessions", "observations", "validation_sessions", "task_analysis_sessions"])
    
    if st.button("Muat Data"):
        try:
            df_raw = fetch_data(dataset)
            st.dataframe(df_raw)
        except Exception as e:
            st.error(f"Error loading data: {e}")

