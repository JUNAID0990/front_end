
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  NONE = 'NONE'
}

export interface VitalEntry {
  date: string;
  systolic: number;
  diastolic: number;
  sugar: number;
  weight: number;
}

export interface Symptom {
  id: string;
  label: string;
  checked: boolean;
}

export interface PatientProfile {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  isCaretaker: boolean;
  conditions: string[];
}

export interface DailyUpdate {
  vitals: {
    systolic: string;
    diastolic: string;
    pulse: string;
    sugar: string;
    sugarType: string;
    insulin: string;
    weight: string;
  };
  routine: {
    sleep: string;
    water: string;
    medicineTaken: boolean;
  };
  symptoms: string[];
}

export interface AIAnalysisResult {
  riskLevel: 'Normal' | 'Monitor' | 'Elevated';
  riskScore: number;
  factors: string[];
  summary: string;
}

export interface SuggestedQuestion {
  id: string;
  question: string;
  priority: 'High' | 'Medium' | 'Low';
}
