import { NextRequest } from 'next/server';
import { aiStream } from '@/lib/ai-provider';

export const runtime = 'edge';

const typeInstructions = {
  sentence: 'Summarize in exactly ONE sentence (under 30 words). Be concise and capture the main point.',
  paragraph: 'Summarize in one short paragraph (2-3 sentences, under 75 words). Capture the key points.',
  bullets: 'Summarize in 3-5 bullet points. Each bullet should be one short sentence starting with "• ".',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, type = 'paragraph' } = body as {
      text: string;
      type?: 'sentence' | 'paragraph' | 'bullets';
    };

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const instruction = typeInstructions[type as keyof typeof typeInstructions] ?? typeInstructions.paragraph;

    const systemPrompt = `You are a crypto news summarizer specialised in blockchain, DeFi, and digital assets. ${instruction} Focus on facts — include specific numbers, names, and dates. Do not add any preamble or explanation — output only the summary.`;

    const content = text.slice(0, 8000);

    const stream = await aiStream(systemPrompt, content, {
      maxTokens: type === 'sentence' ? 80 : type === 'paragraph' ? 200 : 350,
      temperature: 0.25,
    }, /* preferGroq */ true);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to stream summary';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
