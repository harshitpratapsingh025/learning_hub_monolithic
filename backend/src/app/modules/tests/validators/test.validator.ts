import { BadRequestException } from '@nestjs/common';

export class TestValidator {
  /**
   * Validate question order in a test
   */
  static validateQuestionOrder(questions: any[]): void {
    const orders = questions.map(q => q.question_order);
    const uniqueOrders = new Set(orders);

    if (orders.length !== uniqueOrders.size) {
      throw new BadRequestException('Question orders must be unique');
    }

    // Check for gaps in ordering
    const sortedOrders = [...orders].sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length - 1; i++) {
      if (sortedOrders[i + 1] - sortedOrders[i] !== 1) {
        throw new BadRequestException('Question orders must be sequential');
      }
    }
  }

  /**
   * Validate test timing
   */
  static validateTestTiming(startedAt: Date, durationMinutes: number): void {
    const now = new Date();
    const elapsedMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);

    if (elapsedMinutes > durationMinutes + 5) {
      throw new BadRequestException('Test time has expired');
    }
  }

  /**
   * Validate test submission
   */
  static validateTestSubmission(session: any): void {
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Test has already been submitted');
    }

    if (!session.question_attempts || session.question_attempts.length === 0) {
      throw new BadRequestException('No questions attempted');
    }
  }
}