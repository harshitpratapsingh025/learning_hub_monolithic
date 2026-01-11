import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Exam } from '../modules/content/exams/schemas/exam.schema';
import { Subject } from '../modules/content/subjects/schemas/subject.schema';
import { Chapter } from '../modules/content/subjects/schemas/chapter.schema';
import { Topic } from '../modules/content/subjects/schemas/topic.schema';
import { Question } from '../modules/content/questions/schemas/question.schema';
import { Paper } from '../modules/tests/schemas/paper.schema';
import { PaperSection } from '../modules/tests/schemas/paper-question.schema';
import * as fs from 'fs';
import * as path from 'path';
import { Types } from 'mongoose';

async function seedFromProcessedData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const examModel: Model<Exam> = app.get(getModelToken(Exam.name));
  const subjectModel: Model<Subject> = app.get(getModelToken(Subject.name));
  const chapterModel: Model<Chapter> = app.get(getModelToken(Chapter.name));
  const topicModel: Model<Topic> = app.get(getModelToken(Topic.name));
  const questionModel: Model<Question> = app.get(getModelToken(Question.name));
  const paperModel: Model<Paper> = app.get(getModelToken(Paper.name));
  const paperSectionModel: Model<PaperSection> = app.get(getModelToken(PaperSection.name));

  console.log('🌱 Starting seed from processed data...');

  // Read processed data
  const dataPath = path.join(__dirname, 'processed-exam-data.json');
  const processedData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  try {
    // 1. Create Exam
    console.log('📝 Creating exam...');
    const examData = processedData.exam;
    
    const existingExam = await examModel.findOne({ code: examData.code || 'SSC_GD' });
    let exam;
    
    if (!existingExam) {
      exam = await examModel.create({
        name: examData.name,
        code: examData.code || 'SSC_GD',
        description: examData.description,
        shortName: examData.shortName,
        icon: examData.icon,
        isActive: examData.isActive
      });
      console.log('✅ Exam created');
    } else {
      exam = existingExam;
      console.log('ℹ️ Exam already exists');
    }

    // 2. Create Subjects from sections
    console.log('📚 Creating subjects...');
    let subjectsCreated = 0;
    const subjectMap = new Map();
    
    for (const sectionData of processedData.sections) {
      const existingSubject = await subjectModel.findOne({
        examId: exam._id,
        name: sectionData.title
      });
      
      if (!existingSubject) {
        const subject = await subjectModel.create({
          examId: exam._id,
          name: sectionData.title,
          description: `${sectionData.title} section`,
          displayOrder: sectionData.sectionNumber || 0
        });
        subjectMap.set(sectionData._id, subject._id);
        subjectsCreated++;
      } else {
        subjectMap.set(sectionData._id, existingSubject._id);
      }
    }
    console.log(`✅ ${subjectsCreated} subjects created`);

    // 3. Create Chapters and Topics
    console.log('📖 Creating chapters and topics...');
    let chaptersCreated = 0;
    let topicsCreated = 0;
    const chapterMap = new Map();
    const topicMap = new Map();
    
    // Extract unique chapters and topics from questions
    const uniqueChapters = new Map();
    const uniqueTopics = new Map();
    
    for (const questionData of processedData.questions) {
      if (questionData.chapterId && questionData.chapterName) {
        uniqueChapters.set(questionData.chapterId, {
          id: questionData.chapterId,
          name: questionData.chapterName,
          subjectId: questionData.subjectId
        });
      }
      if (questionData.topicId && questionData.topicName) {
        uniqueTopics.set(questionData.topicId, {
          id: questionData.topicId,
          name: questionData.topicName,
          chapterId: questionData.chapterId
        });
      }
    }
    
    // Create chapters
    for (const chapterData of uniqueChapters.values()) {
      const subjectId = subjectMap.get(chapterData.subjectId) || 
        Array.from(subjectMap.values())[0]; // fallback to first subject
      
      const existingChapter = await chapterModel.findOne({
        _id: new Types.ObjectId(chapterData.id)
      });
      
      if (!existingChapter && subjectId) {
        const chapter = await chapterModel.create({
          _id: new Types.ObjectId(chapterData.id),
          subjectId: subjectId,
          name: chapterData.name,
          isActive: true
        });
        chapterMap.set(chapterData.id, chapter._id);
        chaptersCreated++;
      } else if (existingChapter) {
        chapterMap.set(chapterData.id, existingChapter._id);
      }
    }
    
    // Create topics
    for (const topicData of uniqueTopics.values()) {
      const chapterId = chapterMap.get(topicData.chapterId);
      
      const existingTopic = await topicModel.findOne({
        _id: new Types.ObjectId(topicData.id)
      });
      
      if (!existingTopic && chapterId) {
        const topic = await topicModel.create({
          _id: new Types.ObjectId(topicData.id),
          chapterId: chapterId,
          name: topicData.name,
          isActive: true
        });
        topicMap.set(topicData.id, topic._id);
        topicsCreated++;
      } else if (existingTopic) {
        topicMap.set(topicData.id, existingTopic._id);
      }
    }
    
    console.log(`✅ ${chaptersCreated} chapters created`);
    console.log(`✅ ${topicsCreated} topics created`);

    // 4. Create Questions
    console.log('❓ Creating questions...');
    let questionsCreated = 0;
    
    for (const questionData of processedData.questions) {
      const existingQuestion = await questionModel.findById(questionData._id);
      
      if (!existingQuestion) {
        // Find subject ID from section mapping
        // Find which section contains this question
        let sectionId = null;
        for (const section of processedData.sections) {
          if (section.questionIds?.includes(questionData._id)) {
            sectionId = section._id;
            break;
          }
        }
        const subjectId = subjectMap.get(sectionId);
        
        if (subjectId) {
          const chapterId = chapterMap.get(questionData.chapterId);
          const topicId = topicMap.get(questionData.topicId);
          
          await questionModel.create({
            _id: new Types.ObjectId(questionData._id),
            examId: exam._id,
            subjectId: subjectId,
            chapterId: chapterId,
            topicId: topicId,
            type: questionData.type,
            marks: questionData.marks,
            content: questionData.content,
            hasImage: questionData.hasImage,
            correctOption: questionData.correctOption,
            multiCorrectOptions: questionData.multiCorrectOptions,
            range: questionData.range,
            solution: questionData.solution,
            tags: questionData.tags || [],
            createdAt: new Date(questionData.createdAt)
          });
          questionsCreated++;
        }
      }
    }
    console.log(`✅ ${questionsCreated} questions created`);

    // 5. Create Paper
    console.log('📄 Creating paper...');
    const paperData = processedData.paper;
    
    // Calculate totals from sections
    const totalQuestions = processedData.sections.reduce((sum, section) => sum + (section.questionIds?.length || 0), 0);
    const totalMarks = processedData.sections.reduce((sum, section) => sum + (section.maxMarks || 0), 0);
    
    const existingPaper = await paperModel.findOne({
      examId: exam._id,
      paperName: paperData.paperName
    });

    let paper;
    if (!existingPaper) {
      paper = await paperModel.create({
        examId: exam._id,
        title: paperData.title,
        code: paperData.code,
        examType: paperData.examType,
        isPreviousYear: paperData.isPreviousYear,
        year: paperData.year,
        shift: paperData.shift,
        course: paperData.course,
        paperName: paperData.paperName,
        durationMinutes: paperData.durationMinutes,
        totalQuestions,
        totalMarks,
        sectionTimeShared: paperData.sectionTimeShared,
        supportedLanguages: paperData.supportedLanguages,
        cutoffs: paperData.cutoffs,
        isActive: paperData.isActive
      });
      console.log('✅ Paper created');

      // 6. Create Paper Sections
      console.log('🔗 Creating paper sections...');
      const paperSections = [];

      for (const sectionData of processedData.sections) {
        if (sectionData.questionIds?.length > 0) {
          paperSections.push({
            paperId: paper._id,
            sectionId: sectionData._id,
            sectionName: sectionData.title,
            isOptional: sectionData.isOptional || false,
            isMandatory: sectionData.isMandatory !== false,
            questionIds: sectionData.questionIds.map(id => new Types.ObjectId(id)),
            displayOrder: sectionData.sectionNumber || 0
          });
        }
      }

      if (paperSections.length > 0) {
        await paperSectionModel.insertMany(paperSections);
        console.log(`✅ ${paperSections.length} paper sections created`);
      }
    } else {
      console.log('ℹ️ Paper already exists');
    }

    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   ✅ Processed data seed completed successfully!         ║
    ║                                                           ║
    ║   📝 1 Exam created/updated                              ║
    ║   📚 ${subjectsCreated} Subjects created                                ║
    ║   📖 ${chaptersCreated} Chapters created                               ║
    ║   🏷️  ${topicsCreated} Topics created                                  ║
    ║   ❓ ${questionsCreated} Questions created                              ║
    ║   📄 1 Paper created                                     ║
    ║   🔗 Paper sections linked                              ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

seedFromProcessedData().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});