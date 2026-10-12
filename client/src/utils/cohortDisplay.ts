/**
 * Utilities for parsing and formatting Cohort intake identities,
 * class section streams, program titles, and academic levels across public and admin portals.
 */

export interface ParsedCohortDisplay {
  programName: string;
  cohortName: string;
  sectionName: string;
  levelLabel: string;
}

/**
 * Extracts distinct Program Name, Cohort Intake Name, and Class Section Stream
 * from a raw cohort record.
 * 
 * Examples handled:
 * 1. "Full-Stack Software Engineering — 2026 Cohort 1 (Class Alpha)"
 *    -> Program: Full-Stack Software Engineering
 *    -> Cohort: 2026 Cohort 1
 *    -> Section: Class Alpha
 * 
 * 2. "2026 Cohort 1 (Class Alpha)"
 *    -> Cohort: 2026 Cohort 1
 *    -> Section: Class Alpha
 * 
 * 3. "Class Alpha" (where name is just the section label)
 *    -> Program: from cohort.program?.name
 *    -> Cohort: inferred from academicSession or fallback "2026 Cohort 1"
 *    -> Section: Class Alpha
 * 
 * 4. "2026 Cohort 1" (where name is just the cohort intake)
 *    -> Program: from cohort.program?.name
 *    -> Cohort: 2026 Cohort 1
 *    -> Section: Main Stream
 */
export function parseCohortDisplay(cohort: {
  name?: string;
  level?: string;
  levelCode?: string;
  academicSession?: { name?: string; code?: string };
  program?: { name?: string; code?: string; school?: { name?: string } };
}): ParsedCohortDisplay {
  const rawName = (cohort.name || '').trim();
  const knownProgName = cohort.program?.name || '';

  let programName = knownProgName;
  let remaining = rawName;

  // 1. Separate Program Name if embedded with " — " or " - "
  if (remaining.includes(' — ')) {
    const parts = remaining.split(' — ');
    if (parts.length >= 2) {
      if (!programName) programName = parts[0].trim();
      remaining = parts.slice(1).join(' — ').trim();
    }
  } else if (remaining.includes(' - ') && !remaining.toLowerCase().includes('cohort -')) {
    const parts = remaining.split(' - ');
    if (parts.length >= 2 && knownProgName && parts[0].toLowerCase().includes(knownProgName.toLowerCase())) {
      remaining = parts.slice(1).join(' - ').trim();
    }
  } else if (knownProgName && remaining.toLowerCase().startsWith(knownProgName.toLowerCase())) {
    remaining = remaining.slice(knownProgName.length).trim();
    if (remaining.startsWith('—') || remaining.startsWith('-')) {
      remaining = remaining.slice(1).trim();
    }
  }

  // 2. Separate Class Section (e.g., "(Class Alpha)", "(Section A)", or leading "Class Alpha")
  let sectionName = '';
  const parenMatch = remaining.match(/\(([^)]+)\)/);
  if (parenMatch) {
    sectionName = parenMatch[1].trim();
    remaining = remaining.replace(/\(([^)]+)\)/, '').trim();
  }

  // 3. What is left in remaining? Could be "2026 Cohort 1", "Class Alpha", etc.
  let cohortName = remaining.trim();

  // If remaining looks purely like a section name (e.g. "Class Alpha", "Section A", "Weekend Stream")
  // and has no mention of "Cohort", "Batch", or Year digits
  const looksLikeSectionOnly = /^(class\s+[a-z0-9]+|section\s+[a-z0-9]+)/i.test(cohortName);
  const hasCohortWordOrDigits = /(cohort|batch|intake|\b202[0-9]\b)/i.test(cohortName);

  if (looksLikeSectionOnly && !hasCohortWordOrDigits) {
    if (!sectionName) sectionName = cohortName;
    // Derive cohortName from academicSession or fallback
    if (cohort.academicSession?.name) {
      const yearMatch = cohort.academicSession.name.match(/\b(202[0-9])\b/);
      cohortName = yearMatch ? `${yearMatch[1]} Cohort 1` : cohort.academicSession.name;
    } else {
      cohortName = '2026 Cohort 1';
    }
  }

  // If cohortName is empty, fallback gracefully
  if (!cohortName) {
    cohortName = cohort.academicSession?.name || '2026 Cohort 1';
  }

  // Normalize Cohort Intake Name display e.g. "2026 Cohort 1"
  if (!cohortName.toLowerCase().includes('cohort') && !cohortName.toLowerCase().includes('intake')) {
    if (/\b202[0-9]\b/.test(cohortName)) {
      // Already has a year e.g. "2026", clarify as "2026 Cohort 1"
      if (/^202[0-9]$/.test(cohortName)) {
        cohortName = `${cohortName} Cohort 1`;
      }
    }
  }

  // Fallback section name if still blank
  if (!sectionName) {
    sectionName = 'Main Stream';
  }

  // Fallback program name
  if (!programName) {
    programName = cohort.program?.name || 'Academic Program';
  }

  // 4. Academic Level Formatting (Foundation to Specialist)
  const levelLabel = formatAcademicLevel(cohort.level, cohort.levelCode);

  return {
    programName,
    cohortName,
    sectionName,
    levelLabel,
  };
}

/**
 * Normalizes academic level label display e.g. "Level 1: Foundation"
 */
export function formatAcademicLevel(level?: string, levelCode?: string): string {
  if (levelCode) {
    switch (levelCode) {
      case 'LEVEL_1_FOUNDATION':
        return 'Level 1 (Foundation)';
      case 'LEVEL_2_INTERMEDIATE':
        return 'Level 2 (Intermediate)';
      case 'LEVEL_3_ADVANCED':
        return 'Level 3 (Advanced)';
      case 'LEVEL_4_SPECIALIST':
        return 'Level 4 (Mastery / Specialist)';
    }
  }
  if (level) {
    if (/level\s*1/i.test(level)) return 'Level 1 (Foundation)';
    if (/level\s*2/i.test(level)) return 'Level 2 (Intermediate)';
    if (/level\s*3/i.test(level)) return 'Level 3 (Advanced)';
    if (/level\s*4/i.test(level)) return 'Level 4 (Mastery)';
    return level;
  }
  return 'Level 1 (Foundation)';
}
