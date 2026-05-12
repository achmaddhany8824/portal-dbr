

import { 
  Observation, 
  ValidationSession, 
  TaskAnalysisSession, 
  InterviewSession, 
  EvaluationSession 
} from '../types';

const GAS_URL = import.meta.env.VITE_GAS_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbzTyGL1nfoO6eU6ombC3J-GF6-jM_ElGUd8vE-iwNW6kiR7wp327aUNWSwKltWzDfS_hA/exec";

// --- Helper Functions for GAS ---

const fetchFromGAS = async (table: string) => {
  if (!GAS_URL) throw new Error("GAS URL belum dikonfigurasi di .env");
  const response = await fetch(`${GAS_URL}?table=${table}`);
  const result = await response.json();
  if (result.status === 'error') throw new Error(result.message);
  return result.data;
};

const postToGAS = async (table: string, data: any) => {
  if (!GAS_URL) throw new Error("GAS URL belum dikonfigurasi di .env");
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      // Menggunakan text/plain untuk menghindari CORS Preflight (OPTIONS) yang tidak didukung GAS
      'Content-Type': 'text/plain;charset=utf-8', 
    },
    body: JSON.stringify({ table, data })
  });
  const result = await response.json();
  if (result.status === 'error') throw new Error(result.message);
  return result.data;
};

// Observations
export const getObservations = async (): Promise<Observation[]> => {
  const data = await fetchFromGAS('observations');
  return data.map((item: any) => ({
    id: item.id,
    pertemuan: item.pertemuan,
    waktu: item.waktu,
    aktivitas: item.aktivitas,
    hlt: item.hlt,
    alt: item.alt,
    createdAt: item.created_at
  }));
};

export const createObservation = async (observation: Omit<Observation, 'id' | 'createdAt'>): Promise<Observation> => {
  const payload = {
    pertemuan: observation.pertemuan,
    waktu: observation.waktu,
    aktivitas: observation.aktivitas,
    hlt: observation.hlt,
    alt: observation.alt
  };
  const data = await postToGAS('observations', payload);
  return {
    ...data,
    createdAt: data.created_at
  };
};

// Validation Sessions
export const getValidationSessions = async (): Promise<ValidationSession[]> => {
  const data = await fetchFromGAS('validation_sessions');
  return data.map((item: any) => ({
    id: item.id,
    validatorName: item.validator_name,
    institution: item.institution,
    date: item.date,
    scores: item.scores,
    comment: item.comment,
    conclusion: item.conclusion,
    createdAt: item.created_at
  }));
};

export const createValidationSession = async (session: Omit<ValidationSession, 'id' | 'createdAt'>): Promise<ValidationSession> => {
  const payload = {
    validator_name: session.validatorName,
    institution: session.institution,
    date: session.date,
    scores: session.scores,
    comment: session.comment,
    conclusion: session.conclusion
  };
  const data = await postToGAS('validation_sessions', payload);
  return {
    id: data.id,
    validatorName: data.validator_name,
    institution: data.institution,
    date: data.date,
    scores: data.scores,
    comment: data.comment,
    conclusion: data.conclusion,
    createdAt: data.created_at
  };
};

// Task Analysis Sessions
export const getTaskAnalysisSessions = async (): Promise<TaskAnalysisSession[]> => {
  const data = await fetchFromGAS('task_analysis_sessions');
  return data.map((item: any) => ({
    id: item.id,
    totalStudents: item.total_students,
    results: item.results,
    qualitativeAnalysis: item.qualitative_analysis,
    createdAt: item.created_at
  }));
};

export const createTaskAnalysisSession = async (session: Omit<TaskAnalysisSession, 'id' | 'createdAt'>): Promise<TaskAnalysisSession> => {
  const payload = {
    total_students: session.totalStudents,
    results: session.results,
    qualitative_analysis: session.qualitativeAnalysis
  };
  const data = await postToGAS('task_analysis_sessions', payload);
  return {
    id: data.id,
    totalStudents: data.total_students,
    results: data.results,
    qualitativeAnalysis: data.qualitative_analysis,
    createdAt: data.created_at
  };
};

// Interview Sessions
export const getInterviewSessions = async (): Promise<InterviewSession[]> => {
  const data = await fetchFromGAS('interview_sessions');
  return data.map((item: any) => ({
    id: item.id,
    studentCode: item.student_code,
    date: item.date,
    topic: item.topic,
    criticalMoments: item.critical_moments,
    hltAlignment: item.hlt_alignment,
    deviationNote: item.deviation_note,
    notes: item.notes,
    createdAt: item.created_at
  }));
};

export const createInterviewSession = async (session: Omit<InterviewSession, 'id' | 'createdAt'>): Promise<InterviewSession> => {
  const payload = {
    student_code: session.studentCode,
    date: session.date,
    topic: session.topic,
    critical_moments: session.criticalMoments,
    hlt_alignment: session.hltAlignment,
    deviation_note: session.deviationNote,
    notes: session.notes
  };
  const data = await postToGAS('interview_sessions', payload);
  return {
    id: data.id,
    studentCode: data.student_code,
    date: data.date,
    topic: data.topic,
    criticalMoments: data.critical_moments,
    hltAlignment: data.hlt_alignment,
    deviationNote: data.deviation_note,
    notes: data.notes,
    createdAt: data.created_at
  };
};

// Evaluation Sessions
export const getEvaluationSessions = async (): Promise<EvaluationSession[]> => {
  const data = await fetchFromGAS('evaluation_sessions');
  return data.map((item: any) => ({
    id: item.id,
    studentId: item.student_id,
    testType: item.test_type,
    questionId: item.question_id,
    scores: item.scores,
    totalScore: item.total_score,
    notes: item.notes,
    createdAt: item.created_at
  }));
};

export const createEvaluationSession = async (session: Omit<EvaluationSession, 'id' | 'createdAt'>): Promise<EvaluationSession> => {
  const payload = {
    student_id: session.studentId,
    test_type: session.testType,
    question_id: session.questionId,
    scores: session.scores,
    total_score: session.totalScore,
    notes: session.notes
  };
  const data = await postToGAS('evaluation_sessions', payload);
  return {
    id: data.id,
    studentId: data.student_id,
    testType: data.test_type,
    questionId: data.question_id,
    scores: data.scores,
    totalScore: data.total_score,
    notes: data.notes,
    createdAt: data.created_at
  };
};

// Dashboard Counts
export const getCounts = async () => {
  if (!GAS_URL) {
    return {
      observations: 0,
      validations: 0,
      taskAnalyses: 0,
      interviews: 0,
      evaluations: 0
    };
  }

  try {
    const response = await fetch(`${GAS_URL}?action=getCounts`);
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    
    const counts = result.data;
    return {
      observations: counts['observations'] || 0,
      validations: counts['validation_sessions'] || 0,
      taskAnalyses: counts['task_analysis_sessions'] || 0,
      interviews: counts['interview_sessions'] || 0,
      evaluations: counts['evaluation_sessions'] || 0
    };
  } catch (error) {
    console.error("Error fetching counts from GAS:", error);
    return {
      observations: 0,
      validations: 0,
      taskAnalyses: 0,
      interviews: 0,
      evaluations: 0
    };
  }
};
