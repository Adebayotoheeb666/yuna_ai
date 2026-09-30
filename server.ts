import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

const port = Number(process.env.PORT) || 3000;
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const YUNA_SYSTEM_PROMPT = `
# Korean Language Learning Agent — System Prompt

## Identity
You are Yuna (유나), a warm, patient Korean language tutor built for voice-first conversation practice, with text as a supporting channel only. Your job is to get the learner speaking and listening in Korean as quickly and often as possible — text exists to reinforce what happens in voice, never to replace it.

## Interaction Mode: Voice-First, Text-Secondary
- Default every exchange to spoken Korean (via TTS) with the learner responding by voice (via STT). Assume the primary surface is a voice call/live session.
- Use text ONLY for: displaying Hangul script, romanization, new vocabulary cards, grammar notes, and post-session summaries. Never conduct the core back-and-forth conversation drill in text if voice is available.
- Keep spoken turns short (1–3 sentences) so the learner isn't overwhelmed listening — this is a conversation, not a lecture.
- When you show text, keep it minimal and glanceable: Hangul + romanization + short English gloss. Don't dump paragraphs.

## Korean-Specific Pedagogy Rules
- Honorifics and speech levels are not optional extras — teach them from day one. Always specify which speech level a phrase uses (반말 informal, 존댓말 polite 요-form, or formal 합니다체) and why it fits the context. Never let a learner default to 반말 without understanding when it's rude.
- Hangul first, romanization as training wheels only. Push the learner toward reading Hangul directly as soon as they can manage basic syllable blocks.
- Particles (은/는, 이/가, 을/를, 에/에서, etc.) get explicit, repeated attention. Drill them in isolation before folding them into free conversation.
- Pronunciation feedback is a priority given the voice-first format. Listen for common English-speaker errors: distinguishing ㅓ/ㅗ, ㅡ/ㅜ, tense vs. aspirated consonants (ㄲ/ㅋ/ㄱ), and syllable-final consonant neutralization. Correct gently, model the sound again, ask for a repeat.
- Use natural, contemporary spoken Korean, not textbook-stiff phrasing.

## Correction Style
- Never interrupt mid-sentence. Let the learner finish, then recast the error naturally ("Ah, you'd say 저는 학생이에요 there") rather than just saying "wrong."
- Prioritize corrections that block comprehension or cause real miscommunication over minor accent imperfections.
- Praise specifically ("Nice, you got the 았/었 past tense right that time") rather than generic "good job".

## Language Detection & Direct Conversational Relevance
- You must carefully analyze what the learner is saying or asking. NEVER provide canned, generic, or disconnected feedback.
- You must detect whether the learner spoke English, Korean, or Mixed:
  * If the learner speaks or asks in English (e.g. "How do I say...", "What does that mean?", "Can you repeat that?", "Why did you use 은/는?"):
    1. Directly answer their specific question.
    2. Provide the exact Korean translation, grammar explanation, or clarification they asked for.
    3. Model the Korean phrasing in your spoken reply and prompt them to practice speaking it.
  * If the learner attempts Korean:
    1. Directly respond to their actual meaning (e.g., if they asked for water "물 주세요", acknowledge water, do not pretend they said coffee).
    2. Only provide recast or pronunciation coaching if there was a real issue; otherwise encourage them and continue the natural dialogue.
- Spoken Korean turns must be short (1–3 sentences), warm, and directly responsive.

## Output Format
Always return a structured JSON response matching the required schema. Ensure Korean text is culturally natural, spoken turns are strictly 1 to 3 sentences, and cards are concise.
`;

// API endpoint for Yuna voice-first chat
app.post('/api/yuna/chat', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured. Please check GEMINI_API_KEY.',
      });
    }

    const {
      messages = [],
      userProfile = {
        level: 'Beginner',
        goals: 'Travel and daily conversation',
        hangulComfort: 'learning',
        preferredSpeechLevel: '존댓말 (Polite 요-form)',
      },
      sessionStage = 'warmup',
      topic = 'Daily Conversation',
      userSpokenInput = '',
    } = req.body;

    const contentsPrompt = `
Learner Profile:
- Level: ${userProfile.level} (TOPIK equivalent)
- Goals: ${userProfile.goals}
- Hangul Comfort: ${userProfile.hangulComfort}
- Preferred/Target Speech Level: ${userProfile.preferredSpeechLevel}
- Current Session Stage: ${sessionStage}
- Topic/Context: ${topic}

Recent Conversation History:
${messages
  .slice(-6)
  .map(
    (m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`
  )
  .join('\n')}

Latest User Spoken Input: "${userSpokenInput || '(Session started / learner waiting for tutor introduction)'}"

Generate Yuna's next turn. Ensure spokenKorean is 1-3 sentences maximum. Keep cards concise and actionable.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsPrompt,
      config: {
        systemInstruction: YUNA_SYSTEM_PROMPT,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            spokenKorean: {
              type: Type.STRING,
              description:
                '1-3 sentences in natural Korean that Yuna speaks aloud to the learner.',
            },
            spokenEnglishTranslation: {
              type: Type.STRING,
              description: 'Clear, concise English translation of what Yuna said.',
            },
            speechLevel: {
              type: Type.STRING,
              description:
                'Speech level used: 반말 (Informal), 존댓말 (Polite 요-form), or 합니다체 (Formal).',
            },
            speechLevelExplanation: {
              type: Type.STRING,
              description:
                'Brief 1-sentence explanation of why this speech level is appropriate here.',
            },
            hangulCard: {
              type: Type.OBJECT,
              properties: {
                hangul: { type: Type.STRING, description: 'Core Korean phrase or word' },
                romanization: { type: Type.STRING, description: 'Revised Romanization' },
                englishGloss: { type: Type.STRING, description: 'English meaning' },
                syllableBreakdown: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      syllable: { type: Type.STRING },
                      romanization: { type: Type.STRING },
                      tip: { type: Type.STRING },
                    },
                    required: ['syllable', 'romanization'],
                  },
                },
              },
              required: ['hangul', 'romanization', 'englishGloss'],
            },
            grammarNote: {
              type: Type.STRING,
              description:
                'Concise grammar or particle note (e.g. why 은/는 vs 이/가, or verb ending rule).',
            },
            pronunciationFeedback: {
              type: Type.OBJECT,
              properties: {
                hasFeedback: { type: Type.BOOLEAN },
                detectedIssue: { type: Type.STRING },
                isolatedSyllable: { type: Type.STRING },
                coachingTip: { type: Type.STRING },
              },
            },
            correctionRecast: {
              type: Type.STRING,
              description:
                'Gentle recast of learner error (e.g. "저는 학생이에요" instead of "저는 학생이다"). Leave empty if no error.',
            },
            learnerPrompt: {
              type: Type.STRING,
              description:
                'Short cue indicating what the learner should say or respond with next.',
            },
            sessionStage: {
              type: Type.STRING,
              description:
                'Current stage: warmup, new_material, guided_practice, free_conversation, or wrap_up.',
            },
            detectedLanguage: {
              type: Type.STRING,
              description: 'Language the user spoke: "Korean", "English", or "Mixed".',
            },
            userIntent: {
              type: Type.STRING,
              description: 'User intent: "asked_question", "attempted_korean", "asked_translation", or "general_conversation".',
            },
            directAnswerToUser: {
              type: Type.STRING,
              description: 'Direct 1-sentence answer explaining or addressing what the user specifically asked or stated.',
            },
            newVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  korean: { type: Type.STRING },
                  romanization: { type: Type.STRING },
                  english: { type: Type.STRING },
                  particleUsed: { type: Type.STRING },
                },
                required: ['korean', 'romanization', 'english'],
              },
            },
            milestoneUnlocked: {
              type: Type.STRING,
              description:
                'Identifier of any milestone unlocked (e.g. first_sentence, particle_champion, honorifics_adept, pronunciation_star).',
            },
          },
          required: [
            'spokenKorean',
            'spokenEnglishTranslation',
            'speechLevel',
            'hangulCard',
            'learnerPrompt',
            'sessionStage',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from model');
    }

    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Yuna chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate tutor response' });
  }
});

// API endpoint for Gemini TTS (high-clarity Korean voice)
app.post('/api/yuna/tts', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Call gemini-3.8-flash-lite-tts
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: 'Warm, clear, patient Korean language tutor speaking standard Korean gently and distinctly',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'Audio generation failed' });
    }

    res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
  } catch (error: any) {
    console.error('TTS generation error:', error);
    res.status(500).json({ error: error.message || 'TTS generation failed' });
  }
});

// API endpoint for Audio Transcription (STT fallback via gemini-3.5-transcribe)
app.post('/api/yuna/stt', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const audioPart = {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this spoken Korean audio accurately into standard Korean Hangul script. Only output the transcribed text, nothing else.',
          },
        ],
      },
    });

    const transcript = response.text?.trim() || '';
    res.json({ transcript });
  } catch (error: any) {
    console.error('STT transcription error:', error);
    res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

// API endpoint to test local speech model connectivity
app.post('/api/yuna/test-local-model', async (req, res) => {
  const { endpointUrl } = req.body;
  if (!endpointUrl) {
    return res.status(400).json({ error: 'Endpoint URL required' });
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(endpointUrl, {
      method: 'GET',
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    res.json({
      reachable: response !== null,
      statusCode: response?.status ?? 0,
      latencyMs,
      endpointUrl,
    });
  } catch (error: any) {
    res.json({
      reachable: false,
      error: error.message,
      latencyMs: Date.now() - startTime,
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

startServer();
