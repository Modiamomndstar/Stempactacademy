import prismaModule from '../dist/config/prisma.js';
const prisma = prismaModule.default || prismaModule;
import { getCuratedVideoForLesson } from '../dist/services/verifiedVideoRegistry.js';

async function main() {
  console.log('--- SYNCING HARDWARE CURRICULUM & COHORT ANCHORS ---');

  // 1. Find the Computer Hardware Engineering program
  const hardwareProgram = await prisma.program.findFirst({
    where: {
      OR: [
        { name: { contains: 'Computer Hardware', mode: 'insensitive' } },
        { code: { contains: 'HARD', mode: 'insensitive' } },
      ],
    },
    include: {
      curricula: {
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      },
      cohorts: true,
      courses: {
        include: {
          modules: {
            include: {
              lessons: { orderBy: { order: 'asc' } },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!hardwareProgram) {
    console.log('No Computer Hardware Engineering program found.');
    return;
  }

  console.log(`Found program: ${hardwareProgram.name} (${hardwareProgram.id})`);

  // Ensure canonical Curriculum & CurriculumVersion exist
  let latestCv = hardwareProgram.curricula?.[0]?.versions?.[0];
  if (!latestCv) {
    let curriculum = await prisma.curriculum.findFirst({
      where: { programId: hardwareProgram.id },
    });
    if (!curriculum) {
      curriculum = await prisma.curriculum.create({
        data: {
          programId: hardwareProgram.id,
          title: `${hardwareProgram.name} - Canonical Curriculum`,
          level: hardwareProgram.level || 'LEVEL_1_FOUNDATION',
          totalHours: hardwareProgram.contactHours || 72,
          theoryPracticalRatio: '30:70',
          status: 'APPROVED',
          version: 1,
        },
      });
    }
    latestCv = await prisma.curriculumVersion.create({
      data: {
        curriculumId: curriculum.id,
        versionNumber: 1,
        dataSnapshot: {},
        status: 'APPROVED',
        changelog: 'Initial ratified curriculum version with verified hardware video catalog.',
      },
    });
    console.log(`Created new curriculumVersion: ${latestCv.id}`);
  }

  // Link all cohorts of this program to latestCv if not linked
  for (const cohort of hardwareProgram.cohorts) {
    if (!cohort.curriculumVersionId) {
      await prisma.cohort.update({
        where: { id: cohort.id },
        data: { curriculumVersionId: latestCv.id },
      });
      console.log(`Linked cohort ${cohort.name} (${cohort.cohortCode}) to curriculumVersion ${latestCv.id}`);
    }
  }

  // Link courses to latestCv
  await prisma.course.updateMany({
    where: { programId: hardwareProgram.id },
    data: { curriculumVersionId: latestCv.id },
  });

  // Now curate rich, distinct, verified videos for every lesson in this program
  let updatedCount = 0;
  for (const course of hardwareProgram.courses) {
    for (const [mIdx, mod] of course.modules.entries()) {
      for (const [lIdx, lesson] of mod.lessons.entries()) {
        const curated = getCuratedVideoForLesson({
          programName: hardwareProgram.name,
          programCode: hardwareProgram.code,
          schoolCode: 'RIOTH',
          moduleTitle: mod.title,
          lessonTitle: lesson.title,
          weekIdx: mIdx,
          lessonIdx: lIdx,
        });

        await prisma.lesson.update({
          where: { id: lesson.id },
          data: {
            videoUrl: curated.embedUrl,
            videoDurationMin: curated.durationMin,
            videoSummary: curated.summary,
          },
        });
        console.log(`Updated lesson: "${lesson.title}" -> Video: [${curated.title}] (${curated.embedUrl})`);
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} lessons with authentic hardware videos!`);
}

main().catch(console.error).finally(() => prisma.$disconnect?.());
