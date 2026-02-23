export enum ExamLevel {
  CLOUD_PRACTITIONER = "Cloud Practitioner",
  ASSOCIATE = "Associate",
  SPECIALTY = "Specialty",
  PROFESSIONAL = "Professional",
}

export type Language = "pt" | "en";

export interface Domain {
  id: string;
  name: string;
  weight: number; // percentage
  topics: string[];
}

export interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  explanation: string;
  domainId?: string;
}

export interface SimulationResult {
  candidateName: string;
  candidateAge: number;
  score: number;
  totalQuestions: number;
  timeUsed: number; // seconds
  answers: {
    questionId: string;
    selectedOptionId: string | null;
    isCorrect: boolean;
    isMarkedForReview: boolean;
  }[];
}

export interface StudyPlan {
  analysis: string;
  domainPerformance: {
    domainId: string;
    domainName: string;
    score: number;
    total: number;
    weight: number;
  }[];
  recommendations: string;
}
