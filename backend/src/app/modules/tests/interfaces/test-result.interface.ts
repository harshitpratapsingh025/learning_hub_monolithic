export interface TestResult {
  sessionId: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  marksScored: number;
  totalMarks: number;
  accuracy: number;
  timeTaken: number;
  rank?: number;
  percentile?: number;
}

export interface QuestionAttemptResult {
  questionId: number;
  selectedOptionId: number;
  isCorrect: boolean;
  marksAwarded: number;
  timeSpent: number;
}

export interface SectionWiseResult {
  sectionName: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  marksScored: number;
  accuracy: number;
}