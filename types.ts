export interface CourseRecord {
  date: string;
  time: string;
  studentName: string;
  courseName: string;
  teacherName: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ProcessingError {
  message: string;
  details?: string;
}