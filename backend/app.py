import streamlit as st
import requests
import pandas as pd
import matplotlib.pyplot as plt
from wordcloud import WordCloud
import plotly.express as px
import os
import pingouin as pg

# --- Configuration ---
st.set_page_config(page_title="DBR Research Analytics", layout="wide")

# --- Google Apps Script Connection ---
# URL Web App GAS yang diberikan
DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbzTyGL1nfoO6eU6ombC3J-GF6-jM_ElGUd8vE-iwNW6kiR7wp327aUNWSwKltWzDfS_hA/exec"

# Mengambil dari secrets jika ada, jika tidak gunakan default
try:
    GAS_URL = st.secrets.get("GAS_URL", DEFAULT_GAS_URL)
except:
    GAS_URL = DEFAULT_GAS_URL

# --- Data Fetching ---
@st.cache_data(ttl=60) # Cache 1 menit agar data cepat update
def fetch_data(table_name):
    try:
        response = requests.get(f"{GAS_URL}?table={table_name}")
        response.raise_for_status()
        result = response.json()
        
        if result.get("status") == "success":
            data = result.get("data", [])
            return pd.DataFrame(data)
        else:
            st.error(f"Error dari database: {result.get('message')}")
            return pd.DataFrame()
    except Exception as e:
        st.error(f"Gagal mengambil data dari Google Sheets: {e}")
        return pd.DataFrame()

# --- Stop Words (Indonesian) ---
# Hardcoded to avoid NLTK download issues in some environments
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
    "kan", "pak", "bu", "mas", "mbak", "kak", "dek", "bang", "neng", "om", "tante"
])

# --- UI Layout ---
st.title("📊 Analisis Data Penelitian DBR (MFL & CMR)")
st.markdown("Dashboard ini menyajikan analisis kualitatif dan kuantitatif lanjutan menggunakan Python.")

tab1, tab2, tab3, tab4 = st.tabs(["☁️ Kualitatif", "📈 Kuantitatif", "🤝 Validitas Ahli (ICC)", "📋 Data Mentah"])

with tab1:
    st.header("Analisis Kualitatif: Kata Kunci & Pola Masalah")
    
    col1, col2 = st.columns(2)
    
    # 1. Word Cloud (Interview Critical Moments)
    with col1:
        st.subheader("1. Word Cloud: Momen Kritis Siswa")
        st.caption("Kata-kata yang paling sering muncul dalam 'Critical Moments' (Wawancara CMR).")
        
        try:
            df_interviews = fetch_data("interview_sessions")
            if not df_interviews.empty and "critical_moments" in df_interviews.columns:
                text = " ".join(df_interviews["critical_moments"].dropna().astype(str).tolist())
                
                wordcloud = WordCloud(
                    width=800, 
                    height=400, 
                    background_color="white", 
                    stopwords=STOPWORDS_ID,
                    colormap="viridis",
                    min_font_size=10
                ).generate(text)
                
                fig, ax = plt.subplots(figsize=(10, 5))
                ax.imshow(wordcloud, interpolation="bilinear")
                ax.axis("off")
                st.pyplot(fig)
            else:
                st.info("Belum ada data wawancara yang cukup untuk membuat Word Cloud.")
        except Exception as e:
            st.error(f"Error generating Word Cloud: {e}")

    # 2. Treemap (HLT vs ALT Deviations)
    with col2:
        st.subheader("2. Treemap: Peta Deviasi Desain")
        st.caption("Hierarki deviasi antara HLT (Hypothetical) dan ALT (Actual) berdasarkan topik.")
        
        try:
            # We use interview sessions where hlt_alignment is 'deviasi'
            # Or we could use observations if we had a structured 'status' field.
            # Let's stick to interviews as requested for 'Coding deviasi'.
            
            if not df_interviews.empty and "hlt_alignment" in df_interviews.columns:
                df_deviations = df_interviews[df_interviews["hlt_alignment"] == "deviasi"].copy()
                
                if not df_deviations.empty:
                    # Prepare data for Treemap
                    # Hierarchy: Topic -> Student Code -> Deviation Note (truncated)
                    df_deviations["short_note"] = df_deviations["deviation_note"].apply(lambda x: (x[:30] + '...') if isinstance(x, str) and len(x) > 30 else x)
                    df_deviations["count"] = 1
                    
                    fig_tree = px.treemap(
                        df_deviations, 
                        path=[px.Constant("Semua Deviasi"), 'topic', 'student_code', 'short_note'], 
                        values='count',
                        color='topic',
                        color_discrete_sequence=px.colors.qualitative.Pastel,
                        hover_data=['deviation_note']
                    )
                    st.plotly_chart(fig_tree, use_container_width=True)
                else:
                    st.info("Tidak ditemukan data deviasi (semua sesuai HLT).")
            else:
                st.info("Belum ada data wawancara.")
        except Exception as e:
            st.error(f"Error generating Treemap: {e}")

with tab2:
    st.header("Analisis Kuantitatif: Skor Evaluasi")
    
    try:
        df_eval = fetch_data("evaluation_sessions")
        if not df_eval.empty:
            col_q1, col_q2 = st.columns(2)
            
            with col_q1:
                st.subheader("Distribusi Total Skor (0-9)")
                fig_hist = px.histogram(
                    df_eval, 
                    x="total_score", 
                    nbins=10, 
                    color="test_type",
                    title="Sebaran Nilai Siswa",
                    labels={"total_score": "Total Skor", "test_type": "Jenis Tes"}
                )
                st.plotly_chart(fig_hist, use_container_width=True)
                
            with col_q2:
                st.subheader("Rata-rata Per Indikator CMR")
                # Need to normalize the JSON/Dict column 'scores' if possible, or just use what we have
                # Since 'scores' comes as a dictionary/json from Supabase, we might need to expand it
                if "scores" in df_eval.columns:
                    # Expand scores column
                    scores_df = pd.json_normalize(df_eval["scores"])
                    avg_scores = scores_df.mean().reset_index()
                    avg_scores.columns = ["Indikator", "Rata-rata"]
                    
                    fig_bar = px.bar(
                        avg_scores, 
                        x="Indikator", 
                        y="Rata-rata", 
                        color="Indikator",
                        title="Rata-rata Skor per Indikator (Max 3.0)",
                        range_y=[0, 3.5]
                    )
                    st.plotly_chart(fig_bar, use_container_width=True)
        else:
            st.info("Belum ada data evaluasi.")
    except Exception as e:
        st.error(f"Error generating Quantitative charts: {e}")

with tab3:
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
                
                if isinstance(evals, dict):
                    for crit_id, crit_data in evals.items():
                        score = crit_data.get("score", 0)
                        if score > 0:  # Abaikan jika belum dinilai
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
                    # Pivot table for Heatmap
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
                    st.info("Syarat ICC: Minimal 2 validator menilai kriteria yang sama dengan variasi skor.")
                    try:
                        # Menghitung ICC menggunakan pingouin
                        icc = pg.intraclass_corr(data=df_subset, targets='Kriteria', raters='Validator', ratings='Skor')
                        
                        # Fokus pada ICC3k (Rata-rata rater tetap) - umum digunakan di edukasi/validitas ahli
                        icc_value = icc.set_index('Type').loc['ICC3k', 'ICC']
                        
                        st.metric(label="Nilai ICC3k", value=f"{icc_value:.2f}")
                        
                        if icc_value >= 0.75:
                            st.success("Tinggi: Kesepakatan antar validator Kuat/Sangat Baik.")
                        elif icc_value >= 0.5:
                            st.warning("Sedang: Kesepakatan Moderat.")
                        else:
                            st.error("Rendah: Kesepakatan Lemah. Evaluasi ulang rubrik Anda.")
                            
                        with st.expander("Lihat Detail Metrik ICC (Tabel)"):
                            st.dataframe(icc[['Type', 'ICC', 'F', 'df1', 'df2', 'pval', 'CI95%']])
                            
                    except Exception as e_icc:
                        st.error(f"Belum ada variasi data yang cukup untuk menghitung ICC. (Atau ada error statistik: {e_icc})")
                        
            else:
                st.info("Belum ada skor yang tercatat dalam data validasi.")
        else:
            st.info("Belum ada data validasi ahli sama sekali.")
    except Exception as e:
        st.error(f"Error memuat data validasi: {e}")

with tab4:
    st.header("Data Mentah (Tabel)")
    
    dataset = st.selectbox("Pilih Dataset:", ["interview_sessions", "evaluation_sessions", "observations", "validation_sessions", "task_analysis_sessions"])
    
    if st.button("Muat Data"):
        try:
            df_raw = fetch_data(dataset)
            st.dataframe(df_raw)
        except Exception as e:
            st.error(f"Error loading data: {e}")
