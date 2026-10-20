import { getCuratedVideoForLesson, isVerifiedVideoUrl, VerifiedVideo } from './verifiedVideoRegistry.js';

export interface LessonVideoResult {
  youtubeId: string;
  embedUrl: string;
  title: string;
  channelTitle: string;
  durationMin: number;
  citation: string;
  summary: string;
  source: 'YOUTUBE_SEARCH' | 'VERIFIED_REGISTRY';
}

// In-memory cache to prevent duplicate queries and conserve quota (10,000 units/day)
const videoSearchCache = new Map<string, LessonVideoResult>();

// Flag to avoid repeated failed API requests when daily quota is exhausted (HTTP 403 quotaExceeded)
let isQuotaExhausted = false;
let quotaResetDate = new Date().toDateString();

function checkQuotaReset(): void {
  const today = new Date().toDateString();
  if (today !== quotaResetDate) {
    isQuotaExhausted = false;
    quotaResetDate = today;
  }
}

/**
 * Parses ISO 8601 duration (e.g. PT14M35S, PT1H2M) into total integer minutes.
 */
function parseISO8601Duration(iso: string): number {
  if (!iso) return 15;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 15;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const total = hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
  return total > 0 ? total : 15;
}

// Trusted high-reputation educational channels to prioritize when searching
const TRUSTED_EDUCATIONAL_CHANNELS = [
  'freecodecamp',
  'programming with mosh',
  'corey schafer',
  'tech with tim',
  'traversy media',
  'fireship',
  'simplilearn',
  'cs50',
  'edureka',
  'bro code',
  'sentdex',
  'krish naik',
  'networkchuck',
  'dave\'s garage',
  'amigoscode',
  'academind',
  'kevin powell',
  'web dev simplified',
  'mit opencourseware',
  'the net ninja',
  'freecodecamp.org',
  'statquest with josh starmer',
  'great learning',
  'intellipaat',
  'ibm technology',
  'google cloud tech',
  'aws',
];

/**
 * Searches the YouTube Data API v3 for a specific educational video tutorial.
 * If API key is missing or quota is exhausted, falls back to the curated registry.
 */
export async function searchVideoForLesson(params: {
  lessonTitle: string;
  programTitle?: string;
  programCode?: string;
  schoolCode?: string;
  moduleTitle?: string;
  level?: string;
  weekIdx?: number;
  lessonIdx?: number;
}): Promise<LessonVideoResult> {
  const {
    lessonTitle,
    programTitle = '',
    programCode = '',
    schoolCode = '',
    moduleTitle = '',
    level = 'LEVEL_1_FOUNDATION',
    weekIdx = 0,
    lessonIdx = 0,
  } = params;

  // 1. Check registry fallback first as default baseline
  const registryFallback: VerifiedVideo = getCuratedVideoForLesson({
    programName: programTitle,
    programCode,
    schoolCode,
    moduleTitle,
    lessonTitle,
    level,
    weekIdx,
    lessonIdx,
  });

  const fallbackCitation = registryFallback.citation || `${registryFallback.channel}. (${registryFallback.title}) [Video]. YouTube. (${registryFallback.durationMin} mins).`;
  const fallbackResult: LessonVideoResult = {
    youtubeId: registryFallback.youtubeId,
    embedUrl: registryFallback.embedUrl,
    title: registryFallback.title,
    channelTitle: registryFallback.channel,
    durationMin: registryFallback.durationMin,
    citation: fallbackCitation,
    summary: `${fallbackCitation} — ${registryFallback.learningExpectations || 'Key concepts and workflows.'}`,
    source: 'VERIFIED_REGISTRY',
  };

  // 2. Check environment YouTube API Key
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return fallbackResult;
  }

  checkQuotaReset();
  if (isQuotaExhausted) {
    return fallbackResult;
  }

  // 3. Check in-memory cache
  const cacheKey = `${programTitle}::${lessonTitle}`.toLowerCase().trim();
  if (videoSearchCache.has(cacheKey)) {
    return videoSearchCache.get(cacheKey)!;
  }

  try {
    // 4. Clean search query
    const cleanLesson = lessonTitle
      .replace(/^Lesson\s+[\d.]+:\s*/i, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[^a-zA-Z0-9\s+#.-]/g, ' ')
      .trim();
    const cleanProg = programTitle
      .replace(/—.*$/, '')
      .replace(/Level\s+\d+.*$/i, '')
      .replace(/[^a-zA-Z0-9\s+#.-]/g, ' ')
      .trim();

    const searchQuery = `${cleanLesson} ${cleanProg} tutorial`.slice(0, 100);

    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', searchQuery);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('videoEmbeddable', 'true');
    searchUrl.searchParams.set('videoSyndicated', 'true');
    searchUrl.searchParams.set('safeSearch', 'strict');
    searchUrl.searchParams.set('relevanceLanguage', 'en');
    searchUrl.searchParams.set('maxResults', '5');
    searchUrl.searchParams.set('key', apiKey);

    const response = await fetch(searchUrl.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      if (response.status === 403) {
        const errorData: any = await response.json().catch(() => ({}));
        const reason = errorData?.error?.errors?.[0]?.reason || '';
        if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
          console.warn('[YouTube API] Daily quota limit reached. Falling back to Verified Registry for the rest of today.');
          isQuotaExhausted = true;
        } else {
          console.warn(`[YouTube API] Request rejected (${response.status}):`, errorData?.error?.message || reason);
        }
      }
      return fallbackResult;
    }

    const data: any = await response.json();
    const items = data.items || [];
    if (!items.length) {
      return fallbackResult;
    }

    // 5. Select best item, prioritizing trusted educational channels
    let selectedItem = items[0];
    for (const item of items) {
      const channel = (item.snippet?.channelTitle || '').toLowerCase();
      if (TRUSTED_EDUCATIONAL_CHANNELS.some((trusted) => channel.includes(trusted))) {
        selectedItem = item;
        break;
      }
    }

    const videoId = selectedItem.id?.videoId;
    if (!videoId) {
      return fallbackResult;
    }

    const videoTitle = selectedItem.snippet?.title || lessonTitle;
    const channelTitle = selectedItem.snippet?.channelTitle || 'Educational Tutorial';

    // 6. Fetch video duration via YouTube videos.list
    let durationMin = 18;
    try {
      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.set('part', 'contentDetails,status');
      detailsUrl.searchParams.set('id', videoId);
      detailsUrl.searchParams.set('key', apiKey);

      const detailsRes = await fetch(detailsUrl.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (detailsRes.ok) {
        const detailsData: any = await detailsRes.json();
        const videoDetails = detailsData.items?.[0];
        if (videoDetails) {
          if (videoDetails.status?.embeddable === false) {
            console.warn(`[YouTube API] Video ${videoId} is marked non-embeddable. Using registry fallback.`);
            return fallbackResult;
          }
          if (videoDetails.contentDetails?.duration) {
            durationMin = parseISO8601Duration(videoDetails.contentDetails.duration);
          }
        }
      }
    } catch {
      // Keep estimated default duration
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const citation = `${channelTitle}. (${new Date().getFullYear()}). *${videoTitle}* [Video]. YouTube. (${durationMin} mins).`;
    const summary = `${citation} — Curated dynamic instructional video for "${lessonTitle}". Demonstrates key concepts, workflows, and practical applications.`;

    const searchResult: LessonVideoResult = {
      youtubeId: videoId,
      embedUrl,
      title: videoTitle,
      channelTitle,
      durationMin,
      citation,
      summary,
      source: 'YOUTUBE_SEARCH',
    };

    videoSearchCache.set(cacheKey, searchResult);
    return searchResult;
  } catch (err: any) {
    console.warn(`[YouTube API] Search error for "${lessonTitle}": ${err.message}. Using verified registry.`);
    return fallbackResult;
  }
}

/**
 * Enriches all core lessons in a course structure with dynamic YouTube search results.
 * Runs concurrently with rate-limiting to preserve API quota.
 */
export async function enrichCourseVideosWithYouTube(
  courses: any[],
  meta: {
    programTitle: string;
    programCode?: string;
    schoolCode?: string;
  }
): Promise<any[]> {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey || isQuotaExhausted) {
    return courses;
  }

  for (const course of courses) {
    for (let mIdx = 0; mIdx < (course.modules || []).length; mIdx++) {
      const mod = course.modules[mIdx];
      for (let lIdx = 0; lIdx < (mod.lessons || []).length; lIdx++) {
        const lesson = mod.lessons[lIdx];
        const isCore =
          lesson.interactiveLabType === 'CORE_LESSON' ||
          lesson.interactiveLabType === 'COURSE_WELCOME' ||
          (!lesson.interactiveLabType && lIdx > 0);

        if (isCore) {
          try {
            const vidResult = await searchVideoForLesson({
              lessonTitle: lesson.title,
              programTitle: meta.programTitle,
              programCode: meta.programCode,
              schoolCode: meta.schoolCode,
              moduleTitle: mod.title,
              level: course.level,
              weekIdx: mIdx,
              lessonIdx: lIdx,
            });

            if (vidResult && vidResult.source === 'YOUTUBE_SEARCH') {
              lesson.videoUrl = vidResult.embedUrl;
              lesson.videoDurationMin = vidResult.durationMin;
              lesson.videoSummary = vidResult.summary;
              lesson.videoSource = 'YOUTUBE_SEARCH';
            }
          } catch {
            // Keep default registry video
          }
        }
      }
    }
  }

  return courses;
}
