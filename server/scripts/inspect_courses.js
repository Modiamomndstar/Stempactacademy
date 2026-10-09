import prismaModule from '../dist/config/prisma.js';
const prisma = prismaModule.default || prismaModule;

async function main() {
  const cohorts = await prisma.cohort.findMany({
    select: {
      id: true,
      name: true,
      cohortCode: true,
      levelCode: true,
      level: true,
      programId: true,
      curriculumVersionId: true,
      program: { select: { id: true, name: true } },
      curriculumVersion: {
        select: {
          id: true,
          versionNumber: true,
          courses: {
            select: { id: true, title: true }
          }
        }
      }
    }
  });

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      title: true,
      programId: true,
      curriculumVersionId: true,
      modules: {
        select: {
          id: true,
          title: true,
          lessons: {
            select: { id: true, title: true, videoUrl: true }
          }
        }
      }
    }
  });

  console.log('=== COHORTS ===');
  console.log(JSON.stringify(cohorts, null, 2));
  console.log('=== COURSES ===');
  console.log(JSON.stringify(courses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect?.());
