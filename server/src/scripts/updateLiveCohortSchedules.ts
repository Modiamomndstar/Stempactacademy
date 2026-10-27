import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const resolveCohortSchedule = (programName: string, programCode: string, cohortName: string) => {
  const text = `${programName || ''} ${programCode || ''} ${cohortName || ''}`.toLowerCase();

  // 1. Kids (Ages 7-12)
  if (text.includes('kid') || (text.includes('young') && !text.includes('teen'))) {
    return {
      schedule: 'Saturdays (10:00 AM – 1:00 PM WAT - Junior Discovery Lab)',
      mode: 'Onsite Kids Discovery Hub & Interactive Lab',
    };
  }
  // 2. Teens (Ages 13-17) - 30 min buffer after morning kids session
  if (text.includes('teen')) {
    return {
      schedule: 'Saturdays (1:30 PM – 4:30 PM WAT - Teen Code Studio)',
      mode: 'Onsite Teen Studio & Interactive Lab',
    };
  }
  // 3. AI for Educators & Instructional Leadership
  if (text.includes('educator') || text.includes('teacher') || text.includes('instructional')) {
    return {
      schedule: 'Saturdays Only (10:30 AM – 4:00 PM WAT - Educator Masterclass)',
      mode: 'Hybrid (Onsite Executive Seminar & Interactive Stream)',
    };
  }
  // 4. Solar & Renewable Clean Energy
  if (text.includes('solar') || text.includes('clean energy') || text.includes('energy') || text.includes('install')) {
    return {
      schedule: 'Mondays & Thursdays (10:00 AM – 1:30 PM WAT - Daylight PV Practicum)',
      mode: 'Onsite Technical Workshop & Field Practicum',
    };
  }
  // 5. Computer Systems & Hardware Engineering / Repair
  if (text.includes('repair') || (text.includes('system') && text.includes('hardware')) || text.includes('pc')) {
    return {
      schedule: 'Tuesdays & Thursdays (10:00 AM – 1:30 PM WAT - Workbench Practicum)',
      mode: 'Onsite Technical Workshop & Repair Practicum',
    };
  }
  // 6. Robotics, IoT & Embedded Systems
  if (text.includes('robot') || text.includes('iot') || text.includes('hardware') || text.includes('embed')) {
    return {
      schedule: 'Wednesdays (2:00 PM – 5:00 PM) & Saturdays (10:00 AM – 1:30 PM WAT - Lab Practicum)',
      mode: 'Onsite Laboratory Intensive & Interactive Practice',
    };
  }
  // 7. AI for Digital Marketing
  if (text.includes('market') || text.includes('growth') || text.includes('seo')) {
    return {
      schedule: 'Mondays & Wednesdays (2:30 PM – 5:00 PM WAT)',
      mode: 'Hybrid (Interactive Computer Lab & Live Campaigns)',
    };
  }
  // 8. AI Digital Design & Content Creation
  if (text.includes('design') || text.includes('creative') || text.includes('content') || text.includes('media')) {
    return {
      schedule: 'Tuesdays & Thursdays (10:30 AM – 1:00 PM WAT)',
      mode: 'Hybrid (Onsite Design Studio & Virtual Portfolio)',
    };
  }
  // 9. Startup Lab / Venture / Incubator
  if (text.includes('startup') || text.includes('venture') || (text.includes('lab') && text.includes('incubator'))) {
    return {
      schedule: 'Fridays (2:00 PM – 5:00 PM WAT - Venture Standup & Founder Sprints)',
      mode: 'Hybrid Venture Studio',
    };
  }
  // 10. Python Software vs Python Data tracks
  if (text.includes('data') || text.includes('analyt') || text.includes('machine learning')) {
    return {
      schedule: 'Tuesdays & Thursdays (2:00 PM – 5:00 PM WAT)',
      mode: 'Hybrid (Onsite Ile-Ife Hub & Virtual Interactive)',
    };
  }
  if (text.includes('python') && text.includes('software')) {
    return {
      schedule: 'Mondays & Wednesdays (2:00 PM – 5:00 PM WAT)',
      mode: 'Hybrid (Onsite Ile-Ife Hub & Virtual Interactive)',
    };
  }
  // Web / Software
  if (text.includes('web') || text.includes('full') || text.includes('fse')) {
    return {
      schedule: 'Mondays & Wednesdays (10:30 AM – 1:30 PM) & Saturdays (10:00 AM – 1:00 PM WAT)',
      mode: 'Hybrid (Onsite Ile-Ife Hub & Virtual Interactive)',
    };
  }

  return {
    schedule: 'Mondays & Wednesdays (2:00 PM – 5:00 PM WAT)',
    mode: 'Hybrid (Onsite Ile-Ife Hub & Virtual Interactive)',
  };
};

async function main() {
  console.log('🔄 Fetching all existing cohorts...');
  const cohorts = await prisma.cohort.findMany({
    include: {
      program: true,
    },
  });

  console.log(`Found ${cohorts.length} cohorts to audit and update.`);

  for (const c of cohorts) {
    const progName = c.program?.name || '';
    const progCode = c.program?.code || '';
    const newTiming = resolveCohortSchedule(progName, progCode, c.name);

    await prisma.cohort.update({
      where: { id: c.id },
      data: {
        schedule: newTiming.schedule,
        mode: newTiming.mode,
      },
    });

    console.log(`✅ Updated [${c.cohortCode}]: "${c.name}" -> ${newTiming.schedule}`);
  }

  console.log('🎉 All cohort schedules successfully updated to 10:00 AM – 5:30 PM compliant slots!');
}

main()
  .catch((e) => {
    console.error('Error updating cohort schedules:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
