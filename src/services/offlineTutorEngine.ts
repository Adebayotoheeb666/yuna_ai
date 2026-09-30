import { PracticeLesson, SessionStage, TutorResponse } from '../types/yuna';

/**
 * Offline Korean Language Learning Agent Engine
 * Allows 100% offline practice, matching the exact pedagogy of Yuna:
 * - Voice-first spoken turns (1-3 sentences)
 * - Honorifics and speech level distinctions (반말, 존댓말, 합니다체)
 * - Explicit particle drills (은/는, 이/가, 을/를)
 * - Phonetic syllable breakdown and pronunciation analysis
 */

export const OFFLINE_LESSONS: PracticeLesson[] = [
  {
    id: 'particles_eun_neun_i_ga',
    title: 'Topic vs. Subject Particles',
    subtitle: 'Master 은/는 vs. 이/가 without confusion',
    level: 'Beginner',
    category: 'Particle Drill',
    stage: 'guided_practice',
    description:
      'Learn the foundational nuance: 은/는 for contrast/topic, 이/가 for specific subject identification.',
    initialPrompt: '오늘 은/는과 이/가 조사를 연습해 봐요. "저는 학생이에요"라고 말해볼까요?',
    targetVocab: ['저 (I)', '학생 (student)', '은/는 (topic)', '이/가 (subject)'],
    grammarFocus: '은/는 after consonant/vowel vs 이/가',
  },
  {
    id: 'speech_level_banmal_jondaetmal',
    title: 'Speech Level Transformation',
    subtitle: 'From 반말 (Informal) to 존댓말 (Polite 요-form)',
    level: 'Beginner',
    category: 'Speech Level',
    stage: 'guided_practice',
    description:
      'Practice taking informal peer phrases and politely transforming them for everyday Korean society.',
    initialPrompt: '친구에게 하는 반말 "밥 먹어"를 예의 바른 존댓말로 바꿔볼까요?',
    targetVocab: ['밥 (meal/rice)', '먹다 (to eat)', '먹어요 (polite)', '드세요 (honorific)'],
    grammarFocus: 'Stem + -아요 / -어요 polite conjugation',
  },
  {
    id: 'cafe_hongdae_ordering',
    title: 'Hongdae Café Ordering',
    subtitle: 'Order iced drinks and snacks naturally',
    level: 'Beginner',
    category: 'Roleplay',
    stage: 'free_conversation',
    description:
      'Step into a bustling Seoul café. Greet the barista, order coffee, and ask for a receipt.',
    initialPrompt: '어서오세요! 손님, 무엇을 주문하시겠어요?',
    targetVocab: ['아이스 아메리카노 (Iced Americano)', '한 잔 (one cup)', '주세요 (please give)'],
    grammarFocus: 'Noun + 을/를 주세요 & Counter words (한 잔, 두 잔)',
  },
  {
    id: 'hangul_basics_vowels',
    title: 'Vowel Clarifier: ㅓ vs. ㅗ',
    subtitle: 'Overcome the most common English speaker trap',
    level: 'Absolute Beginner',
    category: 'Warmup & Basics',
    stage: 'new_material',
    description:
      'Train your ear and mouth to distinguish the open jaw ㅓ (eo) from the rounded lips ㅗ (o).',
    initialPrompt: '한국어 모음 ㅓ와 ㅗ를 소리 내어 연습해봐요. "커피"를 발음해 볼까요?',
    targetVocab: ['커피 (coffee)', '코 (nose)', '어디 (where)', '오늘 (today)'],
    grammarFocus: 'Mouth shape and vocal tract positioning',
  },
  {
    id: 'taxi_directions_seoul',
    title: 'Taxi & Street Directions',
    subtitle: 'Tell the driver where to go politely',
    level: 'Intermediate',
    category: 'Roleplay',
    stage: 'free_conversation',
    description:
      'Direct a taxi driver in Seoul: "홍대입구역으로 가주세요" and asking how long it takes.',
    initialPrompt: '기사님이 물어보십니다: "손님, 어디로 모실까요?" 목적지를 말씀해 주세요.',
    targetVocab: ['홍대입구역 (Hongdae Station)', '-(으)로 (direction particle)', '가주세요 (please go)'],
    grammarFocus: 'Direction particle -(으)로 + -아/어 주세요',
  },
];

// Offline step responses mapped to topics and stages
export function getOfflineTutorResponse(
  lessonId: string,
  userSpokenInput: string,
  currentStage: SessionStage,
  turnCount: number
): TutorResponse {
  const normalized = userSpokenInput.trim().toLowerCase();
  const hasHangul = /[\uAC00-\uD7A3]/.test(userSpokenInput);
  const hasEnglish = /[a-zA-Z]/.test(userSpokenInput);
  const detectedLanguage: 'Korean' | 'English' | 'Mixed' =
    hasHangul && hasEnglish ? 'Mixed' : hasHangul ? 'Korean' : 'English';

  // 1. Direct handling if learner is speaking English or asking a question
  if (hasEnglish && !hasHangul && normalized.length > 0) {
    if (normalized.includes('repeat') || normalized.includes('again') || normalized.includes('pardon')) {
      return {
        spokenKorean: '네! 천천히 다시 들려드릴게요. 잘 듣고 따라 해보세요.',
        spokenEnglishTranslation: 'Yes! I will say it slowly again. Listen closely and repeat.',
        speechLevel: '존댓말 (Polite 요-form)',
        speechLevelExplanation: 'Friendly tutor repetition.',
        detectedLanguage: 'English',
        userIntent: 'asked_question',
        directAnswerToUser: 'Replaying the phrase slowly for you!',
        hangulCard: {
          hangul: '다시 한 번 말씀해 주세요',
          romanization: 'dasi han beon malsseumhae juseyo',
          englishGloss: 'Please say it one more time (polite)',
        },
        learnerPrompt: 'Listen and repeat: "다시 한 번 말씀해 주세요"',
        sessionStage: currentStage,
      };
    }

    if (normalized.includes('how do you say') || normalized.includes('how to say') || normalized.includes('what is the word for')) {
      let targetWord = '화장실 (bathroom)';
      let targetKorean = '화장실 어디예요?';
      let romanization = 'hwajangsil eodiyeyo?';
      let englishGloss = 'Where is the bathroom?';

      if (normalized.includes('thank')) {
        targetKorean = '감사합니다';
        romanization = 'gamsahamnida';
        englishGloss = 'Thank you (formal polite)';
      } else if (normalized.includes('hello')) {
        targetKorean = '안녕하세요';
        romanization = 'annyeonghaseyo';
        englishGloss = 'Hello (polite)';
      } else if (normalized.includes('water')) {
        targetKorean = '물 좀 주세요';
        romanization = 'mul jom juseyo';
        englishGloss = 'Please give me some water';
      } else if (normalized.includes('delicious')) {
        targetKorean = '맛있어요';
        romanization = 'masisseoyo';
        englishGloss = 'It is delicious';
      }

      return {
        spokenKorean: `한국어로는 "${targetKorean}"라고 말해요! 발음을 따라 해볼까요?`,
        spokenEnglishTranslation: `In Korean, we say "${targetKorean}"! Shall we practice saying it together?`,
        speechLevel: '존댓말 (Polite 요-form)',
        speechLevelExplanation: 'Direct answer to learner translation inquiry.',
        detectedLanguage: 'English',
        userIntent: 'asked_translation',
        directAnswerToUser: `You say "${targetKorean}" (${englishGloss})`,
        hangulCard: {
          hangul: targetKorean,
          romanization: romanization,
          englishGloss: englishGloss,
        },
        grammarNote: 'In Korean, polite requests end in -요 or -세요.',
        learnerPrompt: `Say aloud: "${targetKorean}"`,
        sessionStage: currentStage,
      };
    }

    if (normalized.includes('why') || normalized.includes('difference') || normalized.includes('particle')) {
      return {
        spokenKorean: '좋은 질문이에요! 은/는은 대조나 화제를 말할 때 쓰고, 이/가는 행동의 주인공을 강조할 때 써요.',
        spokenEnglishTranslation: 'Great question! 은/는 is for topics/contrast, while 이/가 highlights the specific subject doing the action.',
        speechLevel: '존댓말 (Polite 요-form)',
        detectedLanguage: 'English',
        userIntent: 'asked_question',
        directAnswerToUser: '은/는 marks the topic or contrast, whereas 이/가 pinpoints who specifically did it.',
        hangulCard: {
          hangul: '은/는 vs 이/가',
          romanization: 'eun/neun vs i/ga',
          englishGloss: 'Topic vs. Subject Particle distinction',
        },
        grammarNote: 'Example: 저는 학생이에요 (As for me, student) vs 제가 했어요 (I specifically did it).',
        learnerPrompt: 'Say: "저는 학생이에요" (Topic) or "제가 했어요" (Subject)',
        sessionStage: 'guided_practice',
      };
    }

    if (normalized.includes('confused') || normalized.includes('help') || normalized.includes("don't understand")) {
      return {
        spokenKorean: '괜찮아요, 천천히 가면 돼요! 제가 짧고 쉬운 단어부터 하나씩 안내해 드릴게요.',
        spokenEnglishTranslation: "It's totally okay, take it slowly! I will guide you step by step with short words.",
        speechLevel: '존댓말 (Polite 요-form)',
        detectedLanguage: 'English',
        userIntent: 'general_conversation',
        directAnswerToUser: 'Do not worry! We will break it down into bite-sized syllables.',
        hangulCard: {
          hangul: '괜찮아요',
          romanization: 'gwaenchanayo',
          englishGloss: "It's all right / No problem",
        },
        learnerPrompt: 'Try saying gently: "괜찮아요" (It is okay)',
        sessionStage: currentStage,
      };
    }
  }

  // 2. Standard topic-based handling with language tagging
  if (lessonId === 'particles_eun_neun_i_ga') {
    if (turnCount === 0 || !normalized) {
      return {
        spokenKorean:
          '반가워요! 오늘은 한국어에서 가장 중요한 조사 은/는을 연습해 볼 거예요. 먼저 "저는 유나예요"라고 인사해 보실래요?',
        spokenEnglishTranslation:
          'Nice to meet you! Today we will practice the most important particle 은/는. First, shall we greet with "I am Yuna"?',
        speechLevel: '존댓말 (Polite 요-form)',
        speechLevelExplanation: 'Standard polite speech used between tutor and learner.',
        hangulCard: {
          hangul: '저는 학생이에요',
          romanization: 'jeoneun haksaeng-ieyo',
          englishGloss: 'As for me, I am a student',
          syllableBreakdown: [
            { syllable: '저', romanization: 'jeo', tip: 'Humble "I"' },
            { syllable: '는', romanization: 'neun', tip: 'Topic particle after vowel' },
            { syllable: '학', romanization: 'hak', tip: 'Initial consonant h' },
            { syllable: '생', romanization: 'saeng', tip: 'Student part' },
            { syllable: '이', romanization: 'i', tip: 'Copula' },
            { syllable: '에', romanization: 'e', tip: 'Polite ending' },
            { syllable: '요', romanization: 'yo', tip: 'Soft polite marker' },
          ],
        },
        grammarNote:
          'Topic particle 은/는: Use 는 after a vowel (저 + 는 = 저는) and 은 after a consonant (학생 + 은 = 학생은).',
        learnerPrompt: 'Say aloud: "저는 학생이에요" (I am a student)',
        sessionStage: 'warmup',
        newVocabulary: [
          { korean: '저', romanization: 'jeo', english: 'I (humble/polite)' },
          { korean: '학생', romanization: 'haksaeng', english: 'student' },
          { korean: '은/는', romanization: 'eun/neun', english: 'topic particle' },
        ],
      };
    }

    if (normalized.includes('학생') || normalized.includes('저는')) {
      return {
        spokenKorean:
          '정말 잘하셨어요! 발음도 아주 명확했어요. 이번에는 질문해 볼게요: "누가 학생이에요?"라고 물으면 "제가 학생이에요"라고 답해 보세요!',
        spokenEnglishTranslation:
          'Very well done! Your pronunciation was very clear. Now I ask: If asked "Who is the student?", reply "I am the student (제가)!"',
        speechLevel: '존댓말 (Polite 요-form)',
        speechLevelExplanation:
          'Reinforcing the distinction between topic (은/는) and subject focus (이/가).',
        hangulCard: {
          hangul: '제가 학생이에요',
          romanization: 'jega haksaeng-ieyo',
          englishGloss: 'I (specifically) am the student',
          syllableBreakdown: [
            { syllable: '제', romanization: 'je', tip: 'Form of 저 before 가' },
            { syllable: '가', romanization: 'ga', tip: 'Subject particle after vowel' },
          ],
        },
        grammarNote:
          'Subject particle 이/가: When answering "who" (누가), use 제가 (not 저가 or 저는) to mark the specific subject.',
        correctionRecast:
          normalized.includes('저가') ? '자연스럽게 말하려면 "저가" 대신 "제가"라고 해요!' : undefined,
        pronunciationFeedback: {
          hasFeedback: true,
          detectedIssue: 'Vowel clarity in 제가',
          isolatedSyllable: '제',
          coachingTip: 'Keep mouth wide with relaxed jaw: "je" like jelly.',
        },
        learnerPrompt: 'Respond aloud: "제가 학생이에요!"',
        sessionStage: 'guided_practice',
        milestoneUnlocked: 'particle_champion',
      };
    }

    return {
      spokenKorean:
        '아주 좋아요! 천천히 따라 해보세요: "저는 커피를 좋아해요." 이번엔 목적격 조사 을/를도 들어있어요!',
      spokenEnglishTranslation:
        'Great job! Repeat after me slowly: "I like coffee." This time notice the object particle 을/를 too!',
      speechLevel: '존댓말 (Polite 요-form)',
      hangulCard: {
        hangul: '저는 커피를 좋아해요',
        romanization: 'jeoneun keopireul joahaeyo',
        englishGloss: 'I like coffee',
        syllableBreakdown: [
          { syllable: '커', romanization: 'keo', tip: 'Open vowel ㅓ (not ㅗ)' },
          { syllable: '피', romanization: 'pi', tip: 'Aspirated p' },
          { syllable: '를', romanization: 'reul', tip: 'Object marker after vowel' },
        ],
      },
      grammarNote:
        'Object particle 을/를: Use 를 after vowels (커피를), 을 after consonants (밥을).',
      learnerPrompt: 'Speak aloud: "저는 커피를 좋아해요"',
      sessionStage: 'guided_practice',
    };
  }

  if (lessonId === 'cafe_hongdae_ordering') {
    if (turnCount === 0 || !normalized) {
      return {
        spokenKorean:
          '어서오세요, 홍대 카페입니다! 무엇을 드릴까요?',
        spokenEnglishTranslation:
          'Welcome to Hongdae Café! What can I get for you?',
        speechLevel: '존댓말 (Polite 요-form)',
        speechLevelExplanation: 'Barista greeting customer politely.',
        hangulCard: {
          hangul: '아이스 아메리카노 한 잔 주세요',
          romanization: 'aiseu amerikano han jan juseyo',
          englishGloss: 'One iced Americano, please',
          syllableBreakdown: [
            { syllable: '한', romanization: 'han', tip: 'One (native Korean)' },
            { syllable: '잔', romanization: 'jan', tip: 'Cup counter' },
            { syllable: '주', romanization: 'ju', tip: 'Give root' },
            { syllable: '세', romanization: 'se', tip: 'Honorific imperative' },
            { syllable: '요', romanization: 'yo', tip: 'Polite finish' },
          ],
        },
        grammarNote: 'Counter pattern: Item + Number + Counter + 주세요 (Please give).',
        learnerPrompt: 'Say to the barista: "아이스 아메리카노 한 잔 주세요!"',
        sessionStage: 'free_conversation',
        newVocabulary: [
          { korean: '아메리카노', romanization: 'amerikano', english: 'Americano' },
          { korean: '한 잔', romanization: 'han jan', english: 'one cup' },
          { korean: '주세요', romanization: 'juseyo', english: 'please give me' },
        ],
      };
    }

    if (normalized.includes('주세요') || normalized.includes('아메리카노') || normalized.includes('커피')) {
      return {
        spokenKorean:
          '네, 시원한 아이스 아메리카노 준비해 드릴게요! 매장에서 드시나요, 아니면 테이크아웃 하실 건가요?',
        spokenEnglishTranslation:
          'Yes, I will prepare a refreshing iced Americano for you! Will you have it here, or take out?',
        speechLevel: '존댓말 (Polite 요-form)',
        speechLevelExplanation: 'Natural Seoul café conversation follow-up question.',
        hangulCard: {
          hangul: '테이크아웃 해주세요',
          romanization: 'teikeu-aut hae-juseyo',
          englishGloss: 'Please make it take out',
          syllableBreakdown: [
            { syllable: '테', romanization: 'te', tip: 'Take' },
            { syllable: '이', romanization: 'i', tip: 'Native transliteration' },
            { syllable: '크', romanization: 'keu', tip: 'Unreleased k' },
            { syllable: '아', romanization: 'a', tip: 'Out vowel' },
            { syllable: '웃', romanization: 'ut', tip: 'Final s becomes t sound' },
          ],
        },
        grammarNote:
          'Pronunciation: In "테이크아웃", the final 받침 "ㅅ" neutralizes into a clean [t] stop sound before silence.',
        learnerPrompt: 'Answer: "테이크아웃 해주세요" (Take out please) or "마시고 갈게요" (I will drink here)',
        sessionStage: 'free_conversation',
        milestoneUnlocked: 'cafe_connoisseur',
      };
    }

    return {
      spokenKorean:
        '결제 도와드릴게요. 카드 꽂아주세요! 영수증 필요하신가요?',
      spokenEnglishTranslation:
        'I will help with payment. Please insert your card! Do you need a receipt?',
      speechLevel: '존댓말 (Polite 요-form)',
      hangulCard: {
        hangul: '영수증은 버려주세요',
        romanization: 'yeongsujeung-eun beoryeo-juseyo',
        englishGloss: 'Please throw away the receipt',
      },
      learnerPrompt: 'Say: "영수증은 버려주세요" (Please discard receipt) or "네, 주세요" (Yes, give me)',
      sessionStage: 'wrap_up',
    };
  }

  // Default fallback tutor response
  return {
    spokenKorean:
      '네, 잘 들었어요! 한국어는 억양을 부드럽게 이어가는 게 중요해요. 한 번 더 자신 있게 말씀해 보세요!',
    spokenEnglishTranslation:
      'Yes, I heard you well! In Korean, keeping the intonation smooth is key. Try saying it once more with confidence!',
    speechLevel: '존댓말 (Polite 요-form)',
    hangulCard: {
      hangul: '천천히 다시 해볼게요',
      romanization: 'cheoncheonhi dasi haebolgeyo',
      englishGloss: 'I will try again slowly',
    },
    learnerPrompt: 'Repeat with comfortable rhythm: "천천히 다시 해볼게요"',
    sessionStage: currentStage || 'guided_practice',
  };
}

/**
 * Syllable decomposition for pronunciation feedback (Jamo breakdown)
 */
export function analyzeKoreanPronunciation(
  targetText: string,
  spokenText: string
): {
  score: number;
  matchedWords: string[];
  feedbackNotes: string[];
} {
  const targetTokens = targetText.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const spokenTokens = spokenText.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  if (targetTokens.length === 0) return { score: 100, matchedWords: [], feedbackNotes: [] };

  let matches = 0;
  const matchedWords: string[] = [];
  const feedbackNotes: string[] = [];

  targetTokens.forEach((t) => {
    if (spokenTokens.some((s) => s.includes(t) || t.includes(s))) {
      matches++;
      matchedWords.push(t);
    }
  });

  const ratio = matches / targetTokens.length;
  const score = Math.round(Math.min(100, Math.max(30, ratio * 100)));

  // Common pronunciation advice checks
  if (targetText.includes('ㅓ') && !spokenText.includes('ㅓ')) {
    feedbackNotes.push('Keep jaw dropped open for ㅓ (eo); avoid rounding lips like ㅗ (o).');
  }
  if (targetText.includes('ㄲ') || targetText.includes('ㄸ') || targetText.includes('ㅃ')) {
    feedbackNotes.push('Tense consonants (쌍자음): tighten throat muscles without puffing out air.');
  }

  return { score, matchedWords, feedbackNotes };
}
