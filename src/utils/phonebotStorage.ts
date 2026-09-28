import { CallerMessage, TourReservation, PhonebotCallMetrics } from '../types.ts';
import { logLifespanEvent } from './userHistoryStorage.ts';
import { getCentralDateTime } from './time.ts';

const MESSAGES_KEY = 'ich_phonebot_messages_v4';
const RESERVATIONS_KEY = 'ich_phonebot_reservations_v4';
const METRICS_KEY = 'ich_phonebot_metrics_v4';

// In-memory fallback ensuring 100% compatibility across all computers (Safari private mode, restricted iframes, disabled storage)
const memoryStorage: Record<string, string> = {};

function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return memoryStorage[key] || null;
}

function safeSet(key: string, val: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  } catch {}
  memoryStorage[key] = val;
}

function safeRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {}
  delete memoryStorage[key];
}

// Known legacy fabricated mock caller names and IDs from older templates - strictly eliminated
const FABRICATED_CALLER_NAMES = new Set([
  'David Reynolds',
  'Noorudin Valliani',
  'Salima Manji',
  'Sarah Jenkins',
  'Dr. Tariq Merchant',
]);

const FABRICATED_MESSAGE_IDS = new Set([
  'msg-today-1',
  'msg-yesterday-1',
  'msg-yesterday-2',
]);

const FABRICATED_VISITOR_NAMES = new Set([
  'Aliyah Patel',
  'Farhan Karmali',
  'Elena Rostova',
  'Marcus Chen',
]);

const FABRICATED_RESERVATION_IDS = new Set([
  'res-today-1',
  'res-yesterday-1',
]);

// Purge any legacy fabricated mock entries from previous versions
if (typeof window !== 'undefined') {
  try {
    safeRemove('ich_phonebot_messages_v1');
    safeRemove('ich_phonebot_reservations_v1');
    safeRemove('ich_phonebot_metrics_v1');
    safeRemove('ich_phonebot_messages_v2');
    safeRemove('ich_phonebot_reservations_v2');
    safeRemove('ich_phonebot_metrics_v2');
    safeRemove('ich_phonebot_messages_v3');
    safeRemove('ich_phonebot_reservations_v3');
    safeRemove('ich_phonebot_metrics_v3');
  } catch {}
}

// Strict zero-fabrication initial state: empty arrays
export const INITIAL_MESSAGES: CallerMessage[] = [];
export const INITIAL_RESERVATIONS: TourReservation[] = [];

export const INITIAL_METRICS: PhonebotCallMetrics = {
  totalCalls: 0,
  inquiriesResolved: 0,
  toursBooked: 0,
  messagesRecorded: 0,
  handoffsEscalated: 0,
  minutesSaved: 0,
};

/**
 * Retrieve genuine caller messages. Strictly non-fabricated.
 */
export function getCallerMessages(): CallerMessage[] {
  const raw = safeGet(MESSAGES_KEY);
  if (!raw) {
    safeSet(MESSAGES_KEY, JSON.stringify([]));
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      safeSet(MESSAGES_KEY, JSON.stringify([]));
      return [];
    }

    // Filter out any fabricated or mock entries
    const genuine = parsed.filter(
      (m: CallerMessage) =>
        m &&
        m.id &&
        !FABRICATED_MESSAGE_IDS.has(m.id) &&
        !FABRICATED_CALLER_NAMES.has(m.callerName)
    );

    if (genuine.length !== parsed.length) {
      safeSet(MESSAGES_KEY, JSON.stringify(genuine));
    }

    return genuine;
  } catch {
    safeSet(MESSAGES_KEY, JSON.stringify([]));
    return [];
  }
}

/**
 * Save a real caller message left by a visitor.
 */
export function saveCallerMessage(msg: Omit<CallerMessage, 'id' | 'createdAt' | 'status'>): CallerMessage {
  const current = getCallerMessages();
  const central = getCentralDateTime();
  const newMsg: CallerMessage = {
    ...msg,
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: `Today at ${central.time}`,
    status: 'pending',
  };
  const updated = [newMsg, ...current];
  safeSet(MESSAGES_KEY, JSON.stringify(updated));
  incrementMetric('messagesRecorded');
  incrementMetric('minutesSaved', 6);

  logLifespanEvent({
    type: 'caller_message',
    title: `Voicemail Recorded: ${newMsg.callerName}`,
    summary: `${newMsg.callerName} (${newMsg.callerPhone}) left a message for ${newMsg.department}.`,
    userIdentifier: `${newMsg.callerName} (${newMsg.callerPhone})`,
    status: 'pending',
    details: {
      department: newMsg.department,
      urgency: newMsg.urgency,
      message: newMsg.messageText,
    },
  });

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('ich_phonebot_data_updated'));
    } catch {}
  }

  return newMsg;
}

export function updateMessageStatus(id: string, status: 'pending' | 'reviewed' | 'resolved'): CallerMessage[] {
  const current = getCallerMessages();
  const updated = current.map(m => m.id === id ? { ...m, status } : m);
  safeSet(MESSAGES_KEY, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('ich_phonebot_data_updated'));
    } catch {}
  }

  return updated;
}

export function deleteCallerMessage(id: string): CallerMessage[] {
  const current = getCallerMessages();
  const updated = current.filter(m => m.id !== id);
  safeSet(MESSAGES_KEY, JSON.stringify(updated));

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('ich_phonebot_data_updated'));
    } catch {}
  }

  return updated;
}

/**
 * Retrieve genuine tour reservations/intake inquiries. Strictly non-fabricated.
 */
export function getTourReservations(): TourReservation[] {
  const raw = safeGet(RESERVATIONS_KEY);
  if (!raw) {
    safeSet(RESERVATIONS_KEY, JSON.stringify([]));
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      safeSet(RESERVATIONS_KEY, JSON.stringify([]));
      return [];
    }

    // Filter out any fabricated or mock entries
    const genuine = parsed.filter(
      (r: TourReservation) =>
        r &&
        r.id &&
        !FABRICATED_RESERVATION_IDS.has(r.id) &&
        !FABRICATED_VISITOR_NAMES.has(r.visitorName)
    );

    if (genuine.length !== parsed.length) {
      safeSet(RESERVATIONS_KEY, JSON.stringify(genuine));
    }

    return genuine;
  } catch {
    safeSet(RESERVATIONS_KEY, JSON.stringify([]));
    return [];
  }
}

/**
 * Save a real tour reservation/intake inquiry.
 */
export function saveTourReservation(res: Omit<TourReservation, 'id' | 'confirmationCode' | 'createdAt' | 'status'>): TourReservation {
  const current = getTourReservations();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const central = getCentralDateTime();
  const newRes: TourReservation = {
    ...res,
    id: `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    confirmationCode: `ICH-TOUR-2026-${randomSuffix}`,
    createdAt: `Today at ${central.time}`,
    status: 'confirmed',
  };
  const updated = [newRes, ...current];
  safeSet(RESERVATIONS_KEY, JSON.stringify(updated));
  incrementMetric('toursBooked');
  incrementMetric('inquiriesResolved');
  incrementMetric('minutesSaved', 8);

  logLifespanEvent({
    type: 'tour_booking',
    title: `Tour Reserved: ${newRes.visitorName}`,
    summary: `Confirmed architectural tour for ${newRes.partySize} ${newRes.partySize === 1 ? 'person' : 'people'} on ${newRes.tourDate} at ${newRes.timeSlot}.`,
    userIdentifier: `${newRes.visitorName} (${newRes.contactEmailOrPhone})`,
    status: 'confirmed',
    details: {
      confirmationCode: newRes.confirmationCode,
      partySize: newRes.partySize,
      tourDate: newRes.tourDate,
      timeSlot: newRes.timeSlot,
    },
  });

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('ich_phonebot_data_updated'));
    } catch {}
  }

  return newRes;
}

export function getPhonebotMetrics(): PhonebotCallMetrics {
  const raw = safeGet(METRICS_KEY);
  if (!raw) {
    safeSet(METRICS_KEY, JSON.stringify(INITIAL_METRICS));
    return { ...INITIAL_METRICS };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      totalCalls: Number(parsed.totalCalls) || 0,
      inquiriesResolved: Number(parsed.inquiriesResolved) || 0,
      toursBooked: Number(parsed.toursBooked) || 0,
      messagesRecorded: Number(parsed.messagesRecorded) || 0,
      handoffsEscalated: Number(parsed.handoffsEscalated) || 0,
      minutesSaved: Number(parsed.minutesSaved) || 0,
    };
  } catch {
    return { ...INITIAL_METRICS };
  }
}

export function incrementMetric(field: keyof PhonebotCallMetrics, amount: number = 1): PhonebotCallMetrics {
  const current = getPhonebotMetrics();
  current[field] = (current[field] || 0) + amount;
  safeSet(METRICS_KEY, JSON.stringify(current));

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('ich_phonebot_data_updated'));
    } catch {}
  }

  return current;
}

/**
 * Generates ready-to-deploy Twilio Voice TwiML Webhook code for this phonebot
 */
export function generateTwilioTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Twilio Voice TwiML Webhook for Ismaili Center Houston AI Phonebot -->
<!-- Connect to phone number +1 (713) 522-2026 or provisioned Twilio DID -->
<Response>
    <!-- Greet caller with honest disclaimer -->
    <Say voice="Polly.Brian" language="en-GB">
        Hello! Welcome to the Ismaili Center Houston AI Phonebot. I am an automated computer helper, not a human.
    </Say>
    
    <!-- Gather Speech or DTMF input -->
    <Gather input="speech dtmf" timeout="4" numDigits="1" action="/api/telephony/twilio-turn" method="POST">
        <Say voice="Polly.Brian" language="en-GB">
            To talk with me, press 1 or speak your question.
            For visiting hours, press 2.
            For prayer times, press 3.
            For free tours, press 4.
            For directions and parking, press 5.
            To speak with human staff, press 0.
        </Say>
    </Gather>

    <!-- Fallback if no input received -->
    <Redirect>/api/telephony/twilio-fallback</Redirect>
</Response>`;
}

/**
 * Generates ready-to-deploy Vapi.ai / Retell AI Agent JSON configuration
 */
export function generateVapiAgentConfig(): string {
  const config = {
    name: "Ismaili Center Houston AI Phonebot",
    voice: {
      provider: "11labs",
      voiceId: "brian",
      stability: 0.75,
      similarityBoost: 0.85,
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    model: {
      provider: "google",
      model: "gemini-2.5-flash",
      temperature: 0.3,
      systemPrompt: `You are the automated AI Phonebot assistant for the Ismaili Center Houston (located at Montrose Blvd & Allen Pkwy, Houston, TX).
You are an AI computer assistant, NOT a human.
CRITICAL RULES:
1. Speak in simple, friendly, natural conversational English. Immigrants and seniors frequently call, so keep vocabulary clear.
2. NEVER use the words "Subha Jo Niyaz" or "Sanjhi Dua". Instead use "Morning Dua" (or "Morning Prayer") and "Evening Prayer".
3. Public visiting hours: Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM Central Time (Gardens open 8:00 AM). Free admission.
4. Jamatkhana: Bandagi 4:00-5:00 AM CT, Morning Dua 5:00-5:30 AM CT, Evening Prayer 7:00 PM CT (Fridays 7:30 PM CT).
5. If caller wants to book a tour, call the 'book_tour' tool.
6. If caller wants to leave a message, call the 'take_message' tool.
7. If the caller needs human staff or you cannot answer, transfer to +1 (713) 522-2026.`,
      tools: [
        {
          type: "function",
          function: {
            name: "book_tour",
            description: "Register a free architectural tour reservation for the caller",
            parameters: {
              type: "object",
              properties: {
                visitorName: { type: "string" },
                partySize: { type: "number" },
                preferredDay: { type: "string", enum: ["Tuesday", "Thursday", "Saturday", "Sunday"] },
                timeSlot: { type: "string", enum: ["10:30 AM", "1:30 PM", "3:00 PM"] },
                phoneOrEmail: { type: "string" },
              },
              required: ["visitorName", "partySize", "preferredDay", "timeSlot"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "take_message",
            description: "Record a voicemail / callback message for the front desk staff",
            parameters: {
              type: "object",
              properties: {
                callerName: { type: "string" },
                callbackPhone: { type: "string" },
                department: { type: "string" },
                messageText: { type: "string" },
              },
              required: ["callerName", "callbackPhone", "messageText"],
            },
          },
        },
      ],
    },
    telephony: {
      transferNumber: "+17135222026",
      sipUri: "sip:reception@ismailicenter.org",
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600,
    },
  };

  return JSON.stringify(config, null, 2);
}
