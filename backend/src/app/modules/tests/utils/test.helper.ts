import { SectionWiseResult, TestResult } from "../interfaces";

export class TestHelper {
  /**
   * Calculate test duration remaining in seconds
   */
  static calculateTimeRemaining(
    startedAt: Date,
    durationMinutes: number,
  ): number {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const total = durationMinutes * 60;
    return Math.max(0, total - elapsed);
  }

  /**
   * Check if test time has expired
   */
  static isTestExpired(startedAt: Date, durationMinutes: number): boolean {
    return this.calculateTimeRemaining(startedAt, durationMinutes) === 0;
  }

  /**
   * Calculate accuracy percentage
   */
  static calculateAccuracy(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 10000) / 100;
  }

  /**
   * Calculate marks with negative marking
   */
  static calculateMarks(
    correct: number,
    incorrect: number,
    marksPerQuestion: number,
    negativeMarks: number,
  ): number {
    const totalMarks = correct * marksPerQuestion - incorrect * negativeMarks;
    return Math.max(0, totalMarks);
  }

  /**
   * Group questions by section
   */
  static groupBySection(questions: any[]): Map<string, any[]> {
    const sectionMap = new Map<string, any[]>();
    
    questions.forEach((q) => {
      const section = q.section || 'General';
      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }
      sectionMap.get(section).push(q);
    });

    return sectionMap;
  }

  /**
   * Calculate section-wise results
   */
  static calculateSectionWiseResults(
    attempts: any[],
    questions: any[],
  ): SectionWiseResult[] {
    const sectionMap = this.groupBySection(questions);
    const results: SectionWiseResult[] = [];

    sectionMap.forEach((sectionQuestions, sectionName) => {
      const sectionQuestionIds = new Set(sectionQuestions.map(q => q.question_id));
      const sectionAttempts = attempts.filter(a => 
        sectionQuestionIds.has(a.question_id)
      );

      const attempted = sectionAttempts.filter(a => a.selected_option_id).length;
      const correct = sectionAttempts.filter(a => a.is_correct).length;
      const incorrect = attempted - correct;
      
      let marksScored = 0;
      sectionAttempts.forEach(attempt => {
        const question = sectionQuestions.find(q => q.question_id === attempt.question_id);
        if (question && attempt.is_correct) {
          marksScored += Number(question.marks || 1);
        } else if (question && attempt.selected_option_id && !attempt.is_correct) {
          marksScored -= Number(question.negative_marks || 0.25);
        }
      });

      results.push({
        sectionName,
        totalQuestions: sectionQuestions.length,
        attempted,
        correct,
        incorrect,
        marksScored: Math.max(0, marksScored),
        accuracy: this.calculateAccuracy(correct, attempted),
      });
    });

    return results;
  }

  /**
   * Validate test configuration
   */
  static validateTestConfig(config: {
    totalQuestions: number;
    durationMinutes: number;
    totalMarks: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.totalQuestions <= 0) {
      errors.push('Total questions must be greater than 0');
    }

    if (config.durationMinutes <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (config.totalMarks <= 0) {
      errors.push('Total marks must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate test summary
   */
  static generateTestSummary(session: any): TestResult {
    return {
      sessionId: session.id,
      totalQuestions: session.total_attempted + (session.unanswered || 0),
      attempted: session.total_attempted,
      correct: session.correct_answers,
      incorrect: session.incorrect_answers,
      unanswered: session.unanswered || 0,
      marksScored: Number(session.total_marks_scored) || 0,
      totalMarks: Number(session.total_marks_possible) || 0,
      accuracy: Number(session.accuracy_percentage) || 0,
      timeTaken: session.time_taken_seconds || 0,
    };
  }
}