export const TEST_CONSTANTS = {
  DEFAULT_MARKS_PER_QUESTION: 1.0,
  DEFAULT_NEGATIVE_MARKS: 0.25,
  CACHE_TTL: {
    TEST_LIST: 300, // 5 minutes
    TEST_DETAILS: 600, // 10 minutes
    SESSION: 300, // 5 minutes
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  TEST_STATUS: {
    IN_PROGRESS: 'in_progress',
    SUBMITTED: 'submitted',
    ABANDONED: 'abandoned',
  },
  TEST_TYPES: {
    PAPER: 'paper',
    MOCK: 'mock',
    SUBJECT: 'subject',
  },
  DIFFICULTY_LEVELS: {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
  },
};