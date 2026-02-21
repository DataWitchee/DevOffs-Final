
import { db } from './auth';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, runTransaction, collection, query, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { User, SkillDomain, ChallengeParticipant, ChallengeCheckpoint } from '../types';

/**
 * PSN LIVE ARENA: EVENT-SOURCED ARCHITECTURE
 * 
 * To ensure a "join anywhere, any device" experience that is "totally live and smooth,"
 * we use an Event-Sourced model on top of Firestore. 
 * 
 * 1. Authority: The list of Events in the document is the single source of truth.
 * 2. Determinism: Any client can replay the event log to arrive at the exact same session state.
 * 3. Atomic Updates: Transactions prevent race conditions during high-concurrency "join" or "finish" events.
 */

type EventType = 'SESSION_CREATED' | 'USER_JOINED' | 'USER_LEFT' | 'SCENARIO_SET' | 'SESSION_STARTED' | 'PROGRESS_UPDATED' | 'HEARTBEAT';

interface ChallengeEvent {
  type: EventType;
  timestamp: number;
  payload: any;
}

export interface ChallengeSession {
  id: string; // The 6-digit code
  hostId: string;
  domain: SkillDomain;
  status: 'waiting' | 'active' | 'finished';
  participants: ChallengeParticipant[];
  taskDescription?: string;
  checkpoints?: ChallengeCheckpoint[];
  startTime?: number;
  lastHeartbeat?: number;
  maxParticipants: number;
}

const SESSION_EXPIRY_MS = 1000 * 60 * 120; // 2 Hours
const MAX_PARTICIPANTS = 8;

/**
 * State Reducer: Reconstructs the ChallengeSession from an array of events.
 * This ensures the state is consistent across all connected devices.
 */
const reduceSessionState = (events: ChallengeEvent[], initialId: string): ChallengeSession | null => {
  if (events.length === 0) return null;

  let state: ChallengeSession = {
    id: initialId,
    hostId: '',
    domain: SkillDomain.DSA,
    status: 'waiting',
    participants: [],
    maxParticipants: MAX_PARTICIPANTS,
    lastHeartbeat: Date.now()
  };

  // Sort events by timestamp to ensure deterministic replay
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  for (const event of sortedEvents) {
    switch (event.type) {
      case 'SESSION_CREATED':
        state.hostId = event.payload.host.id;
        state.domain = event.payload.domain;
        state.participants = [{
          id: event.payload.host.id,
          name: event.payload.host.name,
          avatar: event.payload.host.avatar || 'H',
          progress: 0,
          score: 0,
          status: 'coding',
          isBot: false
        }];
        break;
      case 'USER_JOINED':
        if (state.participants.length < state.maxParticipants) {
          const existing = state.participants.find(p => p.id === event.payload.user.id);
          if (!existing) {
            state.participants.push({
              id: event.payload.user.id,
              name: event.payload.user.name,
              avatar: event.payload.user.avatar || 'P',
              progress: 0,
              score: 0,
              status: 'coding',
              isBot: false
            });
          }
        }
        break;
      case 'USER_LEFT':
        state.participants = state.participants.filter(p => p.id !== event.payload.userId);
        break;
      case 'SCENARIO_SET':
        state.taskDescription = event.payload.taskDescription;
        state.checkpoints = event.payload.checkpoints;
        break;
      case 'SESSION_STARTED':
        state.status = 'active';
        state.startTime = event.payload.startTime;
        break;
      case 'PROGRESS_UPDATED':
        state.participants = state.participants.map(p =>
          p.id === event.payload.userId
            ? { ...p, progress: event.payload.progress, status: event.payload.status }
            : p
        );
        break;
      case 'HEARTBEAT':
        state.lastHeartbeat = event.timestamp;
        break;
    }
  }
  return state;
};

const generateSessionCode = () => {
  // Uses uppercase alphanumeric excluding confusing chars (0, O, I, 1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const firebaseImplementation = {

  /**
   * Appends an event to the session using a Firestore Transaction.
   * This handles concurrency: if two people join at the exact same millisecond,
   * Firestore will retry until one succeeds, ensuring the participant list is correct.
   */
  async appendEvent(code: string, type: EventType, payload: any): Promise<void> {
    if (!db) throw new Error("Database connection unavailable.");

    const sessionRef = doc(db, 'challenges', code);

    await runTransaction(db, async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
      let currentEvents: ChallengeEvent[] = [];

      if (sessionDoc.exists()) {
        const data = sessionDoc.data();
        // Integrity Check: Do not append to expired sessions
        if (data.lastHeartbeat && (Date.now() - data.lastHeartbeat > SESSION_EXPIRY_MS)) {
          throw new Error("Session has expired.");
        }
        currentEvents = data.events || [];
      } else if (type !== 'SESSION_CREATED') {
        throw new Error("Target session does not exist.");
      }

      const newEvent: ChallengeEvent = {
        type,
        timestamp: Date.now(),
        payload
      };

      const updatedEvents = [...currentEvents, newEvent];
      const newState = reduceSessionState(updatedEvents, code);

      if (newState) {
        // We persist the calculated state AND the event list for the smoothest possible UI updates
        transaction.set(sessionRef, {
          ...newState,
          events: updatedEvents,
          lastUpdated: serverTimestamp()
        });
      }
    });
  },

  async createSession(host: User, domain: SkillDomain): Promise<string> {
    const code = generateSessionCode();
    try {
      await this.appendEvent(code, 'SESSION_CREATED', { host, domain });
      return code;
    } catch (e) {
      console.error("Session Creation Failure:", e);
      return "OFFLINE";
    }
  },

  async joinSession(code: string, user: User): Promise<{ success: boolean; message?: string }> {
    try {
      await this.appendEvent(code, 'USER_JOINED', { user });
      return { success: true };
    } catch (e: any) {
      console.error("Session Join Failure:", e.message);
      return { success: false, message: e.message || "Failed to join duel." };
    }
  },

  async leaveSession(code: string, userId: string): Promise<void> {
    try {
      await this.appendEvent(code, 'USER_LEFT', { userId });
    } catch (e) {
      console.warn("Silent leave failure:", e);
    }
  },

  async setSessionScenario(code: string, taskDescription: string, checkpoints: ChallengeCheckpoint[]): Promise<void> {
    try {
      await this.appendEvent(code, 'SCENARIO_SET', { taskDescription, checkpoints });
    } catch (e) { console.warn("Failed to set scenario:", e); }
  },

  async startSession(code: string): Promise<void> {
    try {
      await this.appendEvent(code, 'SESSION_STARTED', { startTime: Date.now() });
    } catch (e) { console.warn("Failed to start session:", e); }
  },

  async updateProgress(code: string, userId: string, progress: number, status: 'coding' | 'validating' | 'finished'): Promise<void> {
    try {
      await this.appendEvent(code, 'PROGRESS_UPDATED', { userId, progress, status });
      // Optional: Send periodic heartbeats here if session duration is very long
    } catch (e) { console.warn("Failed to update progress:", e); }
  },

  subscribeToSession(code: string, callback: (data: ChallengeSession | null) => void): () => void {
    if (!db) return () => { };
    const sessionRef = doc(db, 'challenges', code);

    // onSnapshot provides real-time "Totally Live" updates with ultra-low latency
    return onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ChallengeSession;
        callback(data);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Live Stream Error:", error);
    });
  }
};

/**
 * MOCK IMPLEMENTATION (LOCAL STORAGE)
 * Fallback for guest users or offline testing
 */
const MOCK_STORAGE_KEY = 'psn_mock_event_store';

const getMockEvents = (code: string): ChallengeEvent[] => {
  try {
    const store = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '{}');
    return store[code] || [];
  } catch (e) { return []; }
};

const saveMockEvent = (code: string, event: ChallengeEvent) => {
  const store = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '{}');
  if (!store[code]) store[code] = [];
  store[code].push(event);
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store));
};

const mockImplementation = {
  async createSession(host: User, domain: SkillDomain): Promise<string> {
    const code = generateSessionCode();
    saveMockEvent(code, { type: 'SESSION_CREATED', timestamp: Date.now(), payload: { host, domain } });
    return code;
  },

  async joinSession(code: string, user: User): Promise<{ success: boolean; message?: string }> {
    saveMockEvent(code, { type: 'USER_JOINED', timestamp: Date.now(), payload: { user } });
    return { success: true };
  },

  async leaveSession(code: string, userId: string): Promise<void> {
    saveMockEvent(code, { type: 'USER_LEFT', timestamp: Date.now(), payload: { userId } });
  },

  async setSessionScenario(code: string, taskDescription: string, checkpoints: ChallengeCheckpoint[]): Promise<void> {
    saveMockEvent(code, { type: 'SCENARIO_SET', timestamp: Date.now(), payload: { taskDescription, checkpoints } });
  },

  async startSession(code: string): Promise<void> {
    saveMockEvent(code, { type: 'SESSION_STARTED', timestamp: Date.now(), payload: { startTime: Date.now() } });
  },

  async updateProgress(code: string, userId: string, progress: number, status: 'coding' | 'validating' | 'finished'): Promise<void> {
    saveMockEvent(code, { type: 'PROGRESS_UPDATED', timestamp: Date.now(), payload: { userId, progress, status } });
  },

  subscribeToSession(code: string, callback: (data: ChallengeSession | null) => void): () => void {
    const check = () => {
      const events = getMockEvents(code);
      const state = reduceSessionState(events, code);
      callback(state);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }
};

const isOfflineUser = (user: User | string) => {
  const id = typeof user === 'string' ? user : user.id;
  return id.startsWith('offline_guest_');
};

/**
 * Challenge Service Factory
 * Dispatches to the most available "Solid" implementation.
 */
export const challengeService = {
  createSession: async (h: User, d: SkillDomain) => {
    if (isOfflineUser(h)) return mockImplementation.createSession(h, d);
    const res = await firebaseImplementation.createSession(h, d);
    if (res === "OFFLINE") return mockImplementation.createSession(h, d);
    return res;
  },
  joinSession: async (c: string, u: User) => {
    let res = await firebaseImplementation.joinSession(c, u);
    if (res.success) return res;
    return mockImplementation.joinSession(c, u);
  },
  leaveSession: async (c: string, u: string) => {
    await firebaseImplementation.leaveSession(c, u);
    await mockImplementation.leaveSession(c, u);
  },
  setSessionScenario: async (c: string, t: string, cp: ChallengeCheckpoint[]) => {
    await firebaseImplementation.setSessionScenario(c, t, cp);
    await mockImplementation.setSessionScenario(c, t, cp);
  },
  startSession: async (c: string) => {
    await firebaseImplementation.startSession(c);
    await mockImplementation.startSession(c);
  },
  updateProgress: async (c: string, u: string, p: number, s: 'coding' | 'validating' | 'finished') => {
    await firebaseImplementation.updateProgress(c, u, p, s);
    await mockImplementation.updateProgress(c, u, p, s);
  },
  subscribeToSession: (c: string, cb: (d: ChallengeSession | null) => void) => {
    const mockUnsub = mockImplementation.subscribeToSession(c, (data) => { if (data) cb(data); });
    const fbUnsub = firebaseImplementation.subscribeToSession(c, (data) => { if (data) cb(data); });
    return () => { mockUnsub(); fbUnsub(); };
  },
};
