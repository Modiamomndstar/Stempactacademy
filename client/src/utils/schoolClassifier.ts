/**
 * Dynamic classifier utilities to identify special academic school workflows,
 * such as Innovation & Startup Labs and Kids & Teens tracks.
 * 
 * Works dynamically with any existing or newly created school/program in the database.
 */

export interface SchoolLike {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
}

export interface ProgramLike {
  id?: string;
  code?: string | null;
  name?: string | null;
  schoolId?: string | null;
  school?: SchoolLike | null;
  isKidsTrack?: boolean | null;
  targetAgeGroup?: string | null;
}

/**
 * Checks if a School is an Innovation, Venture, or Startup Lab.
 */
export const isInnovationLabSchool = (school?: SchoolLike | null): boolean => {
  if (!school) return false;
  const code = (school.code || '').toUpperCase().trim();
  const name = (school.name || '').toLowerCase().trim();

  if (code === 'ISL' || code === 'VENTURE' || code === 'INNOVATION') {
    return true;
  }

  if (name.includes('innovation and startup') || name.includes('innovation & startup')) {
    return true;
  }

  if (name.includes('startup lab') || name.includes('venture lab') || name.includes('innovation lab') || name.includes('venture studio')) {
    return true;
  }

  return false;
};

/**
 * Checks if a Program belongs to an Innovation, Venture, or Startup Lab school.
 */
export const isInnovationLabProgram = (program?: ProgramLike | null): boolean => {
  if (!program) return false;
  if (isInnovationLabSchool(program.school)) return true;

  const progCode = (program.code || '').toUpperCase().trim();
  const progName = (program.name || '').toLowerCase().trim();

  if (progCode.startsWith('ISL-') || progCode.startsWith('VENTURE-')) {
    return true;
  }

  if (progName.includes('startup lab') || progName.includes('innovation lab') || progName.includes('hackathon lab')) {
    return true;
  }

  return false;
};

/**
 * Checks if a School or Program is a STEMPACT Kids & Teens track.
 */
export const isKidsTeensSchoolOrProgram = (
  school?: SchoolLike | null,
  program?: ProgramLike | null
): boolean => {
  if (program?.isKidsTrack) return true;
  const targetAge = (program?.targetAgeGroup || '').toUpperCase();
  if (targetAge.includes('KID') || targetAge.includes('TEEN') || targetAge.includes('7-') || targetAge.includes('8-')) {
    return true;
  }

  if (school) {
    const code = (school.code || '').toUpperCase().trim();
    const name = (school.name || '').toLowerCase().trim();

    if (code === 'SKT' || code === 'KIDS' || code === 'TEENS') return true;
    if (name.includes('kids and teens') || name.includes('kids & teens') || name.includes('junior')) return true;
  }

  return false;
};
