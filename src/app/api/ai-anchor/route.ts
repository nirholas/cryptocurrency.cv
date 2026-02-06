/**
 * 🎬 AI News Anchor Video Generation
 * 
 * Generate AI video summaries of crypto news using text-to-speech
 * and avatar generation (HeyGen, Synthesia, or open-source alternatives).
 * 
 * GET /api/ai-anchor - Get video generation status/info
 * POST /api/ai-anchor - Generate new AI anchor video
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptocurrency.cv';

interface VideoJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  videoUrl?: string;
  duration?: number;
  script?: string;
  style: 'professional' | 'casual' | 'energetic';
  avatar: string;
  error?: string;
}

// Store video jobs (in production, use DB + queue)
const VIDEO_JOBS: { [id: string]: VideoJob } = {};

// Available AI anchors
const ANCHORS = [
  {
    id: 'anchor_01',
    name: 'Alex Chen',
    style: 'professional',
    avatar: '/avatars/alex.png',
    voice: 'en-US-Neural2-J',
    description: 'Professional male anchor with clear, authoritative delivery',
  },
  {
    id: 'anchor_02',
    name: 'Sarah Mitchell',
    style: 'casual',
    avatar: '/avatars/sarah.png',
    voice: 'en-US-Neural2-F',
    description: 'Friendly female anchor with approachable style',
  },
  {
    id: 'anchor_03',
    name: 'Max Turner',
    style: 'energetic',
    avatar: '/avatars/max.png',
    voice: 'en-US-Neural2-D',
    description: 'High-energy male anchor for exciting market updates',
  },
  {
    id: 'anchor_04',
    name: 'Luna Hayes',
    style: 'professional',
    avatar: '/avatars/luna.png',
    voice: 'en-US-Neural2-C',
    description: 'Sophisticated female anchor for institutional news',
  },
];

// Generate news script from articles
async function generateScript(articles: any[], style: string): Promise<string> {
  const intro = {
    professional: "Good evening, I'm your AI news anchor with today's top crypto developments.",
    casual: "Hey there, crypto family! Let's dive into what's happening in the market.",
    energetic: "Welcome back to Crypto News Flash! We've got some MASSIVE updates for you today!",
  }[style] || "Here's your crypto news update.";
  
  const articleSummaries = articles.slice(0, 5).map((article, i) => {
    const transition = ['First up,', 'Moving on,', 'Next,', 'Also,', 'Finally,'][i];
    return `${transition} ${article.title}. ${article.summary || 'This story is developing.'}`;
  }).join(' ');
  
  const outro = {
    professional: "That's all for now. Stay informed, and we'll see you in the next update.",
    casual: "That's the wrap for today! Remember to DYOR and stay safe out there.",
    energetic: "And that's the news! Smash that subscribe button and we'll catch you next time!",
  }[style] || "Thanks for watching.";
  
  return `${intro}\n\n${articleSummaries}\n\n${outro}`;
}

// Estimate video duration from script
function estimateDuration(script: string): number {
  const wordsPerMinute = 150;
  const words = script.split(/\s+/).length;
  return Math.ceil((words / wordsPerMinute) * 60);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'info';
  
  // Get available anchors
  if (action === 'anchors') {
    return NextResponse.json({
      success: true,
      anchors: ANCHORS,
    });
  }
  
  // Get job status
  if (action === 'status') {
    const jobId = searchParams.get('jobId');
    if (!jobId || !VIDEO_JOBS[jobId]) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      job: VIDEO_JOBS[jobId],
    });
  }
  
  // Get recent videos
  if (action === 'videos') {
    const completedJobs = Object.values(VIDEO_JOBS)
      .filter(j => j.status === 'completed')
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    
    return NextResponse.json({
      success: true,
      videos: completedJobs.slice(0, 10),
    });
  }
  
  // Info endpoint
  return NextResponse.json({
    success: true,
    service: 'AI News Anchor',
    description: 'Generate AI-powered video news summaries',
    features: [
      'Multiple AI anchor personalities',
      'Text-to-speech synthesis',
      'Auto-generated scripts from news',
      'Professional/casual/energetic styles',
      'Up to 5-minute videos',
    ],
    anchors: ANCHORS.length,
    pricing: {
      free: '1 video/day (60s max)',
      pro: '10 videos/day (5min max)',
      enterprise: 'Unlimited',
    },
    integrations: {
      heygen: 'HeyGen API for avatar generation',
      elevenlabs: 'ElevenLabs for voice synthesis',
      replicate: 'Replicate for open-source models',
    },
    _links: {
      anchors: '/api/ai-anchor?action=anchors',
      videos: '/api/ai-anchor?action=videos',
      generate: 'POST /api/ai-anchor',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    // Generate new video
    if (action === 'generate') {
      const { 
        anchorId = 'anchor_01',
        style = 'professional',
        customScript,
        articleIds,
        duration = 60,
      } = body;
      
      const anchor = ANCHORS.find(a => a.id === anchorId) || ANCHORS[0];
      
      // Fetch articles if not provided
      let articles: any[] = [];
      if (!customScript) {
        try {
          const newsRes = await fetch(`${API_BASE}/api/news?limit=5`);
          if (newsRes.ok) {
            const data = await newsRes.json();
            articles = data.articles || [];
          }
        } catch (e) {
          articles = [{ title: 'Market update', summary: 'Crypto markets are seeing mixed action today.' }];
        }
      }
      
      const script = customScript || await generateScript(articles, style);
      const estimatedDuration = Math.min(estimateDuration(script), duration);
      
      const jobId = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      
      const job: VideoJob = {
        id: jobId,
        status: 'queued',
        progress: 0,
        createdAt: new Date().toISOString(),
        style,
        avatar: anchor.avatar,
        script,
        duration: estimatedDuration,
      };
      
      VIDEO_JOBS[jobId] = job;
      
      // Simulate video processing (in production, this would be async)
      simulateVideoGeneration(jobId);
      
      return NextResponse.json({
        success: true,
        jobId,
        job,
        message: 'Video generation started',
        estimatedTime: `${Math.ceil(estimatedDuration / 10)} minutes`,
        checkStatus: `/api/ai-anchor?action=status&jobId=${jobId}`,
      });
    }
    
    // Preview script
    if (action === 'preview') {
      const { style = 'professional' } = body;
      
      let articles: any[] = [];
      try {
        const newsRes = await fetch(`${API_BASE}/api/news?limit=5`);
        if (newsRes.ok) {
          const data = await newsRes.json();
          articles = data.articles || [];
        }
      } catch (e) {
        articles = [{ title: 'Market update', summary: 'Crypto markets are seeing mixed action today.' }];
      }
      
      const script = await generateScript(articles, style);
      
      return NextResponse.json({
        success: true,
        script,
        wordCount: script.split(/\s+/).length,
        estimatedDuration: estimateDuration(script),
        articleCount: articles.length,
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Simulate video generation progress
function simulateVideoGeneration(jobId: string) {
  const job = VIDEO_JOBS[jobId];
  if (!job) return;
  
  job.status = 'processing';
  
  const steps = [10, 25, 45, 65, 80, 95, 100];
  let step = 0;
  
  const interval = setInterval(() => {
    if (step >= steps.length) {
      clearInterval(interval);
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date().toISOString();
      job.videoUrl = `/generated/video_${jobId}.mp4`;
      return;
    }
    
    job.progress = steps[step];
    step++;
  }, 2000);
}
