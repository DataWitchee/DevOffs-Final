
export interface User {
  id: string;
  name: string;
  isPremium: boolean;
  avatar: string;
  banner?: string; // NEW: Profile Banner
  country?: string; // NEW: User Location
  email?: string;
  username?: string;
  bio?: string;
  skills?: string[];
  isOnboarded?: boolean;
  isAuthenticated?: boolean; // Added for login flow
  isCertified?: boolean; // NEW: Global Certification Badge
  hasExamAccess?: boolean; // NEW: Paid access to exams
  biometrics?: {
    descriptor: Float32Array | number[];
    age?: number;
    gender?: string;
    expressions?: Record<string, number>;
  };
  history?: TrialSession[];
  interviews?: InterviewSession[]; // New: Interview History
  exams?: ExamSession[]; // New: Competitive Exams History
  stats?: {
    trialsCompleted: number;
    arenaWins: number;
    globalRank: number;
    topPercentile: number;
    examsPassed: number;
  };
  monthlyUsage?: {
    trialsUsed: number;
    interviewsUsed: number;
    lastResetDate: number;
  };
}

export enum SkillDomain {
  DSA = "DSA",
  MACHINE_LEARNING = "Machine Learning",
  BACKEND = "Backend",
  FRONTEND = "Frontend"
}

export interface SkillDNAScore {
  problemSolving: number;
  executionSpeed: number;
  conceptualDepth: number;
  aiLeverage: number;
  riskAwareness: number;
  average: number;
}

export interface TrialSession {
  id: string;
  domain: SkillDomain;
  status: 'idle' | 'generating' | 'setup' | 'active' | 'analyzing' | 'completed';
  startTime?: number;
  endTime?: number;
  taskDescription?: string;
  constraints?: string[];
  userSolution?: string;
  userReasoning?: string;
  score?: SkillDNAScore;
  feedback?: string;
}

export interface AntiCheatLog {
  tabSwitchCount: number;
  pasteCount: number;
  focusLostTime: number; // in ms
  environmentViolations?: string[];
}

// --- INTERVIEW TYPES ---
export interface InterviewQuestion {
  id: number;
  text: string;
  timeLimit: number; // seconds
}

export interface InterviewSession {
  id: string;
  domain: SkillDomain;
  status: 'active' | 'completed';
  startTime: number;
  questions: InterviewQuestion[];
  responses: {
    questionId: number;
    transcript: string;
    score: number;
    feedback: string;
  }[];
  overallScore: number;
  feedback: string;
}

// --- COMPETITIVE EXAM TYPES ---
export interface ExamMCQ {
  id: number;
  question: string;
  options: string[];
  correctIndex: number; // WARNING: Currently exposed to the client. Should be managed server-side in a production environment.
  userAnswer?: number;
}

export interface ExamTheory {
  id: number;
  question: string;
  userAnswer?: string;
}

export interface ExamPractical {
  id: number;
  task: string;
  constraints: string[];
  userAnswer?: string;
}

export interface ExamSession {
  id: string;
  domain: SkillDomain;
  status: 'setup' | 'mcq' | 'theory' | 'practical' | 'grading' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;

  mcqData: ExamMCQ[];
  theoryData: ExamTheory[];
  practicalData: ExamPractical[];

  sectionScores: {
    mcq: number;
    theory: number;
    practical: number;
  };
  overallScore: number;
  feedback: string;

  antiCheat: AntiCheatLog;
}

// --- NEW TYPES FOR CHALLENGE MODE ---
export interface ChallengeParticipant {
  id: string;
  name: string;
  avatar?: string; // initial or url
  progress: number; // 0 to 100
  score: number;
  status: 'coding' | 'validating' | 'finished';
  isBot: boolean;
}

export interface ChallengeCheckpoint {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface LiveChallenge {
  id: string;
  domain: SkillDomain;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  participants: ChallengeParticipant[];
  checkpoints: ChallengeCheckpoint[];
  taskDescription: string;
  startTime: number;
  durationSeconds: number;
}

// --- NEW TYPES FOR LEADERBOARD ---
export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  domainSpecialty: string;
  score: number; // The primary metric being sorted by (e.g. Skill DNA or Win Count)
  secondaryScore?: number; // e.g. Trials count
  change: number; // Rank change (positive or negative)
  isCurrentUser: boolean;
  isCertified?: boolean; // NEW: Display badge on leaderboard
}

export type LeaderboardTimeframe = 'weekly' | 'monthly' | 'all-time';
export type LeaderboardMetric = 'skill_dna' | 'arena_wins' | 'trials_completed';
