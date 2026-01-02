import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/schemas';
import { Permission } from '../permissions/schemas';
import { User } from '../users/schemas/user.schema';
import { UserRole } from '../user-roles/schemas';
import { Exam } from '../content/exams/schemas/exam.schema';
import { Subject } from '../content/subjects/schemas/subject.schema';
import { Topic } from '../content/topics/schemas/topic.schema';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const roleModel: Model<Role> = app.get(getModelToken(Role.name));
  const permissionModel: Model<Permission> = app.get(
    getModelToken(Permission.name),
  );
  const userModel: Model<User> = app.get(getModelToken(User.name));
  const userRoleModel: Model<UserRole> = app.get(getModelToken(UserRole.name));
  const examModel: Model<Exam> = app.get(getModelToken(Exam.name));
  const subjectModel: Model<Subject> = app.get(getModelToken(Subject.name));
  const topicModel: Model<Topic> = app.get(getModelToken(Topic.name));

  console.log('🌱 Starting seed...');

  // 1. Create Permissions
  console.log('📋 Creating permissions...');
  const permissionsData = [
    // User permissions
    { name: 'users:create', resource: 'users', action: 'create' },
    { name: 'users:read', resource: 'users', action: 'read' },
    { name: 'users:update', resource: 'users', action: 'update' },
    { name: 'users:delete', resource: 'users', action: 'delete' },

    // Role permissions
    { name: 'roles:create', resource: 'roles', action: 'create' },
    { name: 'roles:read', resource: 'roles', action: 'read' },
    { name: 'roles:update', resource: 'roles', action: 'update' },
    { name: 'roles:delete', resource: 'roles', action: 'delete' },

    // Exam permissions
    { name: 'exams:create', resource: 'exams', action: 'create' },
    { name: 'exams:read', resource: 'exams', action: 'read' },
    { name: 'exams:update', resource: 'exams', action: 'update' },
    { name: 'exams:delete', resource: 'exams', action: 'delete' },

    // Subject permissions
    { name: 'subjects:create', resource: 'subjects', action: 'create' },
    { name: 'subjects:read', resource: 'subjects', action: 'read' },
    { name: 'subjects:update', resource: 'subjects', action: 'update' },
    { name: 'subjects:delete', resource: 'subjects', action: 'delete' },

    // Topic permissions
    { name: 'topics:create', resource: 'topics', action: 'create' },
    { name: 'topics:read', resource: 'topics', action: 'read' },
    { name: 'topics:update', resource: 'topics', action: 'update' },
    { name: 'topics:delete', resource: 'topics', action: 'delete' },

    // Question permissions
    { name: 'questions:create', resource: 'questions', action: 'create' },
    { name: 'questions:read', resource: 'questions', action: 'read' },
    { name: 'questions:update', resource: 'questions', action: 'update' },
    { name: 'questions:delete', resource: 'questions', action: 'delete' },
  ];

  const permissions: any = {};
  for (const permData of permissionsData) {
    let perm = await permissionModel.findOne({ name: permData.name });
    if (!perm) {
      perm = await permissionModel.create(permData);
    }
    permissions[permData.name] = perm;
  }
  console.log('✅ Permissions created');

  // 2. Create Roles
  console.log('👥 Creating roles...');
  const rolesData = [
    {
      name: 'admin',
      description: 'Full system access',
      permissions: Object.values(permissions).map((p: any) => p._id),
    },
    {
      name: 'student',
      description: 'Can access exams and questions',
      permissions: [
        'exams:read',
        'subjects:read',
        'topics:read',
        'questions:read',
      ].map((name) => permissions[name]._id),
    },
    {
      name: 'content_creator',
      description: 'Can create and manage content',
      permissions: [
        'exams:create',
        'exams:read',
        'exams:update',
        'subjects:create',
        'subjects:read',
        'subjects:update',
        'topics:create',
        'topics:read',
        'topics:update',
        'questions:create',
        'questions:read',
        'questions:update',
      ].map((name) => permissions[name]._id),
    },
  ];

  const roles: any = {};
  for (const roleData of rolesData) {
    let role = await roleModel.findOne({ name: roleData.name });
    if (!role) {
      role = await roleModel.create(roleData);
    } else {
      role.permissions = roleData.permissions;
      await role.save();
    }
    roles[roleData.name] = role;
  }
  console.log('✅ Roles created');

  // 3. Create Admin User
  console.log('👤 Creating admin user...');
  const adminEmail = 'admin@examplatform.com';
  let adminUser = await userModel.findOne({ email: adminEmail });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    adminUser = await userModel.create({
      fullName: 'System Administrator',
      email: adminEmail,
      passwordHash,
      isVerified: true,
      isActive: true,
      roles: [roles.admin._id],
    });

    await userRoleModel.create({
      userId: adminUser._id,
      roleId: roles.admin._id,
      assignedBy: adminUser._id,
    });

    console.log(`✅ Admin user created: ${adminEmail} / Admin@123`);
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // 4. Create Sample Student
  console.log('👤 Creating student user...');
  const studentEmail = 'student@examplatform.com';
  let studentUser = await userModel.findOne({ email: studentEmail });

  if (!studentUser) {
    const passwordHash = await bcrypt.hash('Student@123', 10);
    studentUser = await userModel.create({
      fullName: 'John Doe',
      email: studentEmail,
      passwordHash,
      isVerified: true,
      isActive: true,
      roles: [roles.student._id],
    });

    await userRoleModel.create({
      userId: studentUser._id,
      roleId: roles.student._id,
      assignedBy: adminUser._id,
    });

    console.log(`✅ Student user created: ${studentEmail} / Student@123`);
  } else {
    console.log('ℹ️  Student user already exists');
  }

  // 5. Create Sample Exams
  console.log('📝 Creating sample exams...');
  const examsData = [
    {
      name: 'SSC Combined Graduate Level',
      code: 'SSC_CGL',
      description: 'Combined Graduate Level examination by Staff Selection Commission',
    },
    {
      name: 'IBPS Bank PO',
      code: 'IBPS_PO',
      description: 'Probationary Officer examination by IBPS',
    },
  ];

  const exams: any = {};
  for (const examData of examsData) {
    let exam = await examModel.findOne({ code: examData.code });
    if (!exam) {
      exam = await examModel.create(examData);
    }
    exams[examData.code] = exam;
  }
  console.log('✅ Sample exams created');

  // 6. Create Subjects for SSC CGL
  console.log('📚 Creating subjects...');
  const subjectsData = [
    {
      examId: exams.SSC_CGL._id,
      name: 'General Intelligence and Reasoning',
      displayOrder: 1,
    },
    {
      examId: exams.SSC_CGL._id,
      name: 'General Awareness',
      displayOrder: 2,
    },
    {
      examId: exams.SSC_CGL._id,
      name: 'Quantitative Aptitude',
      displayOrder: 3,
    },
    {
      examId: exams.SSC_CGL._id,
      name: 'English Comprehension',
      displayOrder: 4,
    },
  ];

  const subjects: any = {};
  for (const subjectData of subjectsData) {
    let subject = await subjectModel.findOne({
      examId: subjectData.examId,
      name: subjectData.name,
    });
    if (!subject) {
      subject = await subjectModel.create(subjectData);
    }
    subjects[subjectData.name] = subject;
  }
  console.log('✅ Subjects created');

  // 7. Create Topics for Reasoning
  console.log('📖 Creating topics...');
  const topicsData = [
    {
      subjectId: subjects['General Intelligence and Reasoning']._id,
      name: 'Analogies',
      displayOrder: 1,
    },
    {
      subjectId: subjects['General Intelligence and Reasoning']._id,
      name: 'Classification',
      displayOrder: 2,
    },
    {
      subjectId: subjects['General Intelligence and Reasoning']._id,
      name: 'Series',
      displayOrder: 3,
    },
    {
      subjectId: subjects['General Intelligence and Reasoning']._id,
      name: 'Coding-Decoding',
      displayOrder: 4,
    },
  ];

  const topics: any = {};
  for (const topicData of topicsData) {
    let topic = await topicModel.findOne({
      subjectId: topicData.subjectId,
      name: topicData.name,
    });
    if (!topic) {
      topic = await topicModel.create(topicData);
    }
    topics[topicData.name] = topic;
  }
  console.log('✅ Topics created');

  console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   ✅ Seed completed successfully!                        ║
    ║                                                           ║
    ║   👤 Admin: ${adminEmail} / Admin@123           ║
    ║   👤 Student: ${studentEmail} / Student@123  ║
    ║                                                           ║
    ║   📝 ${examsData.length} Exams created                                    ║
    ║   📚 ${subjectsData.length} Subjects created                              ║
    ║   📖 ${topicsData.length} Topics created                                  ║
    ║   👥 ${rolesData.length} Roles created                                    ║
    ║   🔑 ${permissionsData.length} Permissions created                        ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `);

  await app.close();
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});