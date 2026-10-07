import prisma from '../config/prisma.js';
import { getAIProvider } from './ai/aiProvider.js';
import {
  getCuratedVideoForLesson,
  validateYouTubeVideo,
  VerifiedVideo,
} from './verifiedVideoRegistry.js';

export interface VideoCurationResult {
  videoUrl: string;
  videoDurationMin: number;
  videoSummary: string;
  keyTimestamps: Array<{ time: string; title: string }>;
}

export class VideoCuratorService {
  /**
   * Curates a verified, high quality educational video tutorial embed for a lesson topic.
   * Ensures that only validated, non-broken, domain-relevant YouTube videos are ever embedded.
   */
  async curateLessonVideo(params: {
    lessonId: string;
    lessonTitle: string;
    moduleTitle: string;
    courseTitle: string;
    programName: string;
    programCode?: string;
    schoolCode?: string;
    weekIdx?: number;
    lessonIdx?: number;
  }): Promise<VideoCurationResult> {
    const {
      lessonId,
      lessonTitle,
      moduleTitle,
      courseTitle,
      programName,
      programCode,
      schoolCode,
      weekIdx = 0,
      lessonIdx = 0,
    } = params;

    // 1. Get domain-matched verified video from our guaranteed registry
    const registeredVideo: VerifiedVideo = getCuratedVideoForLesson({
      programName,
      programCode,
      schoolCode,
      moduleTitle,
      lessonTitle,
      weekIdx,
      lessonIdx,
    });

    let selectedVideoId = registeredVideo.youtubeId;
    let selectedDuration = registeredVideo.durationMin;
    let selectedSummary = registeredVideo.summary;
    let selectedTimestamps: Array<{ time: string; title: string }> = [
      { time: '00:00', title: `${lessonTitle} Overview` },
      { time: '04:30', title: 'Core Concepts & Tool Walkthrough' },
      { time: '11:15', title: 'Hands-on Practice & Application' },
    ];

    // 2. Try querying AI for contextual timestamps and summary, or an alternative verified video
    try {
      const provider = getAIProvider();
      const prompt = `You are the Lead Instructional Designer and Digital Media Curator at STEMPACT Academy.
We need a verified, practical educational video tutorial for this lesson:
- Program: "${programName}"
- Course: "${courseTitle}"
- Module: "${moduleTitle}"
- Lesson: "${lessonTitle}"

Primary Registered Video:
- YouTube ID: "${registeredVideo.youtubeId}"
- Title: "${registeredVideo.title}" (${registeredVideo.channel})

Task:
Provide 2-3 sentences of educational summary for this lesson and 3 practical timestamps.
If you know a strictly verified, active YouTube ID that is even more specific to "${lessonTitle}", you may suggest it. Otherwise keep "${registeredVideo.youtubeId}".

Respond ONLY with valid JSON:
{
  "youtubeId": "${registeredVideo.youtubeId}",
  "videoDurationMin": ${registeredVideo.durationMin},
  "videoSummary": "2-3 sentences explaining the key concepts demonstrated in the lesson.",
  "keyTimestamps": [
    { "time": "00:00", "title": "Introduction" },
    { "time": "05:00", "title": "Core Demonstration" },
    { "time": "12:00", "title": "Practical Lab" }
  ]
}`;

      const aiRes = await provider.generateText(prompt, { temperature: 0.1 });
      let jsonStr = aiRes.text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonStr);

      if (parsed.youtubeId && typeof parsed.youtubeId === 'string') {
        const candidateId = parsed.youtubeId.trim();
        // If AI suggested a different ID, validate via YouTube oEmbed first!
        if (candidateId !== registeredVideo.youtubeId) {
          const isValid = await validateYouTubeVideo(candidateId);
          if (isValid) {
            selectedVideoId = candidateId;
          } else {
            console.warn(`[VideoCurator] AI suggested invalid YouTube ID "${candidateId}", keeping verified ID "${registeredVideo.youtubeId}"`);
            selectedVideoId = registeredVideo.youtubeId;
          }
        }
      }

      if (parsed.videoSummary && typeof parsed.videoSummary === 'string' && parsed.videoSummary.length > 20) {
        selectedSummary = parsed.videoSummary.trim();
      }
      if (parsed.videoDurationMin && Number(parsed.videoDurationMin) > 0) {
        selectedDuration = Number(parsed.videoDurationMin);
      }
      if (Array.isArray(parsed.keyTimestamps) && parsed.keyTimestamps.length > 0) {
        selectedTimestamps = parsed.keyTimestamps;
      }
    } catch (err: any) {
      console.warn(`[VideoCurator] AI annotation note for "${lessonTitle}": ${err.message}. Using registered defaults.`);
    }

    const embedUrl = `https://www.youtube.com/embed/${selectedVideoId}`;
    const curationResult: VideoCurationResult = {
      videoUrl: embedUrl,
      videoDurationMin: selectedDuration,
      videoSummary: selectedSummary,
      keyTimestamps: selectedTimestamps,
    };

    // Update lesson in DB
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoUrl: curationResult.videoUrl,
        videoDurationMin: curationResult.videoDurationMin,
        videoSummary: curationResult.videoSummary,
      },
    });

    return curationResult;
  }

  /**
   * Batch curates videos for all lessons in a program.
   * If `overwrite` is true, replaces existing videos (fixing broken/mismatched links).
   */
  async curateProgramVideos(programId: string, overwrite: boolean = false): Promise<{ totalCurated: number }> {
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        school: true,
        courses: {
          orderBy: { order: 'asc' },
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!program) {
      throw new Error('Program not found.');
    }

    let count = 0;
    for (let cIdx = 0; cIdx < program.courses.length; cIdx++) {
      const course = program.courses[cIdx];
      for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
        const module = course.modules[mIdx];
        for (let lIdx = 0; lIdx < module.lessons.length; lIdx++) {
          const lesson = module.lessons[lIdx];

          // Curate if lesson lacks video, or if overwrite flag is enabled
          if (!lesson.videoUrl || overwrite) {
            await this.curateLessonVideo({
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              moduleTitle: module.title,
              courseTitle: course.title,
              programName: program.name,
              programCode: program.code,
              schoolCode: program.school?.code || '',
              weekIdx: mIdx,
              lessonIdx: lIdx,
            });
            count++;
          }
        }
      }
    }

    return { totalCurated: count };
  }
}

export const videoCuratorService = new VideoCuratorService();
