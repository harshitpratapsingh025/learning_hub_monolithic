import * as fs from 'fs';
import * as path from 'path';
import { questions } from './mock/questions';
import { anrwers } from './mock/answers';
const {
  processExamData,
  processAnswerKeys,
  mergeExamWithAnswers,
  generateDatabaseDocument,
} = require('./utils/createTestObject');

async function processMockData() {
  console.log('🔄 Processing mock exam data...');

  try {
    // Process exam data
    const examResult = processExamData(questions);
    console.log('✅ Exam data processed:', examResult.success);

    // Process answer keys
    const answerResult = processAnswerKeys(anrwers);
    console.log('✅ Answer keys processed:', answerResult.success);

    // Merge exam with answers
    const merged = mergeExamWithAnswers(questions, anrwers);
    console.log('✅ Data merged:', merged.success);

    // Generate database document
    const dbDocument = generateDatabaseDocument(merged);
    console.log('✅ Database document generated');

    // Save to JSON file
    const outputPath = path.join(__dirname, 'processed-exam-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(dbDocument, null, 2));
    
    console.log(`📁 Output saved to: ${outputPath}`);
    console.log(`📊 Summary:
    - Exam: ${merged.data?.title}
    - Sections: ${merged.data?.sections?.length}
    - Questions: ${merged.data?.sections?.reduce((sum, sec) => sum + sec.questions.length, 0)}
    - Duration: ${merged.data?.duration} seconds`);

  } catch (error) {
    console.error('❌ Error processing mock data:', error);
    process.exit(1);
  }
}

processMockData();