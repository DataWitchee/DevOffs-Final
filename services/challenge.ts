
import { db } from './auth';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, runTransaction, collection, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { User, SkillDomain, ChallengeParticipant, ChallengeCheckpoint } from '../types';

// EVENT SOURCING ARCHITECTURE
// State is derived from an immutable log of events, not stored directly.

type EventType = 'SESSION_CREATED' | 'USER_JOINED' | 'USER_LEFT' | 'SCENARIO_SET' | 'SESSION_STARTED' | 'PROGRESS_UPDATED';

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
}

// Reducer Function to reconstruct state from events
const reduceSessionState = (events: ChallengeEvent[], initialId: string): ChallengeSession | null => {
    if (events.length === 0) return null;

    // Base State
    let state: ChallengeSession = {
        id: initialId,
        hostId: '',
        domain: SkillDomain.ALGORITHMS, // Default
        status: 'waiting',
        participants: [],
    };

    for (const event of events) {
        switch (event.type) {
            case 'SESSION_CREATED':
                state.hostId = event.payload.host.id;
                state.domain = event.payload.domain;
                state.participants.push({
                    id: event.payload.host.id,
                    name: event.payload.host.name,
                    avatar: event.payload.host.avatar || 'H',
                    progress: 0,
                    score: 0,
                    status: 'coding',
                    isBot: false
                });
                break;
            case 'USER_JOINED':
                if (!state.participants.find(p => p.id === event.payload.user.id)) {
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
        }
    }
    return state;
};

// Generate a random 6-character code
const generateSessionCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const firebaseImplementation = {
  
  async appendEvent(code: string, type: EventType, payload: any): Promise<void> {
     if (!db) throw new Error("DB offline");
     // Store the event in a subcollection 'events' under the session doc
     // This ensures we can replay them.
     // Also update the snapshot doc for quick read access (Hybrid approach)
     const sessionRef = doc(db, 'challenges', code);
     
     // Note: In a true production system, we would write to an Event Store (Kafka/EventStoreDB)
     // and have a projector update the read model. Here we mimic it by updating the read model immediately via transaction.
     
     await runTransaction(db, async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        let currentEvents: ChallengeEvent[] = [];
        
        if (sessionDoc.exists()) {
             currentEvents = sessionDoc.data().events || [];
        } else if (type !== 'SESSION_CREATED') {
            throw "Session does not exist";
        }

        const newEvent: ChallengeEvent = { type, timestamp: Date.now(), payload };
        const updatedEvents = [...currentEvents, newEvent];
        const newState = reduceSessionState(updatedEvents, code);

        if (newState) {
             transaction.set(sessionRef, { ...newState, events: updatedEvents });
        }
     });
  },

  async createSession(host: User, domain: SkillDomain): Promise<string> {
    const code = generateSessionCode();
    try {
      await this.appendEvent(code, 'SESSION_CREATED', { host, domain });
      return code;
    } catch (e) {
      console.error("Firebase createSession failed:", e);
      return "OFFLINE"; 
    }
  },

  async joinSession(code: string, user: User): Promise<{ success: boolean; message?: string }> {
    try {
      await this.appendEvent(code, 'USER_JOINED', { user });
      return { success: true };
    } catch (e: any) {
      return { success: false, message: "Connection failed" };
    }
  },

  async leaveSession(code: string, userId: string): Promise<void> {
     try { await this.appendEvent(code, 'USER_LEFT', { userId }); } catch(e){}
  },

  async setSessionScenario(code: string, taskDescription: string, checkpoints: ChallengeCheckpoint[]): Promise<void> {
     try { await this.appendEvent(code, 'SCENARIO_SET', { taskDescription, checkpoints }); } catch(e){}
  },

  async startSession(code: string): Promise<void> {
     try { await this.appendEvent(code, 'SESSION_STARTED', { startTime: Date.now() }); } catch(e){}
  },

  async updateProgress(code: string, userId: string, progress: number, status: 'coding' | 'validating' | 'finished'): Promise<void> {
     try { await this.appendEvent(code, 'PROGRESS_UPDATED', { userId, progress, status }); } catch(e){}
  },

  subscribeToSession(code: string, callback: (data: ChallengeSession | null) => void): () => void {
    if (!db) return () => {};
    const sessionRef = doc(db, 'challenges', code);
    return onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
          // In a pure event sourcing system, we'd fetch events and reduce.
          // Here we assume the transaction in appendEvent updated the snapshot.
          const data = doc.data() as ChallengeSession;
          callback(data);
      } else {
          callback(null);
      }
    });
  }
};

// MOCK IMPLEMENTATION (LOCAL STORAGE EVENT SOURCING)
const MOCK_STORAGE_KEY = 'psn_mock_event_store';

const getMockEvents = (code: string): ChallengeEvent[] => {
    const store = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '{}');
    return store[code] || [];
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
    const interval = setInterval(check, 500); // Polling for mock
    return () => clearInterval(interval);
  }
};

const isOfflineUser = (user: User | string) => {
    const id = typeof user === 'string' ? user : user.id;
    return id.startsWith('offline_guest_');
};

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
