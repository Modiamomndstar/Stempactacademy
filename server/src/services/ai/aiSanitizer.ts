/**
 * STEMPACT Academy AI Safety & Prompt Injection Sanitizer
 * Protects against prompt escape, role hijack, and unauthorized instruction overrides.
 */

// Known prompt injection patterns and delimiter attack vectors
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|directions)/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)/gi,
  /you\s+are\s+now\s+(in\s+)?(developer\s+mode|unrestricted|god\s+mode|dan)/gi,
  /system\s*:\s*role\s*=\s*['"]?admin/gi,
  /<system>[\s\S]*?<\/system>/gi,
  /\[SYSTEM_INSTRUCTION\]/gi,
  /bypass\s+(all\s+)?(safety|filters|rules|guardrails)/gi,
  /forget\s+(your\s+)?(rules|instructions|identity)/gi,
];

export interface SanitizationResult {
  sanitized: string;
  isInjected: boolean;
  warnings: string[];
}

export function sanitizePromptInput(input: string): SanitizationResult {
  if (!input || typeof input !== 'string') {
    return { sanitized: '', isInjected: false, warnings: [] };
  }

  let sanitized = input;
  let isInjected = false;
  const warnings: string[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      isInjected = true;
      warnings.push(`Detected prompt injection pattern: ${pattern.source}`);
      sanitized = sanitized.replace(pattern, '[REDACTED_UNSAFE_INSTRUCTION]');
    }
  }

  // Remove potential dangerous prompt delimiters
  sanitized = sanitized
    .replace(/```(system|admin|override)/gi, '```')
    .replace(/\{\{\s*system[\s\S]*?\}\}/gi, '[REDACTED_SYSTEM_DIRECTIVE]')
    .trim();

  return {
    sanitized,
    isInjected,
    warnings,
  };
}
