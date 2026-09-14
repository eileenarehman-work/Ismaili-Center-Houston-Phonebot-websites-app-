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
    q.includes("when") ||
    q.includes("admission") ||
    q.includes("ticket") ||
    q.includes("cost") ||
    q.includes("free")
  ) {
    return "The Ismaili Center Houston is open to the public on **Tuesdays, Thursdays, Saturdays, and Sundays**:\n\n- **Building & Exhibition Spaces**: 10:00 AM – 4:00 PM Central Time\n- **11-Acre Public Gardens**: 8:00 AM – 4:00 PM Central Time\n- **Admission**: Completely free of charge!\n\nGuided 45-minute architectural tours are available during visiting days. To guarantee your spot, please reserve online in advance at [ismailicenter.org/tour-booking](https://ismailicenter.org/tour-booking/).";
  } else if (
    q.includes("schedule") ||
    q.includes("time") ||
    q.includes("prayer") ||
    q.includes("dua") ||
    q.includes("bandagi") ||
    q.includes("jamatkhana")
  ) {
    return "The congregational Jamatkhana schedule (**all times in US Central Time**):\n\n- **Bandagi (Quiet Meditation)**: 4:00 AM – 5:00 AM daily\n- **Morning Dua**: 5:00 AM – 5:30 AM daily\n- **Evening Prayer**: 7:00 PM (Monday–Thursday, Saturday & Sunday); **7:30 PM on Fridays**\n\n*Visitor Note*: The Jamatkhana prayer hall is designated for community worship, while the civic auditorium, exhibition halls, shaded verandas, and 11 acres of gardens are open to all visitors on open days.";
  } else if (
    q.includes("architect") ||
    q.includes("farshid") ||
    q.includes("moussavi") ||
    q.includes("building") ||
    q.includes("garden") ||
    q.includes("design") ||
    q.includes("landscape") ||
    q.includes("verandah") ||
    q.includes("veranda")
  ) {
    return "### Architecture & Landscape Design\n\n- **Architect**: Renowned Iranian-British architect **Farshid Moussavi OBE, RA** (Farshid Moussavi Architecture). This marks her first cultural building in the United States.\n- **Landscape Architects**: **Nelson Byrd Woltz** Landscape Architects, who designed the 11-acre Persian-inspired *charbagh* (four-fold) gardens.\n- **Architectural Highlights**:\n  - **Triangular Shaded Verandahs**: Expansive shaded outdoor porticos that catch Gulf Coast breezes and provide natural thermal cooling against Houston heat.\n  - **Geometric Ceramic Screens**: Modern interpretations of Islamic *mashrabiya* and *jali* latticework that filter daylight into soft geometric patterns.\n  - **Native Texas Ecology**: Over 100 species of drought-tolerant native Texas plants and trees integrated with peaceful water reflection basins.\n  - **Octagonal Motif**: The official emblem features an 8-fold interlaced knot rosette, symbolizing harmony, cosmic order, and infinite unity.";
  } else if (q.includes("aga khan") || q.includes("hazar imam")) {
    return "### His Highness the Aga Khan\n\nHis Highness the Aga Khan is the **49th hereditary Imam (spiritual leader)** of the world's Shia Imami Ismaili Muslims, tracing direct lineage to Prophet Muhammad (peace be upon him and his family) through his daughter Fatima and cousin/son-in-law Ali, the first Shia Imam.\n\nHe is the founder and chairman of the **Aga Khan Development Network (AKDN)**, one of the world's largest private international development organizations dedicated to improving quality of life in Africa, Asia, and the Middle East regardless of faith or origin. He commissioned the Ismaili Center Houston as a gift to the city to serve as an ambassadorial bridge of understanding, pluralism, and intellectual exchange.";
  } else if (
    q.includes("faith") ||
    q.includes("ismaili") ||
    q.includes("who are") ||
    q.includes("shia") ||
    q.includes("tradition") ||
    q.includes("islam")
  ) {
    return "### The Ismaili Shia Muslim Community\n\nThe Ismailis are a global, culturally diverse community living in over 30 countries. As Shia Muslims, they affirm the fundamental Islamic shahada (declaration of faith) and follow the spiritual guidance of their hereditary Imam.\n\nCore tenets of the Ismaili tradition include:\n- **Intellectual Inquiry & Education**: Fostering reason, science, and lifelong learning.\n- **Ethics of Compassion & Service**: A strong commitment to voluntary service (*seva*) and philanthropy.\n- **Pluralism**: Respecting and celebrating diversity as a source of strength.\n- **Stewardship**: Responsibility for environmental conservation and human dignity.";
  } else if (
    q.includes("location") ||
    q.includes("address") ||
    q.includes("where") ||
    q.includes("parking") ||
    q.includes("directions") ||
    q.includes("montrose")
  ) {
    return "### Location & Visitor Access\n\n- **Address**: Montrose Boulevard & Allen Parkway, Houston, Texas 77019\n- **Neighborhood**: Located in the cultural heart of Houston's Montrose district, directly adjacent to Buffalo Bayou Park.\n- **Parking**: On-site complimentary visitor parking is available during public visiting hours.\n- **Accessibility**: All public spaces, elevators, verandas, and gardens are fully ADA accessible.\n- **Bicycle Access**: Direct trail connections to the Buffalo Bayou Park hike and bike trail network with dedicated bike racks.";
  } else if (
    q.includes("dress") ||
    q.includes("etiquette") ||
    q.includes("wear") ||
    q.includes("shoes")
  ) {
    return "### Visitor Etiquette & Guidelines\n\n- **Attire**: Modest, comfortable casual clothing is recommended. Shoulders and knees should be covered when entering indoor community spaces.\n- **Footwear**: Comfortable walking shoes are advised to enjoy the 11 acres of landscaped gardens. Shoes may need to be removed in designated contemplative spaces.\n- **Photography**: Non-commercial photography is welcomed in outdoor gardens, courtyards, and public exhibition verandas. Tripods and commercial shoots require prior approval.";
  } else if (
    q.includes("difference") ||
    q.includes("jamatkhana vs") ||
    q.includes("distinction")
  ) {
    return "### Distinction: Jamatkhana vs. Ismaili Center\n\n- **The Jamatkhana**: A consecrated spiritual space reserved for members of the Shia Ismaili Muslim community for daily prayers, meditation, and religious observances.\n- **The Ismaili Center**: An ambassadorial civic institution open to the entire public. It includes cultural exhibition galleries, a civic auditorium, seminar rooms, and 11 acres of public gardens built to foster interfaith understanding, pluralism, and intellectual dialogue.";
  } else if (
    q.includes("non-muslim") ||
    q.includes("anyone") ||
    q.includes("everyone") ||
    q.includes("can i visit")
  ) {
    return "### Yes! All Visitors Are Warmly Welcome\n\nThe Ismaili Center Houston is expressly designed as an open civic institution for the entire Houston and global community. People of all faiths, traditions, and backgrounds are invited to explore the building and gardens during public visiting hours on **Tuesdays, Thursdays, Saturdays, and Sundays** (10:00 AM – 4:00 PM CT; Gardens open at 8:00 AM CT). Admission and guided tours are completely free of charge!";
  } else if (
    q.includes("other centers") ||
    q.includes("worldwide") ||
    q.includes("london") ||
    q.includes("toronto") ||
    q.includes("lisbon") ||
    q.includes("dubai") ||
    q.includes("dushanbe") ||
    q.includes("vancouver")
  ) {
    return "### The Global Network of Ismaili Centers\n\nThe Houston Center is the first in the United States and the seventh in the world:\n\n1. **London, UK** (1985)\n2. **Vancouver, Canada** (1985)\n3. **Lisbon, Portugal** (1998)\n4. **Dubai, UAE** (2008)\n5. **Dushanbe, Tajikistan** (2009)\n6. **Toronto, Canada** (2014, with the Aga Khan Museum & Park)\n7. **Houston, Texas, USA** (opened 2025, designed by Farshid Moussavi)";
  } else if (
    q.includes("ada") ||
    q.includes("wheelchair") ||
    q.includes("stroller") ||
    q.includes("family") ||
    q.includes("kids") ||
    q.includes("children")
  ) {
    return "### Accessibility & Families\n\n- **100% ADA Compliant**: Paved, accessible garden pathways, elevator access to all civic levels, and accessible family restrooms.\n- **Families & Children**: Strollers are welcome in public galleries and on garden paths. The serene water features and native Texas landscapes offer an engaging, welcoming experience for visitors of all ages.";
  } else if (
    q.includes("greeting") ||
    q.includes("ya ali madad") ||
    q.includes("mawla ali madad")
  ) {
    return "### Traditional Ismaili Greetings\n\n- **\"Ya Ali Madad\"** (May Ali assist you) is the traditional greeting among Shia Ismaili Muslims.\n- The traditional reply is **\"Mawla Ali Madad\"** (May the Lord Ali assist you).\n- Visitors are always greeted with a warm **\"Welcome to the Ismaili Center!\"**";
  } else if (
    q.includes("video") ||
    q.includes("youtube") ||
    q.includes("watch") ||
    q.includes("media")
  ) {
    return "You can explore official documentaries, architectural tours, and historic ceremonies in our **Videos & Media** tab, or directly on [The Ismaili Official YouTube Channel](https://www.youtube.com/@TheIsmaili).";
  } else {
    return "Welcome to the **Ismaili Center Houston Guide**! The center is open to the public on **Tuesdays, Thursdays, Saturdays, and Sundays** from **10:00 AM to 4:00 PM Central Time** (Gardens from 8:00 AM to 4:00 PM). Admission is completely free.\n\nI can assist you with:\n- Booking guided architectural tours ([ismailicenter.org/tour-booking](https://ismailicenter.org/tour-booking/))\n- Today's Jamatkhana prayer times in Central Time\n- Architect Farshid Moussavi's design and the 11-acre gardens\n- Directions, parking, and visitor etiquette\n- The history and ethics of the Ismaili Shia Muslim community";
  }
}

// Spoken telephone response generator (smooth connected sentences, no symbols, concise American telephone tone)
function getPhonebotKnowledgeResponse(query: string): string {
  const q = (query || "").toLowerCase();
  if (
    q.includes("tour") ||
    q.includes("book") ||
    q.includes("visit") ||
    q.includes("open") ||
    q.includes("hour") ||
    q.includes("when") ||
    q.includes("admission") ||
    q.includes("ticket") ||
    q.includes("cost") ||
    q.includes("free")
  ) {
    return "The Ismaili Center Houston welcomes all visitors on Tuesdays, Thursdays, Saturdays, and Sundays. Our building and cultural exhibitions are open from 10:00 AM to 4:00 PM Central Time, and the eleven-acre gardens open early at 8:00 AM. Admission is completely free of charge, and you can reserve complimentary guided architectural tours online at ismailicenter dot org.";
  } else if (
    q.includes("schedule") ||
    q.includes("time") ||
    q.includes("prayer") ||
    q.includes("dua") ||
    q.includes("bandagi") ||
    q.includes("jamatkhana")
  ) {
    return "All Jamatkhana prayer times are in US Central Time. Daily silent meditation is from 4:00 to 5:00 AM, followed by morning prayer from 5:00 to 5:30 AM. Evening prayer takes place at 7:00 PM Monday through Thursday, Saturday, and Sunday, and at 7:30 PM on Fridays. While the prayer hall is dedicated to congregational worship, our civic galleries and gardens are open to everyone on visitor days.";
  } else if (
    q.includes("architect") ||
    q.includes("farshid") ||
    q.includes("moussavi") ||
    q.includes("building") ||
    q.includes("garden") ||
    q.includes("design") ||
    q.includes("landscape") ||
    q.includes("verandah") ||
    q.includes("veranda")
  ) {
    return "The Center was designed by renowned architect Farshid Moussavi, featuring shaded verandas that catch natural Gulf Coast breezes and ceramic geometric screens that filter Texas sunlight. The eleven acres of surrounding Persian-inspired gardens were created by Nelson Byrd Woltz, complete with reflection basins and native Texas flora.";
  } else if (q.includes("aga khan") || q.includes("hazar imam")) {
    return "His Highness the Aga Khan is the forty-ninth hereditary Imam of Shia Ismaili Muslims and founder of the Aga Khan Development Network. He commissioned the Ismaili Center Houston as a gift to the city to serve as an ambassadorial bridge of understanding, education, and pluralism.";
  } else if (
    q.includes("location") ||
    q.includes("address") ||
    q.includes("where") ||
    q.includes("parking") ||
    q.includes("directions") ||
    q.includes("montrose")
  ) {
    return "We are located in Houston's Montrose district at Montrose Boulevard and Allen Parkway, right by Buffalo Bayou Park. Complimentary on-site visitor parking is provided during our public visiting hours, and we offer direct pedestrian access to local trails.";
  } else if (
    q.includes("dress") ||
    q.includes("etiquette") ||
    q.includes("wear") ||
    q.includes("shoes")
  ) {
    return "We recommend modest, casual attire with shoulders and knees covered when entering indoor spaces. Comfortable walking shoes are ideal for exploring our eleven-acre gardens, and personal photography is warmly welcomed in all outdoor areas.";
  } else if (
    q.includes("non-muslim") ||
    q.includes("anyone") ||
    q.includes("everyone") ||
    q.includes("can i visit")
  ) {
    return "Yes, absolutely! The Ismaili Center Houston was created as an open civic institution for the entire community. People of all faiths and backgrounds are warmly invited to explore our building and gardens on Tuesdays, Thursdays, Saturdays, and Sundays with completely free admission.";
  } else if (
    q.includes("faith") ||
    q.includes("ismaili") ||
    q.includes("who are") ||
    q.includes("shia") ||
    q.includes("tradition") ||
    q.includes("islam")
  ) {
    return "The Ismailis belong to the Shia branch of Islam and live in over thirty countries worldwide. Our community places a strong emphasis on education, intellectual inquiry, voluntary service, and fostering mutual respect across diverse cultures.";
  } else {
    return "Hello and welcome to the Ismaili Center Houston! Our building and gardens are open to the public on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM Central Time, and admission is completely free. How can I assist you with your visit or questions today?";
  }
}

// Support both root and GitHub repository sub-path prefixes seamlessly
app.use((req, _res, next) => {
  if (req.url.startsWith('/Ismaili-Center-Houston-Phonebot-websites-app-')) {
    req.url = req.url.slice('/Ismaili-Center-Houston-Phonebot-websites-app-'.length) || '/';
  }
  next();
});

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
  const { message, history, userKey, mode } = req.body;
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "A message string is required." });
    return;
  }

  const isPhoneMode = mode === "phone";

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

      const systemInstruction = isPhoneMode
        ? `You are the official AI Phonebot Ambassador answering telephone calls for the Ismaili Center Houston.
You are speaking live to a caller over an audio telephone line.
Key Telephone Guidelines:
1. Spoken telephone manner: Warm, welcoming, professional, engaging, and articulate with a clear natural American tone.
2. Connected sentences: Speak strictly in smooth, connected, complete sentences.
3. ABSOLUTELY FORBIDDEN: NEVER use bullet points, numbered lists, asterisks (*), hashtags (#), markdown bold/italics, dashes as lists, brackets, or raw website URLs.
4. Concise and complete: Keep your response relatively short for a phone conversation (typically 2 to 4 smooth sentences), but be sure to cover all essential, accurate facts.
5. Central Time: Whenever discussing visitor hours or Jamatkhana prayer schedules, always explicitly state that times are in US Central Time.
6. Public days and admission: Reassure callers that the building and gardens are free and open to everyone on Tuesdays, Thursdays, Saturdays, and Sundays (Building: 10:00 AM to 4:00 PM CT; Gardens: 8:00 AM to 4:00 PM CT).
7. Website reference: If referring to tour booking or additional details, say "on our official website at ismailicenter dot org".`
        : `You are the courteous, erudite, and highly articulate AI Ambassador for the Ismaili Center Houston.
Your role is to assist visitors, scholars, architecture enthusiasts, and community members with rich, accurate, and welcoming answers.

Domain Knowledge & Strict Guidelines:
1. Timezone & Central Time:
   - All timings for the Ismaili Center Houston are strictly in US Central Time (America/Chicago - CDT during summer, CST during winter).
   - If asked about time or prayer schedules, always clarify that times are in Central Time (CT).

2. Visitor Hours & Admission:
   - Building & Exhibitions: Open to all visitors on Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM Central Time.
   - 11-Acre Gardens: Open from 8:00 AM to 4:00 PM Central Time on visitor days (Tue, Thu, Sat, Sun).
   - Admission is completely FREE of charge.
   - Guided Tours: Recommend reserving 45-minute guided architectural tours at the official portal: https://ismailicenter.org/tour-booking/

3. Congregational Jamatkhana Prayer Times (in Central Time):
   - Bandagi (Early Morning Meditation): 4:00 AM – 5:00 AM daily
   - Morning Dua: 5:00 AM – 5:30 AM daily
   - Evening Prayer: 7:00 PM (Monday–Thursday, Saturday, Sunday); 7:30 PM on Fridays
   - SACRED RESPECT: The prayer hall is reserved exclusively for congregational worship. All civic, garden, theater, social, and exhibition spaces are open to the general public.
   - NEVER give theological speculation, subjective interpretations, or ritual debate of Islamic prayers. State scheduled times respectfully and factually.

4. Architecture, Gardens & Sustainability:
   - Building Architect: Farshid Moussavi OBE, RA (Farshid Moussavi Architecture), her first cultural commission in North America.
   - Landscape Architects: Nelson Byrd Woltz (11 acres of Persian-inspired charbagh gardens, reflection pools, native Texas plant canopy).
   - Key Features: Shaded triangular stone verandahs catching natural Gulf breezes, intricate ceramic geometric latticework (modern reinterpretations of mashrabiya/jali screens), high environmental sustainability, civic auditorium, black-box theater, and education wings.
   - Location: Situated in Montrose at the corner of Montrose Boulevard and Allen Parkway in Houston, TX 77019, adjacent to Buffalo Bayou Park.

5. Leadership & Community Context:
   - His Highness the Aga Khan is the 49th hereditary Imam of Shia Imami Ismaili Muslims and founder of the Aga Khan Development Network (AKDN).
   - Ismaili tradition centers on intellect, faith, pluralism, education, and voluntary civic service.
   - The Center serves as an ambassadorial building to build bridges of understanding across Houston and the United States.

6. Response Quality & Demeanor:
   - Respond with warmth, intellectual clarity, and precision.
   - Format answers cleanly with markdown headings, structured bullet points, and helpful links where appropriate.
   - Answer both short questions directly and complex architectural or cultural questions with deep, authoritative insight.`;

      // Build contents supporting multi-turn conversation history (must start with role: "user")
      const contents: any[] = [];
      if (Array.isArray(history) && history.length > 0) {
        let foundFirstUser = false;
        for (const item of history.slice(-8)) {
          if (item?.parts?.[0]?.text) {
            const role = item.role === "assistant" || item.role === "model" ? "model" : "user";
            if (!foundFirstUser && role !== "user") {
              continue; // Drop initial assistant greetings so first item is guaranteed to be "user"
            }
            foundFirstUser = true;
            contents.push({
              role,
              parts: [{ text: String(item.parts[0].text) }],
            });
          }
        }
      }
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });

      // 10-second timeout promise for thoughtful generation
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API request timed out")), 10000)
      );

      const generatePromise = client.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: isPhoneMode ? 0.4 : 0.65,
        },
      });

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      let replyText = response?.text || (isPhoneMode ? getPhonebotKnowledgeResponse(message) : getKnowledgeBaseResponse(message));
      
      // Additional sanitization for phone mode to guarantee no symbols or markdown slip through
      if (isPhoneMode && replyText) {
        replyText = replyText
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/###?\s*/g, "")
          .replace(/[-*•]\s+/g, "")
          .replace(/https?:\/\/[^\s]+/g, "at ismailicenter dot org")
          .replace(/[*#_~`\[\]]/g, "")
          .trim();
      }

      res.json({ reply: replyText, source: "gemini" });
      return;
    } catch (err: any) {
      console.warn("Gemini API call error, falling back to rich knowledge base:", err?.message || err);
      const fallbackReply = isPhoneMode
        ? getPhonebotKnowledgeResponse(message)
        : getKnowledgeBaseResponse(message);
      res.json({ reply: fallbackReply, source: "offline-fallback" });
      return;
    }
  }

  // Fallback to offline knowledge base
  const offlineReply = isPhoneMode
    ? getPhonebotKnowledgeResponse(message)
    : getKnowledgeBaseResponse(message);
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
