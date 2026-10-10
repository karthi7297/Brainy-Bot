import type {
  Quiz,
  Question,
  GameSession,
  Participant,
  QuestionResult,
  LeaderboardEntry,
  SessionReport,
  User,
} from '../types';

// ==========================================
// Mock User
// ==========================================
export const mockUser: User = {
  id: 1,
  name: 'Alex Thompson',
  email: 'alex@brainybot.com',
  created_at: '2026-09-15T10:00:00Z',
};

// ==========================================
// Mock Quizzes
// ==========================================
export const mockQuizzes: Quiz[] = [
  {
    id: 1,
    owner_id: 1,
    title: 'World Geography Challenge',
    description: 'Test your knowledge of countries, capitals, and landmarks around the world!',
    visibility: 'public',
    status: 'published',
    cover_image_url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800',
    question_count: 5,
    created_at: '2026-09-20T14:30:00Z',
    updated_at: '2026-10-01T09:00:00Z',
  },
  {
    id: 2,
    owner_id: 1,
    title: 'Science & Nature Quiz',
    description: 'From biology to physics — how much do you know about the natural world?',
    visibility: 'public',
    status: 'published',
    cover_image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
    question_count: 5,
    created_at: '2026-09-22T11:15:00Z',
    updated_at: '2026-10-02T16:30:00Z',
  },
  {
    id: 3,
    owner_id: 1,
    title: 'Pop Culture Trivia',
    description: 'Movies, music, memes — show off your pop culture IQ!',
    visibility: 'private',
    status: 'draft',
    question_count: 3,
    created_at: '2026-10-05T08:00:00Z',
    updated_at: '2026-10-05T08:00:00Z',
  },
  {
    id: 4,
    owner_id: 1,
    title: 'Math Fundamentals',
    description: 'Basic arithmetic, algebra, and geometry problems for all ages.',
    visibility: 'private',
    status: 'draft',
    question_count: 0,
    created_at: '2026-10-08T13:00:00Z',
    updated_at: '2026-10-08T13:00:00Z',
  },
  {
    id: 5,
    owner_id: 1,
    title: 'History Through the Ages',
    description: 'Journey through ancient civilizations to modern events.',
    visibility: 'public',
    status: 'published',
    cover_image_url: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=800',
    question_count: 5,
    created_at: '2026-09-25T10:00:00Z',
    updated_at: '2026-10-03T14:00:00Z',
  },
];

// ==========================================
// Mock Questions (for Quiz 1: Geography)
// ==========================================
export const mockQuestions: Record<number, Question[]> = {
  1: [
    {
      id: 1,
      quiz_id: 1,
      question_text: 'What is the capital city of Japan?',
      question_type: 'multiple_choice',
      position: 1,
      time_limit_seconds: 20,
      base_points: 1000,
      explanation: 'Tokyo has been the capital of Japan since 1868.',
      options: [
        { id: 1, question_id: 1, option_text: 'Seoul', position: 1, is_correct: false },
        { id: 2, question_id: 1, option_text: 'Tokyo', position: 2, is_correct: true },
        { id: 3, question_id: 1, option_text: 'Beijing', position: 3, is_correct: false },
        { id: 4, question_id: 1, option_text: 'Bangkok', position: 4, is_correct: false },
      ],
    },
    {
      id: 2,
      quiz_id: 1,
      question_text: 'Which continent is the Sahara Desert located on?',
      question_type: 'multiple_choice',
      position: 2,
      time_limit_seconds: 15,
      base_points: 800,
      explanation: 'The Sahara covers much of North Africa and is the largest hot desert in the world.',
      options: [
        { id: 5, question_id: 2, option_text: 'Asia', position: 1, is_correct: false },
        { id: 6, question_id: 2, option_text: 'South America', position: 2, is_correct: false },
        { id: 7, question_id: 2, option_text: 'Africa', position: 3, is_correct: true },
        { id: 8, question_id: 2, option_text: 'Australia', position: 4, is_correct: false },
      ],
    },
    {
      id: 3,
      quiz_id: 1,
      question_text: 'The Amazon River is the longest river in the world.',
      question_type: 'true_false',
      position: 3,
      time_limit_seconds: 10,
      base_points: 500,
      explanation: 'The Nile River is traditionally considered the longest, though some measurements put the Amazon close.',
      options: [
        { id: 9, question_id: 3, option_text: 'True', position: 1, is_correct: false },
        { id: 10, question_id: 3, option_text: 'False', position: 2, is_correct: true },
      ],
    },
    {
      id: 4,
      quiz_id: 1,
      question_text: 'Which country has the most time zones?',
      question_type: 'multiple_choice',
      position: 4,
      time_limit_seconds: 20,
      base_points: 1000,
      explanation: 'France has 12 time zones due to its overseas territories.',
      options: [
        { id: 11, question_id: 4, option_text: 'Russia', position: 1, is_correct: false },
        { id: 12, question_id: 4, option_text: 'United States', position: 2, is_correct: false },
        { id: 13, question_id: 4, option_text: 'France', position: 3, is_correct: true },
        { id: 14, question_id: 4, option_text: 'China', position: 4, is_correct: false },
      ],
    },
    {
      id: 5,
      quiz_id: 1,
      question_text: 'What is the smallest country in the world by area?',
      question_type: 'multiple_choice',
      position: 5,
      time_limit_seconds: 15,
      base_points: 800,
      explanation: 'Vatican City is only about 44 hectares (110 acres).',
      options: [
        { id: 15, question_id: 5, option_text: 'Monaco', position: 1, is_correct: false },
        { id: 16, question_id: 5, option_text: 'Vatican City', position: 2, is_correct: true },
        { id: 17, question_id: 5, option_text: 'San Marino', position: 3, is_correct: false },
        { id: 18, question_id: 5, option_text: 'Liechtenstein', position: 4, is_correct: false },
      ],
    },
  ],
  2: [
    {
      id: 6,
      quiz_id: 2,
      question_text: 'What is the chemical symbol for gold?',
      question_type: 'multiple_choice',
      position: 1,
      time_limit_seconds: 15,
      base_points: 800,
      explanation: 'Au comes from the Latin word "aurum."',
      options: [
        { id: 19, question_id: 6, option_text: 'Go', position: 1, is_correct: false },
        { id: 20, question_id: 6, option_text: 'Au', position: 2, is_correct: true },
        { id: 21, question_id: 6, option_text: 'Gd', position: 3, is_correct: false },
        { id: 22, question_id: 6, option_text: 'Ag', position: 4, is_correct: false },
      ],
    },
    {
      id: 7,
      quiz_id: 2,
      question_text: 'How many bones are in the adult human body?',
      question_type: 'multiple_choice',
      position: 2,
      time_limit_seconds: 20,
      base_points: 1000,
      explanation: 'Adults have 206 bones. Babies are born with about 270, which fuse as they grow.',
      options: [
        { id: 23, question_id: 7, option_text: '186', position: 1, is_correct: false },
        { id: 24, question_id: 7, option_text: '206', position: 2, is_correct: true },
        { id: 25, question_id: 7, option_text: '256', position: 3, is_correct: false },
        { id: 26, question_id: 7, option_text: '312', position: 4, is_correct: false },
      ],
    },
    {
      id: 8,
      quiz_id: 2,
      question_text: 'Light travels faster than sound.',
      question_type: 'true_false',
      position: 3,
      time_limit_seconds: 10,
      base_points: 500,
      explanation: 'Light travels at approximately 299,792 km/s, while sound travels at about 343 m/s in air.',
      options: [
        { id: 27, question_id: 8, option_text: 'True', position: 1, is_correct: true },
        { id: 28, question_id: 8, option_text: 'False', position: 2, is_correct: false },
      ],
    },
    {
      id: 9,
      quiz_id: 2,
      question_text: 'What planet is known as the Red Planet?',
      question_type: 'multiple_choice',
      position: 4,
      time_limit_seconds: 15,
      base_points: 800,
      explanation: 'Mars appears red due to iron oxide (rust) on its surface.',
      options: [
        { id: 29, question_id: 9, option_text: 'Venus', position: 1, is_correct: false },
        { id: 30, question_id: 9, option_text: 'Jupiter', position: 2, is_correct: false },
        { id: 31, question_id: 9, option_text: 'Mars', position: 3, is_correct: true },
        { id: 32, question_id: 9, option_text: 'Saturn', position: 4, is_correct: false },
      ],
    },
    {
      id: 10,
      quiz_id: 2,
      question_text: 'What gas do plants primarily absorb from the atmosphere?',
      question_type: 'multiple_choice',
      position: 5,
      time_limit_seconds: 15,
      base_points: 800,
      explanation: 'Plants use carbon dioxide (CO₂) in photosynthesis to produce glucose and oxygen.',
      options: [
        { id: 33, question_id: 10, option_text: 'Oxygen', position: 1, is_correct: false },
        { id: 34, question_id: 10, option_text: 'Nitrogen', position: 2, is_correct: false },
        { id: 35, question_id: 10, option_text: 'Carbon Dioxide', position: 3, is_correct: true },
        { id: 36, question_id: 10, option_text: 'Hydrogen', position: 4, is_correct: false },
      ],
    },
  ],
  5: [
    {
      id: 11,
      quiz_id: 5,
      question_text: 'In what year did World War II end?',
      question_type: 'multiple_choice',
      position: 1,
      time_limit_seconds: 15,
      base_points: 800,
      options: [
        { id: 37, question_id: 11, option_text: '1943', position: 1, is_correct: false },
        { id: 38, question_id: 11, option_text: '1945', position: 2, is_correct: true },
        { id: 39, question_id: 11, option_text: '1947', position: 3, is_correct: false },
        { id: 40, question_id: 11, option_text: '1950', position: 4, is_correct: false },
      ],
    },
    {
      id: 12,
      quiz_id: 5,
      question_text: 'The Great Wall of China is visible from space.',
      question_type: 'true_false',
      position: 2,
      time_limit_seconds: 10,
      base_points: 500,
      explanation: 'It is not visible to the unaided eye from low Earth orbit.',
      options: [
        { id: 41, question_id: 12, option_text: 'True', position: 1, is_correct: false },
        { id: 42, question_id: 12, option_text: 'False', position: 2, is_correct: true },
      ],
    },
    {
      id: 13,
      quiz_id: 5,
      question_text: 'Who was the first President of the United States?',
      question_type: 'multiple_choice',
      position: 3,
      time_limit_seconds: 15,
      base_points: 800,
      options: [
        { id: 43, question_id: 13, option_text: 'Thomas Jefferson', position: 1, is_correct: false },
        { id: 44, question_id: 13, option_text: 'George Washington', position: 2, is_correct: true },
        { id: 45, question_id: 13, option_text: 'John Adams', position: 3, is_correct: false },
        { id: 46, question_id: 13, option_text: 'Benjamin Franklin', position: 4, is_correct: false },
      ],
    },
    {
      id: 14,
      quiz_id: 5,
      question_text: 'Which ancient civilization built the pyramids at Giza?',
      question_type: 'multiple_choice',
      position: 4,
      time_limit_seconds: 20,
      base_points: 1000,
      options: [
        { id: 47, question_id: 14, option_text: 'Roman', position: 1, is_correct: false },
        { id: 48, question_id: 14, option_text: 'Greek', position: 2, is_correct: false },
        { id: 49, question_id: 14, option_text: 'Egyptian', position: 3, is_correct: true },
        { id: 50, question_id: 14, option_text: 'Mesopotamian', position: 4, is_correct: false },
      ],
    },
    {
      id: 15,
      quiz_id: 5,
      question_text: 'The Renaissance began in which country?',
      question_type: 'multiple_choice',
      position: 5,
      time_limit_seconds: 20,
      base_points: 1000,
      explanation: 'The Renaissance originated in Italy during the 14th century.',
      options: [
        { id: 51, question_id: 15, option_text: 'France', position: 1, is_correct: false },
        { id: 52, question_id: 15, option_text: 'England', position: 2, is_correct: false },
        { id: 53, question_id: 15, option_text: 'Italy', position: 3, is_correct: true },
        { id: 54, question_id: 15, option_text: 'Spain', position: 4, is_correct: false },
      ],
    },
  ],
};

// ==========================================
// Mock Game Sessions
// ==========================================
export const mockSessions: GameSession[] = [
  {
    id: 1,
    quiz_id: 1,
    host_id: 1,
    game_pin: '482 951',
    status: 'completed',
    started_at: '2026-10-08T10:00:00Z',
    ended_at: '2026-10-08T10:25:00Z',
    created_at: '2026-10-08T09:55:00Z',
    quiz_title: 'World Geography Challenge',
    total_questions: 5,
  },
  {
    id: 2,
    quiz_id: 2,
    host_id: 1,
    game_pin: '739 216',
    status: 'completed',
    started_at: '2026-10-09T14:00:00Z',
    ended_at: '2026-10-09T14:20:00Z',
    created_at: '2026-10-09T13:55:00Z',
    quiz_title: 'Science & Nature Quiz',
    total_questions: 5,
  },
];

// ==========================================
// Mock Participants
// ==========================================
export const mockParticipants: Participant[] = [
  { id: 1, session_id: 1, nickname: 'BrainStorm', total_score: 3800, status: 'finished', joined_at: '2026-10-08T09:57:00Z', rank: 1, correct_count: 5, incorrect_count: 0, unanswered_count: 0 },
  { id: 2, session_id: 1, nickname: 'QuizWhiz', total_score: 3200, status: 'finished', joined_at: '2026-10-08T09:57:30Z', rank: 2, correct_count: 4, incorrect_count: 1, unanswered_count: 0 },
  { id: 3, session_id: 1, nickname: 'SpeedyMind', total_score: 2900, status: 'finished', joined_at: '2026-10-08T09:58:00Z', rank: 3, correct_count: 4, incorrect_count: 0, unanswered_count: 1 },
  { id: 4, session_id: 1, nickname: 'ThinkTank', total_score: 2400, status: 'finished', joined_at: '2026-10-08T09:58:30Z', rank: 4, correct_count: 3, incorrect_count: 2, unanswered_count: 0 },
  { id: 5, session_id: 1, nickname: 'GeoGuru', total_score: 1800, status: 'finished', joined_at: '2026-10-08T09:59:00Z', rank: 5, correct_count: 2, incorrect_count: 2, unanswered_count: 1 },
  { id: 6, session_id: 1, nickname: 'MapMaster', total_score: 1500, status: 'finished', joined_at: '2026-10-08T09:59:30Z', rank: 6, correct_count: 2, incorrect_count: 3, unanswered_count: 0 },
  { id: 7, session_id: 1, nickname: 'WanderBot', total_score: 800, status: 'finished', joined_at: '2026-10-08T09:59:45Z', rank: 7, correct_count: 1, incorrect_count: 3, unanswered_count: 1 },
];

// ==========================================
// Mock Leaderboard
// ==========================================
export const mockLeaderboard: LeaderboardEntry[] = mockParticipants.map((p) => ({
  rank: p.rank!,
  participant_id: p.id,
  nickname: p.nickname,
  total_score: p.total_score,
  correct_count: p.correct_count!,
  streak: Math.floor(Math.random() * 4),
}));

// ==========================================
// Mock Question Results
// ==========================================
export const mockQuestionResults: QuestionResult[] = [
  {
    question_id: 1,
    question_text: 'What is the capital city of Japan?',
    correct_count: 6,
    incorrect_count: 1,
    unanswered_count: 0,
    total_participants: 7,
    correct_option_id: 2,
    correct_option_text: 'Tokyo',
    distribution: [
      { option_id: 1, option_text: 'Seoul', count: 0, percentage: 0, is_correct: false },
      { option_id: 2, option_text: 'Tokyo', count: 6, percentage: 85.7, is_correct: true },
      { option_id: 3, option_text: 'Beijing', count: 1, percentage: 14.3, is_correct: false },
      { option_id: 4, option_text: 'Bangkok', count: 0, percentage: 0, is_correct: false },
    ],
  },
  {
    question_id: 2,
    question_text: 'Which continent is the Sahara Desert located on?',
    correct_count: 5,
    incorrect_count: 2,
    unanswered_count: 0,
    total_participants: 7,
    correct_option_id: 7,
    correct_option_text: 'Africa',
    distribution: [
      { option_id: 5, option_text: 'Asia', count: 1, percentage: 14.3, is_correct: false },
      { option_id: 6, option_text: 'South America', count: 1, percentage: 14.3, is_correct: false },
      { option_id: 7, option_text: 'Africa', count: 5, percentage: 71.4, is_correct: true },
      { option_id: 8, option_text: 'Australia', count: 0, percentage: 0, is_correct: false },
    ],
  },
];

// ==========================================
// Mock Session Report
// ==========================================
export const mockReport: SessionReport = {
  session_id: 1,
  quiz_title: 'World Geography Challenge',
  host_name: 'Alex Thompson',
  started_at: '2026-10-08T10:00:00Z',
  ended_at: '2026-10-08T10:25:00Z',
  participant_count: 7,
  total_questions: 5,
  average_accuracy: 68.6,
  participants: mockParticipants,
  question_results: mockQuestionResults,
};
