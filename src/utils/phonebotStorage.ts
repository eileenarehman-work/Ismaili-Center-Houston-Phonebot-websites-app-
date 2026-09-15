import { CallerMessage, TourReservation, PhonebotCallMetrics } from '../types.ts';

const MESSAGES_KEY = 'ich_phonebot_messages_v1';
const RESERVATIONS_KEY = 'ich_phonebot_reservations_v1';
const METRICS_KEY = 'ich_phonebot_metrics_v1';

// Initial sample messages to demonstrate reception triage
const INITIAL_MESSAGES: CallerMessage[] = [
  {
    id: 'msg-001',
    callerName: 'Sarah Jenkins',
    callerPhone: '+1 (713) 445-9821',
    department: 'Guided Tours & Visitor Services',
    messageText: 'Inquiring about booking an architectural tour for a group of 14 architecture students next month.',
    urgency: 'routine',
    createdAt: 'Today at 10:14 AM',
    status: 'pending',
  },
  {
    id: 'msg-002',
    callerName: 'Dr. Tariq Merchant',
    callerPhone: '+1 (281) 682-1130',
    department: 'Facilities & Auditorium',
    messageText: 'Requesting information regarding hosting an interfaith academic lecture in the civic auditorium.',
    urgency: 'urgent',
    createdAt: 'Yesterday at 3:45 PM',
    status: 'reviewed',
  },
];

// Initial sample tour reservations
const INITIAL_RESERVATIONS: TourReservation[] = [
  {
    id: 'res-001',
    confirmationCode: 'ICH-TOUR-2026-4482',
    visitorName: 'Elena Rostova',
    partySize: 2,
    tourDate: 'Saturday, March 21, 2026',
    timeSlot: '10:30 AM CT',
    contactEmailOrPhone: 'elena.rostova@example.com',
    createdAt: 'Today at 9:30 AM',
    status: 'confirmed',
  },
  {
    id: 'res-002',
    confirmationCode: 'ICH-TOUR-2026-9120',
    visitorName: 'Marcus Chen',
    partySize: 4,
    tourDate: 'Sunday, March 22, 2026',
    timeSlot: '1:30 PM CT',
    contactEmailOrPhone: '+1 (832) 555-0199',
    createdAt: 'Yesterday at 2:15 PM',
    status: 'confirmed',
  },
];

// Initial metrics
const INITIAL_METRICS: PhonebotCallMetrics = {
  totalCalls: 148,
  inquiriesResolved: 129,
  toursBooked: 24,
  messagesRecorded: 16,
  handoffsEscalated: 9,
  minutesSaved: 485, // ~8 hours front-desk workload saved
};

export function getCallerMessages(): CallerMessage[] {
  if (typeof window === 'undefined') return INITIAL_MESSAGES;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MESSAGES;
  }
}

export function saveCallerMessage(msg: Omit<CallerMessage, 'id' | 'createdAt' | 'status'>): CallerMessage {
  const current = getCallerMessages();
  const newMsg: CallerMessage = {
    ...msg,
    id: `msg-${Date.now()}`,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' CT',
    status: 'pending',
  };
  const updated = [newMsg, ...current];
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
    incrementMetric('messagesRecorded');
    incrementMetric('minutesSaved', 6);
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
    return JSON.parse(raw);
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
