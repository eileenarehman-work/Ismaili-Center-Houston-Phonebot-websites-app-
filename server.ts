import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Built-in high accuracy fallback knowledge base
function getKnowledgeBaseResponse(query: string): string {
  const q = (query || "").toLowerCase();
  if (
    q.includes("tour") ||
    q.includes("book") ||
    q.includes("visit") ||
    q.includes("open") ||
    q.includes("hour") ||
    q.includes("when")
  ) {
    return "The Ismaili Center Houston building is open to visitors on **Tuesdays, Thursdays, Saturdays, and Sundays** from **10:00 AM to 4:00 PM** (The 11-acre gardens open from 8:00 AM to 4:00 PM on visiting days). Admission is completely free! You can also reserve guided 45-minute architectural tours at: https://ismailicenter.org/tour-booking/";
  } else if (
    q.includes("schedule") ||
    q.includes("time") ||
    q.includes("prayer") ||
    q.includes("dua") ||
    q.includes("bandagi") ||
    q.includes("jamatkhana")
  ) {
    return "The official Jamatkhana prayer schedule is:\n- **Bandagi**: 4:00 AM – 5:00 AM daily\n- **Morning Dua**: 5:00 AM – 5:30 AM daily\n- **Evening Prayer**: 7:30 PM on Fridays; 7:00 PM on Mon–Thu, Sat & Sun.\n\nPlease note that while the prayer hall is reserved for congregational worship, all visitor spaces, gardens, and exhibition areas are open on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM.";
  } else if (
    q.includes("architect") ||
    q.includes("farshid") ||
    q.includes("moussavi") ||
    q.includes("building") ||
    q.includes("garden") ||
    q.includes("design")
  ) {
    return "The Ismaili Center Houston was designed by acclaimed Iranian-British architect **Farshid Moussavi** (Farshid Moussavi Architecture), marking her first cultural project in the United States. The 11 acres of lush Persian-inspired charbagh gardens were designed by **Nelson Byrd Woltz** Landscape Architects. Key design features include shaded triangular stone verandahs, expansive ceramic latticework, sustainable native landscaping, and civic amphitheaters.";
  } else if (q.includes("aga khan")) {
    return "His Highness the Aga Khan is the 49th hereditary Imam (spiritual leader) of the global Shia Imami Ismaili Muslims and founder of the Aga Khan Development Network (AKDN). He commissioned the Ismaili Center Houston as a permanent ambassadorial bridge for civic dialogue, pluralism, and cross-cultural understanding.";
  } else if (
    q.includes("faith") ||
    q.includes("ismaili") ||
    q.includes("who are") ||
    q.includes("shia")
  ) {
    return "Ismailis belong to the Shia branch of Islam, with a history spanning over a millennium. The community is culturally diverse and global, united in their allegiance to the living Imam. Ismaili traditions place paramount emphasis on education, intellectual inquiry, ethical stewardship, gender equity, and volunteer service to society.";
  } else if (
    q.includes("video") ||
    q.includes("youtube") ||
    q.includes("watch") ||
    q.includes("media")
  ) {
    return "You can watch curated official video documentaries—including the Spaces tour, Inauguration Ceremony, and global greetings—in our **Videos & Media** section or directly on 'The Ismaili' official YouTube channel.";
  } else if (
    q.includes("location") ||
    q.includes("address") ||
    q.includes("where") ||
    q.includes("houston")
  ) {
    return "The Ismaili Center Houston is located in the vibrant Montrose district of Houston, Texas, situated on an 11-acre green campus along Montrose Boulevard and Allen Parkway near Buffalo Bayou Park.";
  } else {
    return "Welcome to the Ismaili Center Houston guide! The center is open to the public on **Tuesdays, Thursdays, Saturdays, and Sundays** (Building: 10:00 AM – 4:00 PM; Gardens: 8:00 AM – 4:00 PM). Admission is free. You can book architectural tours at https://ismailicenter.org/tour-booking/ or ask about schedules, architecture, and visitor amenities.";
  }
}

// API Routes
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/api/health", (_req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" &&
    process.env.GEMINI_API_KEY.trim().length > 0
  );
  res.json({
    status: "ok",
    hasGeminiKey: hasKey,
  });
});

app.post("/api/chat", async (req, res) => {
  const { message, userKey } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "A message string is required." });
    return;
  }

  const rawKey = userKey || process.env.GEMINI_API_KEY;
  const isUsableKey = Boolean(
    rawKey &&
    rawKey !== "MY_GEMINI_API_KEY" &&
    rawKey.trim().length > 10
  );

  if (isUsableKey && rawKey) {
    try {
      const client = new GoogleGenAI({
        apiKey: rawKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = `You are the courteous, professional, and knowledgeable AI Ambassador for the Ismaili Center Houston.
Domain Knowledge:
1. ALWAYS inform users of visitor opening hours when asked about visiting, opening times, or tours:
   - Building visitor hours: Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM.
   - Gardens hours: 8:00 AM to 4:00 PM on visiting days.
   - Admission is completely free.
2. For tour bookings, refer users to the official booking portal: https://ismailicenter.org/tour-booking/
3. Schedule reference:
   - Bandagi: 4:00 AM - 5:00 AM daily
   - Morning Dua: 5:00 AM - 5:30 AM daily
   - Evening Prayer: 7:30 PM on Fridays; 7:00 PM on Monday-Thursday, Saturday, and Sunday.
   - IMPORTANT: The prayer hall is reserved for congregational worship. All civic, garden, and exhibition spaces are open to the general public.
   - NEVER give theological commentary, subjective interpretations, or ritual descriptions of Islamic prayers. ONLY provide scheduled times if asked.
4. Architecture & Design:
   - Architect: Farshid Moussavi (Farshid Moussavi Architecture), her first cultural building in the US.
   - Landscape: 11 acres of Persian-inspired gardens designed by Nelson Byrd Woltz.
   - Located on Montrose Boulevard in Houston, Texas.
   - Key features: Triangular stone verandahs, Islamic geometric lattices, environmental sustainability, civic auditorium, and exhibition spaces.
5. Tone: Dignified, warm, clear, and professional. Format with clean markdown (bullet points, bold highlights, URLs). Keep answers concise and helpful.`;

      // 2.5-second snappy timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API request timed out")), 2500)
      );

      const generatePromise = client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      const replyText = response?.text || getKnowledgeBaseResponse(message);
      res.json({ reply: replyText, source: "gemini" });
      return;
    } catch (err: any) {
      console.warn("Gemini API call failed, using fallback knowledge base:", err?.message || err);
      const fallbackReply = getKnowledgeBaseResponse(message);
      res.json({ reply: fallbackReply, source: "offline-fallback" });
      return;
    }
  }

  // Fallback to offline knowledge base
  const offlineReply = getKnowledgeBaseResponse(message);
  res.json({ reply: offlineReply, source: "offline" });
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
