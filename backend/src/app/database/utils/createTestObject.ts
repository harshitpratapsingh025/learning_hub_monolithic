
/**
 * Utility to transform previous year exam data for database storage
 * Keeps only essential fields and English/Hindi language data
 */

// Supported languages
const SUPPORTED_LANGUAGES = ["en", "hn"];

/**
 * Transform question data
 */
function transformQuestion(question) {
  return {
    id: question._id,
    type: question.type, // mcq, multiple, numerical
    marks: {
      positive: question.posMarks,
      negative: question.negMarks,
      partial: question.isPartialMarking ? question.partialMarks : null,
    },

    // Question content in supported languages
    content: {
      en: {
        question: question.en?.value || "",
        options: question.en?.options || [],
        explanation: question.en?.explanation || null,
        comprehension: question.en?.comp || null,
      },
      hn: {
        question: question.hn?.value || "",
        options: question.hn?.options || [],
        explanation: question.hn?.explanation || null,
        comprehension: question.en?.comp || null,
      },
    },

    // Media flags
    hasImage: question.hasImage || false,

    // Question metadata
    sectionNumber: question.SSNo,
    subsectionNumber: question.SSSNo,
    questionNumber: question.QSNo,

    // Answer key (if available)
    correctAnswer: question.correctAnswer || null,

    createdAt: new Date(),
  };
}

/**
 * Transform section data
 */
function transformSection(section) {
  return {
    id: section._id,
    title: section.title,

    // Timing and scoring
    questionCount: section.qCount,
    timeAllowed: section.time, // in seconds
    maxMarks: section.maxM,

    // Section properties
    isMandatory: section.isMandatory || false,
    isOptional: section.isOptional || false,
    isQualifying: section.isQualifyingSection || false,

    // Instructions (only English/Hindi)
    instructions: section.instructions?.filter(Boolean) || [],

    // Questions
    questions: section.questions.map(transformQuestion),

    sectionNumber: section.SSNo,
  };
}

/**
 * Transform cutoff data
 */
function transformCutoffs(cutoffs) {
  if (!cutoffs) return null;

  return {
    overall: cutoffs.overAll
      ? {
          title: cutoffs.overAll.title,
          categories: cutoffs.overAll.cutOffs.map((c) => ({
            category: c.category,
            marksRange: {
              min: c.lowerBound,
              max: c.upperBound,
            },
          })),
        }
      : null,

    sectional:
      cutoffs.sectional?.map((sec) => ({
        sectionId: sec.secId,
        title: sec.title,
        categories: sec.cutOffs.map((c) => ({
          category: c.category,
          marksRange: {
            min: c.lowerBound,
            max: c.upperBound,
          },
        })),
      })) || [],
  };
}

/**
 * Main transformation function for exam/paper data
 */
function transformExamData(rawData) {
  return {
    // Basic Information
    id: rawData.courseid,
    title: rawData.title,
    code: rawData.code || null,

    // Exam Metadata
    examType: rawData.metaCategoryName || "Previous Year Paper",
    isPreviousYear: rawData.isPyp || false,

    // Exam Details
    year: rawData.year || extractYearFromTitle(rawData.title),
    shift: rawData.shift || null,
    course: rawData.course || null,

    // Test Configuration
    duration: rawData.duration, // in seconds
    totalQuestions: rawData.qCount,
    totalMarks: rawData.totalM,

    // Test Behavior
    sectionTimeShared: rawData.sectionTimeSharedFlag || false,
    isSectionalSubmit: rawData.isSectionalSubmit || false,
    canChooseOptionalInTest: rawData.chooseOptionalSecInTest || false,
    hasOptionalSections: rawData.containOptionalSections || false,

    // Interface Settings
    testInterface: rawData.testInterface || "default",
    showCalculator: rawData.showCalculator || false,

    // Languages (filtered to en and hn)
    supportedLanguages: SUPPORTED_LANGUAGES,

    // Sections with questions
    sections: rawData.sections.map(transformSection),

    // Cutoff information
    cutoffs: transformCutoffs(rawData.examCutOffs),
  };
}

/**
 * Helper function to extract year from title
 */
function extractYearFromTitle(title) {
  const yearMatch = title.match(/\b(20\d{2})\b/);
  return yearMatch ? yearMatch[1] : null;
}
/**
 * Generate summary statistics
 */
function generateSummary(transformedData) {
  const totalQuestions = transformedData.sections.reduce(
    (sum, sec) => sum + sec.questions.length,
    0
  );

  const totalMarks = transformedData.sections.reduce(
    (sum, sec) => sum + (sec.maxMarks || 0),
    0
  );

  return {
    totalSections: transformedData.sections.length,
    totalQuestions,
    totalMarks,
    duration: transformedData.duration,
    hasOptionalSections: transformedData.hasOptionalSections,
    supportedLanguages: transformedData.supportedLanguages,
    examYear: transformedData.year,
    examType: transformedData.examType,
  };
}

/**
 * Main export function
 */
function processExamData(rawData) {
  try {
    // Transform data
    const transformed = transformExamData(rawData);
    // Generate summary
    const summary = generateSummary(transformed);

    return {
      success: true,
      data: transformed,
      summary,
      errors: [],
    };
  } catch (error) {
    console.error("Error processing exam data:", error);
    return {
      success: false,
      errors: [error.message],
      data: null,
    };
  }
}

/**
 * Transform answer key data for storage
 */
function transformAnswerKey(questionId, answerData) {
  if (!answerData) return null;

  return {
    questionId,

    // Correct answer(s)
    correctOption: answerData.correctOption || null,
    multiCorrectOptions: answerData.multiCorrectOptions || null,
    range: answerData.range || null,

    // Marking scheme
    marks: {
      positive: answerData.posMarks,
      negative: answerData.negMarks,
      skip: answerData.skipMarks,
      partial: answerData.isPartialMarking ? answerData.partialM : null,
    },

    // Solution in supported languages only
    solution: {
      en: {
        text: answerData.sol?.en?.value || "",
        type: answerData.sol?.en?.type || "text",
        videoUrl: answerData.sol?.en?.videoSol || null,
      },
      hn: {
        text: answerData.sol?.hn?.value || "",
        type: answerData.sol?.hn?.type || "text",
        videoUrl: answerData.sol?.hn?.videoSol || null,
      },
    },

    // Tags and concepts
    tags: answerData.tags || [],
    concepts:
      answerData.globalConcept?.map((concept) => ({
        subject: concept.s,
        chapter: concept.c,
        topic: concept.t,
        subtopic: concept.st?.id ? concept.st : null,
        subtopic1: concept.st1?.id ? concept.st1 : null,
        subtopic2: concept.st2?.id ? concept.st2 : null,
      })) || [],
  };
}

/**
 * Process all answers from the answer key object
 */
function processAnswerKeys(answerKeyObject) {
  const transformedAnswers = {};
  const errors: string[] = [];

  try {
    for (const [questionId, answerData] of Object.entries(answerKeyObject)) {
      try {
        transformedAnswers[questionId] = transformAnswerKey(
          questionId,
          answerData
        );
      } catch (error) {
        errors.push(error);
      }
    }

    return {
      success: errors.length === 0,
      data: transformedAnswers,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      errors: [error.message],
      summary: null,
    };
  }
}

/**
 * Merge exam data with answer keys
 */
function mergeExamWithAnswers(examData, answerKeyData) {
  const processedExam = processExamData(examData);
  const processedAnswers = processAnswerKeys(answerKeyData);

  if (!processedExam.success || !processedAnswers.success) {
    return {
      success: false,
      errors: [
        ...(processedExam.errors || []),
        ...(processedAnswers.errors || []),
      ],
      data: null,
    };
  }

  // Merge answers into questions
  processedExam?.data?.sections?.forEach((section) => {
    section.questions.forEach((question) => {
      const answer = processedAnswers?.data?.[question?.id];
      if (answer) {
        question.answer = {
          correctOption: answer.correctOption,
          multiCorrectOptions: answer.multiCorrectOptions,
          range: answer.range,
          solution: answer.solution,
          tags: answer.tags,
          concepts: answer.concepts,
          statistics: answer.statistics,
        };
      }
    });
  });

  return {
    success: true,
    data: processedExam.data,
    answersSummary: processedAnswers.summary,
    examSummary: processedExam.summary,
    errors: [],
  };
}

/**
 * Generate MongoDB-ready document structure
 */
function generateDatabaseDocument(mergedData) {
  if (!mergedData.success) {
    return null;
  }

  const exam = mergedData.data;
  
  // Extract unique subjects, chapters, and topics from question concepts
  const subjectsMap = new Map();
  const chaptersMap = new Map();
  const topicsMap = new Map();
  
  exam.sections.forEach((section) => {
    section.questions.forEach((question) => {
      question.answer?.concepts?.forEach((concept) => {
        if (concept.subject?.id) {
          subjectsMap.set(concept.subject.id, {
            _id: concept.subject.id,
            examId: exam.id,
            name: concept.subject.title,
            description: concept.subject.title,
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        if (concept.chapter?.id) {
          chaptersMap.set(concept.chapter.id, {
            _id: concept.chapter.id,
            subjectId: concept.subject?.id,
            name: concept.chapter.title,
            description: concept.chapter.title,
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        if (concept.topic?.id) {
          topicsMap.set(concept.topic.id, {
            _id: concept.topic.id,
            chapterId: concept.chapter?.id,
            name: concept.topic.title,
            description: concept.topic.title,
            displayOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      });
    });
  });

  return {
    // Collection: exams (basic info only)
    exam: {
      _id: exam.id,
      name: exam.title,
      code: exam.code,
      description: `${exam.title} - ${exam.examType}`,
      shortName: exam.course || 'EXAM',
      icon: '📝',
      isActive: true
    },

    // Collection: subjects (from concepts)
    // subjects: Array.from(subjectsMap.values()),

    // Collection: chapters (from concepts)
    // chapters: Array.from(chaptersMap.values()),

    // Collection: topics (from concepts)
    // topics: Array.from(topicsMap.values()),

    // Collection: papers (test execution data)
    paper: {
      _id: exam.id + '_paper',
      examId: exam.id,
      title: exam.title,
      code: exam.code,
      examType: exam.examType,
      isPreviousYear: exam.isPreviousYear,
      year: exam.year,
      shift: exam.shift,
      course: exam.course,
      paperName: exam.title,
      durationMinutes: Math.floor(exam.duration / 60),
      totalQuestions: exam.totalQuestions,
      totalMarks: exam.totalMarks,
      sectionTimeShared: exam.sectionTimeShared,
      isSectionalSubmit: exam.isSectionalSubmit,
      showCalculator: exam.showCalculator,
      supportedLanguages: exam.supportedLanguages,
      instructions: exam.generalInstructions,
      cutoffs: exam.cutoffs,
      isActive: true
    },

    // Collection: sections
    sections: exam.sections.map((section) => ({
      _id: section.id,
      examId: exam.id,
      title: section.title,
      questionCount: section.questionCount,
      timeAllowed: section.timeAllowed,
      maxMarks: section.maxMarks,
      isMandatory: section.isMandatory !== false,
      isOptional: section.isOptional || false,
      instructions: section.instructions,
      sectionNumber: section.sectionNumber,
      questionIds: section.questions.map((q) => q.id),
    })),

    // Collection: questions
    questions: exam.sections.flatMap((section) =>
      section.questions.map((question) => {
        const concept = question.answer?.concepts?.[0]; // Use first concept
        return {
          _id: question.id,
          examId: exam.id,
          subjectId: concept?.subject?.id || section.id,
          subjectName: concept?.subject?.title || section.title,
          chapterId: concept?.chapter?.id,
          chapterName: concept?.chapter?.title,
          topicId: concept?.topic?.id,
          topicName: concept?.topic?.title,

          // Question data
          type: question.type,
          marks: question.marks,
          content: question.content,
          hasImage: question.hasImage,

          // Answer key
          correctOption: question.answer?.correctOption,
          multiCorrectOptions: question.answer?.multiCorrectOptions,
          range: question.answer?.range,

          // Solution
          solution: question.answer?.solution,

          // Categorization
          tags: question.answer?.tags || [],

          createdAt: question.createdAt,
        };
      })
    ),
  };
}

// Example usage:
// const examResult = processExamData(rawExamData);
// const answerResult = processAnswerKeys(rawAnswerData);
// const merged = mergeExamWithAnswers(rawExamData, rawAnswerData);
// const dbDocument = generateDatabaseDocument(merged);
//
// if (dbDocument

module.exports = {
  transformExamData,
  transformQuestion,
  transformSection,
  generateSummary,
  processExamData,
  processAnswerKeys,
  mergeExamWithAnswers,
  generateDatabaseDocument,
};
