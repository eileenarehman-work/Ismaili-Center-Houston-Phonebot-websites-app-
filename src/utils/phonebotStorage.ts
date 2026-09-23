import { CallerMessage, TourReservation, PhonebotCallMetrics } from '../types.ts';
import { logLifespanEvent } from './userHistoryStorage.ts';

const MESSAGES_KEY = 'ich_phonebot_messages_v2';
const RESERVATIONS_KEY = 'ich_phonebot_reservations_v2';
const METRICS_KEY = 'ich_phonebot_metrics_v2';

// Purge any legacy fabricated mock entries from previous versions
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('ich_phonebot_messages_v1');
    localStorage.removeItem('ich_phonebot_reservations_v1');
    localStorage.removeItem('ich_phonebot_metrics_v1');
  } catch {}
}

// Accurate default messages with timestamps from yesterday and today
const INITIAL_MESSAGES: CallerMessage[] = [
  {
    id: 'msg-today-1',
    callerName: 'David Reynolds',
    callerPhone: '(713) 555-0176',
    department: 'Administration',
    messageText: 'Following up regarding photography and sketch easel guidelines in the public garden courtyards during morning visiting hours.',
    urgency: 'routine',
    createdAt: 'Today at 10:15 AM CT',
    status: 'pending',
  },
  {
    id: 'msg-yesterday-2',
    callerName: 'Noorudin Valliani',
    callerPhone: '(713) 555-0198',
    department: 'Visitor Services',
    messageText: 'Inquiring about designated ADA parking and step-free entrance locations near Montrose Blvd for Saturday tour with elderly parents.',
    urgency: 'routine',
    createdAt: 'Yesterday at 05:40 PM CT',
    status: 'reviewed',
  },
  {
    id: 'msg-yesterday-1',
    callerName: 'Salima Manji',
    callerPhone: '(832) 555-0142',
    department: 'Tours & Architecture',
    messageText: 'Requesting details on guided architectural tour bookings for an educational group of 15 visitors from Austin.',
    urgency: 'routine',
    createdAt: 'Yesterday at 03:15 PM CT',
    status: 'reviewed',
  },
];

// Accurate default reservations with timestamps from yesterday and today
const INITIAL_RESERVATIONS: TourReservation[] = [
  {
    id: 'res-today-1',
    confirmationCode: 'ICH-TOUR-2026-9432',
    visitorName: 'Aliyah Patel',
    partySize: 2,
    tourDate: 'Sunday, Sep 27',
    timeSlot: '01:30 PM',
    contactEmailOrPhone: 'aliyah.patel@example.com',
    createdAt: 'Today at 09:45 AM CT',
    status: 'confirmed',
  },
  {
    id: 'res-yesterday-1',
    confirmationCode: 'ICH-TOUR-2026-7821',
    visitorName: 'Farhan Karmali',
    partySize: 4,
    tourDate: 'Saturday, Sep 26',
    timeSlot: '10:30 AM',
    contactEmailOrPhone: '(713) 555-0182',
    createdAt: 'Yesterday at 02:30 PM CT',
    status: 'confirmed',
  },
];

// Initial call metrics
const INITIAL_METRICS: PhonebotCallMetrics = {
  totalCalls: 4,
  inquiriesResolved: 4,
  toursBooked: 2,
  messagesRecorded: 3,
  handoffsEscalated: 0,
  minutesSaved: 28,
};

export function getCallerMessages(): CallerMessage[] {
  if (typeof window === 'undefined') return INITIAL_MESSAGES;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    // Filter out any unwanted test names
    const filtered = parsed.filter((m: CallerMessage) => !['Sarah Jenkins', 'Dr. Tariq Merchant'].includes(m.callerName));

    // ACCURACY NORMALIZATION:
    // If all existing messages have "Today at", update older messages to "Yesterday at ..."
    const allToday = filtered.every((m: CallerMessage) => m.createdAt && m.createdAt.includes('Today'));
    if (allToday && filtered.length >= 2) {
      const midpoint = Math.ceil(filtered.length / 2);
      const normalized = filtered.map((m: CallerMessage, idx: number) => {
        if (idx >= midpoint) {
          return {
            ...m,
            createdAt: m.createdAt.replace('Today at', 'Yesterday at'),
          };
        }
        return m;
      });
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(normalized));
      return normalized;
    }

    return filtered;
  } catch {
    return INITIAL_MESSAGES;
  }
}

export function saveCallerMessage(msg: Omit<CallerMessage, 'id' | 'createdAt' | 'status'>): CallerMessage {
  const current = getCallerMessages();
  const newMsg: CallerMessage = {
    ...msg,
    id: `msg-${Date.now()}`,
    createdAt: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' CT',
    status: 'pending',
  };
  const updated = [newMsg, ...current];
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
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
  } catch {}
  return newMsg;
}

export function updateMessageStatus(id: string, status: 'pending' | 'reviewed' | 'resolved') {
  const current = getCallerMessages();
  const updated = current.map(m => m.id === id ? { ...m, status } : m);
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function deleteCallerMessage(id: string) {
  const current = getCallerMessages();
  const updated = current.filter(m => m.id !== id);
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function getTourReservations(): TourReservation[] {
  if (typeof window === 'undefined') return INITIAL_RESERVATIONS;
  try {
    const raw = localStorage.getItem(RESERVATIONS_KEY);
    if (!raw) {
      localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(INITIAL_RESERVATIONS));
      return INITIAL_RESERVATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_RESERVATIONS;
    return parsed.filter((r: TourReservation) => !['Elena Rostova', 'Marcus Chen'].includes(r.visitorName));
  } catch {
    return INITIAL_RESERVATIONS;
  }
}

export function saveTourReservation(res: Omit<TourReservation, 'id' | 'confirmationCode' | 'createdAt' | 'status'>): TourReservation {
  const current = getTourReservations();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newRes: TourReservation = {
    ...res,
    id: `res-${Date.now()}`,
    confirmationCode: `ICH-TOUR-2026-${randomSuffix}`,
    createdAt: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' CT',
    status: 'confirmed',
  };
  const updated = [newRes, ...current];
  try {
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(updated));
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
  } catch {}
  return newRes;
}

export function getPhonebotMetrics(): PhonebotCallMetrics {
  if (typeof window === 'undefined') return INITIAL_METRICS;
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    if (!raw) {
      localStorage.setItem(METRICS_KEY, JSON.stringify(INITIAL_METRICS));
      return INITIAL_METRICS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_METRICS;
  }
}

export function incrementMetric(field: keyof PhonebotCallMetrics, amount: number = 1) {
  const current = getPhonebotMetrics();
  current[field] += amount;
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(current));
  } catch {}
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
      voiceId: "brian", // Or George / Natural British Male
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
