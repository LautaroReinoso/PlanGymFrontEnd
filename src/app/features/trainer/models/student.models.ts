import { WorkoutTemplate } from "./trainer.models";

 export interface userResponse {
    mensaje: string;
  
}

 export interface CreateStudentRequest {
    dni: string;
}

export interface StudentDetail {
  id: number;
  fullName: string;
  dni: string;
  active: boolean;
  adherencePercent: number;
  
  // Usamos '?' o '| null' porque si no tiene plan activo, 
  // Spring Boot probablemente envíe un null.

  activeWorkout?: ActiveWorkoutDetail | null; 
  activeTemplate?: WorkoutTemplate | null;
  
  workoutHistory: WorkoutHistoryItem[];
  recentLogs: RecentLog[];
}

export interface ActiveWorkoutDetail {
  workoutTemplateId: number;
  templateName: string;
  startDate: string;
  endDate: string;
  dayCount: number;
}

export interface WorkoutHistoryItem {
  studentWorkoutId: number;
  templateName: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface RecentLog {
  id: number;
  workoutDayName: string;
  completedAt: string;
  completed: boolean;
}