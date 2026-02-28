export interface Observation {
  id: string;
  pertemuan: string;
  waktu: string;
  aktivitas: string;
  hlt: string;
  alt: string;
  createdAt?: any;
}

export interface ValidationCriteria {
  id: string;
  category: string;
  statement: string;
  score: number; // 1-4
}

export interface ValidationSession {
  id: string;
  validatorName: string;
  institution: string;
  date: string;
  scores: Record<string, number>; // criteriaId -> score
  comment: string;
  conclusion: 'layak_tanpa_revisi' | 'layak_revisi' | 'tidak_layak';
  createdAt: any;
}

export interface TaskActivity {
  id: string;
  pertemuan: number;
  name: string;
  indicator: string;
}

export interface TaskAnalysisSession {
  id: string;
  totalStudents: number;
  results: Record<string, number>; // activityId -> successCount
  qualitativeAnalysis: {
    activityId: string;
    findings: string;
    recommendation: string;
  }[];
  createdAt: any;
}

export interface InterviewSession {
  id: string;
  studentCode: string;
  date: string;
  topic: string; // Pertemuan 1, 2, 3, or 4
  criticalMoments: string; // Bukti CMR
  hltAlignment: 'sesuai' | 'deviasi';
  deviationNote: string;
  notes: string; // General notes
  createdAt: any;
}

export interface EvaluationSession {
  id: string;
  studentId: string;
  testType: 'pre-test' | 'post-test';
  questionId: string;
  scores: {
    mathFoundation: number; // 0-3
    plausibility: number; // 0-3
    novelty: number; // 0-3
  };
  totalScore: number; // 0-9
  notes: string;
  createdAt: any;
}
