/**
 * Ismaili Center Houston - Comprehensive Knowledge & Smart Assistant Engine
 * 
 * Designed to provide articulate, accurate, deeply informative answers both when
 * connected to the backend Gemini API and when hosted statically on GitHub Pages / repositories
 * with zero server dependencies or missing API keys.
 */

export interface AssistantResponse {
  reply: string;
  source: 'gemini-server' | 'gemini-client' | 'knowledge-engine';
  suggestedFollowUps?: string[];
}

interface KnowledgeTopic {
  id: string;
  keywords: string[];
  phrases: string[];
  title: string;
  generateResponse: (query: string, currentDay: string, centralTimeString: string) => { text: string; followUps: string[] };
}

// Helper to get current day of week in Houston Central Time
export function getHoustonDayAndHour(): { dayName: string; hour: number; timeStr: string } {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Chicago',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
  const dayName = parts.find((p) => p.type === 'weekday')?.value || 'Tuesday';

  // Format digital time
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const timeStr = timeFormatter.format(now);

  const hour24Formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(hour24Formatter.format(now), 10) || 12;

  return { dayName, hour, timeStr };
}

// Structured Knowledge Topics
const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  // 1. VISITOR HOURS & DAYS
  {
    id: 'hours_and_schedule',
    keywords: ['hour', 'hours', 'open', 'opening', 'close', 'closing', 'today', 'tomorrow', 'sunday', 'saturday', 'tuesday', 'thursday', 'friday', 'monday', 'wednesday', 'weekend', 'when'],
    phrases: ['what are the hours', 'when is it open', 'is it open today', 'what time does it close', 'visiting hours', 'visitor hours', 'public hours', 'open to public'],
    title: 'Visitor Hours & Days',
    generateResponse: (_query, currentDay, timeStr) => {
      const isPublicDay = ['Tuesday', 'Thursday', 'Saturday', 'Sunday'].includes(currentDay);
      return {
        text: `### Visitor & Public Hours (US Central Time)

The **Ismaili Center Houston** welcomes all members of the public on **Tuesdays, Thursdays, Saturdays, and Sundays**:

- **Building, Galleries & Verandahs**: 10:00 AM – 4:00 PM CT
- **11-Acre Landscaped Gardens**: 8:00 AM – 4:00 PM CT
- **Days Closed to Public**: Mondays, Wednesdays, and Fridays (reserved for community programs and facility care).

*Current Houston Status*: Today is **${currentDay}** (Houston Time: **${timeStr} CT**). ${
          isPublicDay 
            ? 'The Center is **open to visitors today** during standard public hours!' 
            : 'Today is a non-visiting day for the general public. You are warmly invited to visit this Tuesday, Thursday, Saturday, or Sunday.'
        }

Guided 45-minute architectural tours run throughout open days. Admission is completely free!`,
        followUps: [
          'How do I book a free tour?',
          'What is the Jamatkhana prayer schedule?',
          'Where is the parking located?',
        ],
      };
    },
  },

  // 2. TOUR BOOKING & ADMISSION
  {
    id: 'tours_and_admission',
    keywords: ['tour', 'tours', 'book', 'booking', 'reserve', 'reservation', 'ticket', 'tickets', 'cost', 'fee', 'price', 'admission', 'free', 'register'],
    phrases: ['how to book a tour', 'guided tour', 'architectural tour', 'how much does it cost', 'is it free', 'tour booking', 'reserve a spot'],
    title: 'Tour Reservations & Free Admission',
    generateResponse: () => ({
      text: `### Guided Architectural Tours & Admission

- **Admission Cost**: **100% Free** for all visitors, families, and students.
- **Tour Format**: 45-minute guided architectural walkthroughs led by knowledgeable docents.
- **What You Will Experience**:
  - The breathtaking geometric ceramic facade screens (*mashrabiya*) and triangular verandahs by architect Farshid Moussavi.
  - The 11 acres of Persian-inspired *charbagh* gardens and native Texas flora landscaped by Nelson Byrd Woltz.
  - The civic auditorium, cultural exhibition galleries, and community spaces.
- **Reservation Link**: You can reserve your free tour tickets in advance at [ismailicenter.org/tour-booking](https://ismailicenter.org/tour-booking/).
- **Walk-Ins**: Accommodated on public days (Tuesday, Thursday, Saturday, Sunday) on a space-available basis, though advance online booking is strongly encouraged.`,
      followUps: [
        'What are the visitor hours on weekends?',
        'Who designed the building?',
        'What is the dress code for visitors?',
      ],
    }),
  },

  // 3. PRAYER TIMINGS & JAMATKHANA
  {
    id: 'prayer_and_jamatkhana',
    keywords: ['prayer', 'prayers', 'dua', 'bandagi', 'meditation', 'jamatkhana', 'namaz', 'salat', 'khana', 'congregation', 'worship'],
    phrases: ['prayer times', 'prayer schedule', 'when is dua', 'bandagi time', 'evening prayer', 'morning prayer', 'jamatkhana schedule'],
    title: 'Jamatkhana Congregational Schedule',
    generateResponse: () => ({
      text: `### Jamatkhana Prayer Timings (US Central Time)

The Jamatkhana within the Ismaili Center Houston observes the following daily congregational schedule:

- **Bandagi (Early Morning Silent Meditation)**: **4:00 AM – 5:00 AM** daily CT
- **Morning Dua (Subha Jo Niyaz)**: **5:00 AM – 5:30 AM** daily CT
- **Evening Prayer (Sanjhi Dua)**:
  - **Monday through Thursday, Saturday & Sunday**: **7:00 PM** CT
  - **Fridays**: **7:30 PM** CT

*Important Distinction*:
- The **Jamatkhana Prayer Hall** is a consecrated space reserved for religious observance and contemplative worship by the Shia Ismaili Muslim community.
- The **Ismaili Center's Civic Spaces**—including the shaded verandas, 11-acre gardens, exhibition halls, and auditorium—are open to people of all backgrounds and faiths during public visiting hours.`,
      followUps: [
        'What is the difference between an Ismaili Center and a Jamatkhana?',
        'Can non-Muslims visit the building and gardens?',
        'What are the visiting hours?',
      ],
    }),
  },

  // 4. ARCHITECTURE & FARSHID MOUSSAVI
  {
    id: 'architecture_and_design',
    keywords: ['architect', 'architecture', 'farshid', 'moussavi', 'design', 'building', 'structure', 'facade', 'veranda', 'verandah', 'screen', 'ceramic', 'mashrabiya', 'stone', 'geometry', 'fma'],
    phrases: ['who designed', 'who is the architect', 'architectural design', 'farshid moussavi', 'architectural features', 'ceramic screens'],
    title: 'Architect Farshid Moussavi & Building Design',
    generateResponse: () => ({
      text: `### Architectural Vision by Farshid Moussavi

The Ismaili Center Houston is an architectural landmark designed by celebrated Iranian-British architect **Farshid Moussavi OBE, RA** (principal of Farshid Moussavi Architecture, London, and Professor in Practice at Harvard University’s Graduate School of Design).

Key Architectural Hallmarks:
- **First US Cultural Project**: This is Professor Moussavi's first permanent cultural and civic building completed in the United States.
- **Triangular Shaded Verandahs**: Sweeping exterior porticos that evoke historic Islamic iwans while specifically engineered to catch Gulf Coast breezes and provide natural thermal cooling.
- **Perforated Ceramic Facade Screens**: Contemporary reinterpretations of traditional Islamic *mashrabiya* and *jali* latticework. By day, they filter intense Texas sunlight into soft dappled geometry; by night, interior illumination transforms the building into a glowing beacon.
- **Octagonal Motif**: The Center's emblem is based on an interlaced eight-fold rosette geometry, embodying harmony, balance, cosmic order, and infinite unity.
- **Environmental Stewardship**: High-performance sustainable materials, deep shading overhangs, and natural daylighting optimize energy efficiency in Houston’s humid subtropical climate.`,
      followUps: [
        'Tell me about the 11-acre gardens',
        'Where is the Ismaili Center located in Houston?',
        'How do I book an architectural tour?',
      ],
    }),
  },

  // 5. GARDENS & LANDSCAPE (NELSON BYRD WOLTZ)
  {
    id: 'gardens_and_landscape',
    keywords: ['garden', 'gardens', 'landscape', 'landscaping', 'nelson', 'byrd', 'woltz', 'plants', 'trees', 'park', 'nature', 'acres', 'water', 'pond', 'fountain', 'reflection'],
    phrases: ['11 acre gardens', 'who designed the gardens', 'nelson byrd woltz', 'charbagh', 'persian garden', 'are the gardens open'],
    title: '11-Acre Persian-Inspired Gardens',
    generateResponse: () => ({
      text: `### The 11-Acre Gardens by Nelson Byrd Woltz

The grounds of the Ismaili Center Houston span **11 lush acres** designed by the renowned landscape architecture firm **Nelson Byrd Woltz** (led by Thomas Woltz).

Landscape Highlights:
- **Contemporary Persian Charbagh**: Rooted in the timeless Islamic four-fold garden tradition (*charbagh*), symbolizing peace, contemplation, balance, and the bounty of nature.
- **Over 100 Native & Adapted Plant Species**: Features drought-resilient Texas native live oaks, bald cypresses, fragrant flowering trees, and wildflower meadows that support local pollinators and birdlife.
- **Reflective Water Basins**: Calming, stepped water features and quiet fountains create evaporative cooling and soothing acoustic privacy from surrounding city streets.
- **Buffalo Bayou Connection**: The gardens harmonize with adjacent Buffalo Bayou Park, providing a contiguous green ecological sanctuary in the heart of Houston's Montrose district.
- **Garden Visiting Hours**: Open **8:00 AM – 4:00 PM CT** on Tuesdays, Thursdays, Saturdays, and Sundays.`,
      followUps: [
        'Are picnics or dogs allowed in the gardens?',
        'What are the building visitor hours?',
        'Can I take photos in the garden?',
      ],
    }),
  },

  // 6. HIS HIGHNESS THE AGA KHAN & AKDN
  {
    id: 'aga_khan_and_akdn',
    keywords: ['aga', 'khan', 'hazar', 'imam', 'leader', 'karim', 'prince', 'rahim', 'akdn', 'foundation', 'development', 'network', 'commissioned'],
    phrases: ['who is the aga khan', 'his highness the aga khan', 'aga khan development network', 'prince rahim', 'who commissioned the center'],
    title: 'His Highness the Aga Khan & AKDN',
    generateResponse: () => ({
      text: `### His Highness the Aga Khan

The Ismaili Center Houston was commissioned by **His Highness Prince Karim Aga Khan IV**, the **49th hereditary Imam (spiritual leader)** of the world's Shia Imami Ismaili Muslims. 

- **Lineage**: Direct descendant of Prophet Muhammad (peace be upon him and his family) through his daughter Fatima and cousin/son-in-law Hazrat Ali, the first Shia Imam.
- **Aga Khan Development Network (AKDN)**: Founder and Chairman of the AKDN, one of the world's largest private non-denominational international development agencies.
  - Operates in over 30 countries with 96,000+ personnel.
  - Spans health care, education (Aga Khan University, University of Central Asia), rural poverty alleviation, microfinance, architecture (Aga Khan Award for Architecture), and cultural restoration.
  - AKDN programs operate on the fundamental principle that development must serve all people regardless of their faith, origin, or gender.
- **Ambassadorial Vision**: His Highness envisioned the Ismaili Centers as symbolic embassies of goodwill, pluralism, intellectual exchange, and mutual understanding between the Islamic world and Western societies.`,
      followUps: [
        'What are the other Ismaili Centers around the world?',
        'What is the Ismaili Shia tradition?',
        'What is the difference between a Jamatkhana and an Ismaili Center?',
      ],
    }),
  },

  // 7. THE ISMAILI SHIA FAITH & TRADITION
  {
    id: 'ismaili_faith_and_values',
    keywords: ['faith', 'religion', 'ismaili', 'ismailis', 'shia', 'muslim', 'tradition', 'beliefs', 'principles', 'community', 'islam', 'who are'],
    phrases: ['who are the ismailis', 'what is ismaili faith', 'shia ismaili', 'ismaili beliefs', 'core values'],
    title: 'The Shia Ismaili Muslim Community',
    generateResponse: () => ({
      text: `### The Shia Ismaili Muslim Tradition

The Shia Imami Ismaili Muslims are a culturally diverse global community living across North America, Europe, Africa, the Middle East, and Asia. As Shia Muslims, they affirm the basic Islamic declaration of faith (*Shahada*) and look to the living hereditary Imam for guidance in spiritual and temporal affairs.

Core Values & Ethics:
- **Harmony of Faith and Intellect**: The Quranic injunction to reflect, reason, learn, and appreciate the wonder of creation.
- **Voluntary Service (*Seva*)**: A deep cultural tradition of giving time, professional skills, and resources to strengthen communities.
- **Pluralism**: Recognizing cultural and religious diversity not as a barrier, but as an indispensable gift and source of human enrichment.
- **Compassion & Social Justice**: Active dedication to uplifting vulnerable populations and preserving human dignity.
- **Environmental Stewardship**: Care for the natural world as a sacred trust (*Amanah*).`,
      followUps: [
        'What greetings are used in the community?',
        'Can non-Muslims attend events here?',
        'Who is the current Imam of the Ismailis?',
      ],
    }),
  },

  // 8. WORLDWIDE ISMAILI CENTERS
  {
    id: 'worldwide_centers',
    keywords: ['other', 'centers', 'worldwide', 'london', 'toronto', 'lisbon', 'dubai', 'dushanbe', 'vancouver', 'global', 'network', 'first'],
    phrases: ['how many ismaili centers', 'other ismaili centers', 'ismaili centers around the world', 'where are the other centers', 'is this the first in the us'],
    title: 'The Global Network of Ismaili Centers',
    generateResponse: () => ({
      text: `### The Global Network of Ismaili Centers

The Ismaili Center Houston is the **first purpose-built Ismaili Center in the United States**, joining an esteemed global family of seven ambassadorial Centers commissioned by His Highness the Aga Khan:

1. **London, United Kingdom** (South Kensington, opened 1985) – Designed by Casson Conder Partnership.
2. **Vancouver, Canada** (Burnaby, opened 1985) – Designed by Bruno Freschi.
3. **Lisbon, Portugal** (opened 1998) – Designed by Raj Rewal.
4. **Dubai, United Arab Emirates** (opened 2008) – Designed by Rami El-Dahan and Soheir Farid.
5. **Dushanbe, Tajikistan** (opened 2009) – Designed by Farouk Noormohamed.
6. **Toronto, Canada** (opened 2014) – Designed by Charles Correa, situated alongside the Aga Khan Museum (by Fumihiko Maki) and Aga Khan Park.
7. **Houston, Texas, USA** (opened 2025) – Designed by Farshid Moussavi with gardens by Nelson Byrd Woltz.

Each Center reflects a unique synthesis of Islamic architectural heritage and contemporary regional expression.`,
      followUps: [
        'Who designed the Houston Center?',
        'What makes the Houston Center unique?',
        'How do I book a tour?',
      ],
    }),
  },

  // 9. LOCATION, ADDRESS & PARKING
  {
    id: 'location_and_parking',
    keywords: ['location', 'address', 'where', 'parking', 'park', 'directions', 'drive', 'map', 'montrose', 'allen', 'parkway', 'airport', 'downtown'],
    phrases: ['where is it located', 'what is the address', 'is there parking', 'where to park', 'how to get there', 'parking fee', 'directions to ismaili center'],
    title: 'Address, Directions & Parking',
    generateResponse: () => ({
      text: `### Location, Directions & Parking

- **Street Address**: **Montrose Boulevard & Allen Parkway, Houston, Texas 77019**
- **Neighborhood**: Situated in Houston's historic, tree-lined **Montrose** cultural district, directly adjacent to Buffalo Bayou Park.
- **Visitor Parking**:
  - **Free On-Site Parking**: Dedicated complimentary visitor parking is provided on-site during all public visiting hours.
  - **Bicycle Racks**: Available near garden entrances, connecting to the Buffalo Bayou hike and bike trail network.
  - **Rideshare / Drop-Off**: Designated drop-off turnout along Montrose Boulevard.
- **Proximity**:
  - 5 minutes from Downtown Houston.
  - 8 minutes from the Museum District and The Menil Collection.
  - 25 minutes from George Bush Intercontinental Airport (IAH).
  - 20 minutes from William P. Hobby Airport (HOU).`,
      followUps: [
        'What are the visitor hours?',
        'Is the building ADA accessible?',
        'How do I book a tour?',
      ],
    }),
  },

  // 10. VISITOR ETIQUETTE, DRESS CODE & PHOTOGRAPHY
  {
    id: 'etiquette_and_dress',
    keywords: ['dress', 'wear', 'etiquette', 'clothes', 'clothing', 'shoes', 'photo', 'photos', 'photography', 'camera', 'modest', 'guidelines', 'rules', 'cellphone'],
    phrases: ['what should i wear', 'dress code', 'can i take photos', 'visitor guidelines', 'photography rules', 'do i need to cover my head'],
    title: 'Visitor Etiquette, Attire & Photography',
    generateResponse: () => ({
      text: `### Visitor Guidelines & Etiquette

To ensure a peaceful and dignified experience for all guests:

- **Attire / Dress Code**:
  - **Modest, Respectful Clothing**: Casual, comfortable attire is welcome. Shoulders and knees should remain covered when inside the building.
  - **Head Coverings**: Head coverings are not required for general civic tours and exhibition areas.
  - **Footwear**: Comfortable walking shoes are highly recommended for the 11 acres of garden paths. Shoes may be removed upon entering designated prayer/contemplative halls.
- **Photography & Filming**:
  - **Non-Commercial Photos**: Personal mobile phone and handheld camera photography is warmly welcomed in all outdoor gardens, courtyards, verandahs, and public exhibition foyers.
  - **Commercial Equipment**: Tripods, drones, professional lighting, and commercial photo shoots require advance written authorization.
  - **Prayer Spaces**: Photography is prohibited inside the Jamatkhana prayer hall to preserve the sanctity of worship.`,
      followUps: [
        'Are children and strollers welcome?',
        'How long are the guided tours?',
        'What are the visiting hours?',
      ],
    }),
  },

  // 11. ACCESSIBILITY & FAMILIES
  {
    id: 'accessibility_and_families',
    keywords: ['wheelchair', 'accessible', 'ada', 'handicap', 'disability', 'stroller', 'strollers', 'kids', 'children', 'family', 'families', 'baby'],
    phrases: ['is it wheelchair accessible', 'can i bring a stroller', 'is it good for kids', 'ada accessibility', 'family friendly'],
    title: 'Accessibility & Family Visits',
    generateResponse: () => ({
      text: `### Accessibility & Family Welcome

- **ADA Compliance**: The Ismaili Center Houston is **100% ADA compliant**:
  - Paved, gently sloped pathways throughout the 11-acre gardens.
  - Elevator access to all public levels, auditorium, galleries, and verandas.
  - Dedicated accessible parking spaces and accessible family restrooms.
- **Families & Strollers**:
  - Children and multi-generational families are warmly welcomed.
  - Strollers are permitted on garden paths and in all public building galleries.
  - The peaceful gardens and water features offer an enriching, multi-sensory educational experience for young visitors.`,
      followUps: [
        'What are the visitor hours on Sunday?',
        'How do I book free tour tickets?',
        'Where is the parking located?',
      ],
    }),
  },

  // 12. DIFFERENCE BETWEEN JAMATKHANA & ISMAILI CENTER
  {
    id: 'difference_jk_ic',
    keywords: ['difference', 'distinction', 'between', 'compare', 'comparison', 'jamatkhana vs', 'why is it called'],
    phrases: ['difference between jamatkhana and ismaili center', 'is this just a mosque', 'what makes it an ismaili center'],
    title: 'Difference: Jamatkhana vs. Ismaili Center',
    generateResponse: () => ({
      text: `### Understanding the Distinction: Jamatkhana vs. Ismaili Center

While every Ismaili Center houses a Jamatkhana within its complex, the two serve distinct yet complementary purposes:

1. **The Jamatkhana (Place of Gathering)**:
   - A consecrated spiritual space reserved specifically for the Shia Ismaili Muslim community for daily prayers, meditation, and religious observances.
   - Operates primarily during early morning (Bandagi/Dua) and evening congregational prayer hours.

2. **The Ismaili Center**:
   - A high-profile, ambassadorial civic institution open to society at large.
   - Encompasses cultural exhibition galleries, a civic auditorium, educational seminar facilities, and 11 acres of public gardens.
   - Built to host interfaith dialogues, academic symposia, concerts, and public tours that build bridges of mutual understanding and celebrate human pluralism.`,
      followUps: [
        'Can non-Muslims visit the building?',
        'Who is the architect?',
        'What are the visitor hours?',
      ],
    }),
  },

  // 13. CAN NON-MUSLIMS VISIT? (PUBLIC ACCESS)
  {
    id: 'public_access_non_muslims',
    keywords: ['non-muslim', 'non-muslims', 'anyone', 'everyone', 'public', 'welcome', 'allowed', 'can i visit', 'interfaith'],
    phrases: ['can non muslims visit', 'is it open to everyone', 'am i allowed to go', 'can anyone visit'],
    title: 'Public Welcome & Interfaith Inclusivity',
    generateResponse: () => ({
      text: `### Yes! All Visitors Are Warmly Welcome

**The Ismaili Center Houston is expressly designed as an open civic institution for the entire Houston and global community.**

- **Everyone is Welcome**: People of all faiths, traditions, cultural backgrounds, and walks of life are invited to explore the building and gardens.
- **Purpose**: As envisioned by His Highness the Aga Khan, the Center serves as a symbolic bridge of understanding, intellectual exchange, and pluralism.
- **Public Visiting Days**: You can visit on **Tuesdays, Thursdays, Saturdays, and Sundays** from **10:00 AM to 4:00 PM CT** (Gardens from 8:00 AM).
- **Free Admission**: Admission to the grounds and guided docent tours is completely complimentary!`,
      followUps: [
        'How do I reserve a free tour?',
        'What are the visiting hours?',
        'What is the dress code?',
      ],
    }),
  },

  // 14. GREETINGS & TRADITIONS
  {
    id: 'greetings_and_phrases',
    keywords: ['greeting', 'greetings', 'hello', 'hi', 'hey', 'ya ali madad', 'mawla ali madad', 'salwaat', 'navroz', 'eid'],
    phrases: ['ya ali madad', 'how do ismailis greet', 'what does ya ali madad mean'],
    title: 'Traditional Greetings & Customs',
    generateResponse: () => ({
      text: `### Traditional Ismaili Greetings & Expressions

- **"Ya Ali Madad" (یا علی مدد)**:
  - The traditional spiritual greeting exchanged among Shia Ismaili Muslims, translating to *"May Ali assist you"*.
  - The traditional response is **"Mawla Ali Madad"** (*"May the Lord Ali assist you"*).
- **"Salwaat"**:
  - An invocation of divine blessings upon the Prophet Muhammad and his noble family (*Ahl al-Bayt*): *"Allahumma salli 'ala Muhammadin wa aali Muhammad"*.
- **"Eid Mubarak" & "Navroz Mubarak"**:
  - Joyful festive greetings shared during Islamic festival celebrations and the Persian New Year (Navroz, celebrated on the vernal equinox, March 21st).
- **Universal Civic Welcome**: Staff, volunteers, and docents at the Ismaili Center warmly greet all guests with *"Welcome to the Ismaili Center Houston!"* or *"Good morning / afternoon!"*`,
      followUps: [
        'What are the visiting hours?',
        'Tell me about the Ismaili community',
        'Who is the architect?',
      ],
    }),
  },

  // 15. CONTACT INFO & OFFICIAL CHANNELS
  {
    id: 'contact_and_official',
    keywords: ['contact', 'phone', 'call', 'number', 'email', 'website', 'official', 'hotline', 'representative', 'operator'],
    phrases: ['phone number', 'how to contact', 'official website', 'call the center', 'information desk', 'talk to operator', 'customer service'],
    title: 'Official Contact & Communication',
    generateResponse: () => ({
      text: `### Official Contact & Information Channels

- **Dedicated Information Hotline**: **+1 (713) 522-2026**
  *(You can also use our interactive Voice Hotline tab above with live DTMF touch-tone dialpad, live audio synthesis, and live AI operator)*
- **Official Tour Booking**: [ismailicenter.org/tour-booking](https://ismailicenter.org/tour-booking/)
- **Ismaili Center Houston Portal**: [ismailicenter.org/houston](https://ismailicenter.org/houston)
- **Global Ismaili Community Portal**: [the.ismaili](https://the.ismaili)
- **Official YouTube**: [The Ismaili Channel](https://www.youtube.com/@TheIsmaili)`,
      followUps: [
        'Try the Voice Hotline tab',
        'Book an architectural tour',
        'View the Jamatkhana schedule',
      ],
    }),
  },

  // 16. ARCHITECTURAL BEACON IN MONTROSE
  {
    id: 'architectural_beacon',
    keywords: ['beacon', 'landmark', 'icon', 'montrose', 'allen', 'parkway', 'purpose-built', 'united states', 'first in us'],
    phrases: ['architectural beacon', 'beacon in montrose', 'first in the united states', 'why in montrose', 'landmark in houston'],
    title: 'An Architectural Beacon in Montrose',
    generateResponse: () => ({
      text: `### An Architectural Beacon in Montrose

The **Ismaili Center Houston** stands as the **first purpose-built Ismaili Center in the United States** and the seventh in the world:

- **A Civic & Cultural Beacon**: Located at the prominent intersection of Montrose Boulevard and Allen Parkway, adjacent to Buffalo Bayou Park.
- **Architect**: Celebrated Iranian-British architect **Farshid Moussavi OBE, RA**, creating an inspiring contemporary monument celebrating Islamic architectural heritage in a 21st-century American context.
- **Landscape**: 11 acres of public Persian *charbagh* gardens and native Texan forestry by **Nelson Byrd Woltz**.
- **Civic Purpose**: Built as an ambassadorial building to bridge cultures, foster pluralism, host academic discourse, and provide an open forum for artistic and intellectual exchange.`,
      followUps: [
        'What are the visitor hours?',
        'How do I book a tour?',
        'Tell me about the 11-acre gardens',
      ],
    }),
  },

  // 17. VISIT DURATION, DINING & AMENITIES
  {
    id: 'visit_duration_and_amenities',
    keywords: ['duration', 'long', 'time needed', 'spend', 'cafe', 'coffee', 'food', 'restaurant', 'eat', 'dining', 'restroom', 'amenities', 'gift'],
    phrases: ['how long does a visit take', 'is there a cafe', 'where to eat', 'visit duration', 'how much time do i need'],
    title: 'Visit Duration & Nearby Amenities',
    generateResponse: () => ({
      text: `### Planning Your Visit & Amenities

- **Recommended Visit Duration**:
  - **Guided Tour**: 45 minutes of in-depth architectural and civic presentation.
  - **Gardens & Grounds**: 45 to 60 minutes for a peaceful stroll among the 11 acres of reflection pools, tree canopies, and shaded verandahs.
  - **Total Recommended Time**: 1.5 to 2 hours.
- **Food & Refreshments**:
  - The Ismaili Center grounds are dedicated to cultural reflection, dialogue, and quiet contemplation. There is no commercial restaurant or café on-site.
  - However, the Center is centrally situated in Houston's renowned **Montrose neighborhood**, which features some of the city's finest cafés, bistros, and restaurants within minutes.
- **Restrooms & Accessibility**:
  - Fully accessible modern ADA restrooms and family facilities are available on-site for visitors.`,
      followUps: [
        'What are the visitor hours?',
        'Where is parking located?',
        'How do I book free tour tickets?',
      ],
    }),
  },

  // 18. GREETING & AMBASSADOR CAPABILITIES
  {
    id: 'ambassador_capabilities',
    keywords: ['who are you', 'what are you', 'what can you do', 'help', 'introduce', 'about yourself', 'operator', 'capabilities'],
    phrases: ['who are you', 'what can you do', 'help me', 'introduce yourself', 'what is this app'],
    title: 'Ismaili Center AI Ambassador Capabilities',
    generateResponse: () => ({
      text: `### Peace be upon you! I am your AI Ambassador for the Ismaili Center Houston

I am designed to assist visitors, scholars, architecture enthusiasts, and community members with authoritative, real-time knowledge about the Center:

- **Visitor Hours & Central Time Schedules**: Up-to-the-minute status on public visiting days (Tue, Thu, Sat, Sun) in Houston Central Time.
- **Guided Architectural Tours**: Guidance and links to reserve free 45-minute tours at [ismailicenter.org/tour-booking](https://ismailicenter.org/tour-booking/).
- **Farshid Moussavi Architecture**: Explanations of shaded triangular verandahs, ceramic *mashrabiya* screens, and sustainable design.
- **11-Acre Persian Gardens**: Details on Nelson Byrd Woltz's landscaping, reflection pools, and native Texas plants.
- **Jamatkhana Prayer Timings**: Daily Bandagi, Morning Dua, and Evening Prayer hours in Central Time.
- **Location, Parking & Accessibility**: Montrose Blvd & Allen Pkwy, complimentary on-site parking, ADA access, and family guidelines.
- **Interactive Telephony Hotline**: Full support for our voice hotline on +1 (713) 522-2026.

What would you like to explore today?`,
      followUps: [
        'What are the visitor hours?',
        'How do I book a tour?',
        'Who is the architect?',
        'What is tonight\'s prayer schedule?',
      ],
    }),
  },
];

/**
 * Intelligent Semantic Knowledge Engine
 * Analyzes natural language input, scores relevance across all topics,
 * and synthesizes an articulate response with context and follow-ups.
 */
export function queryKnowledgeEngine(rawQuery: string): AssistantResponse {
  const query = rawQuery.trim().toLowerCase();
  const { dayName, hour, timeStr } = getHoustonDayAndHour();

  // Score each topic
  const scoredTopics: { topic: KnowledgeTopic; score: number }[] = [];

  for (const topic of KNOWLEDGE_TOPICS) {
    let score = 0;

    // Phrase matches (highest weight)
    for (const phrase of topic.phrases) {
      if (query.includes(phrase)) {
        score += 8;
      }
    }

    // Keyword matches
    const words = query.split(/[\s,?.!;:()"-]+/).filter(Boolean);
    for (const word of words) {
      if (topic.keywords.includes(word)) {
        score += 3;
      }
    }

    if (score > 0) {
      scoredTopics.push({ topic, score });
    }
  }

  scoredTopics.sort((a, b) => b.score - a.score);

  // If a strong match is found
  if (scoredTopics.length > 0 && scoredTopics[0].score >= 3) {
    const topMatch = scoredTopics[0].topic;
    const generated = topMatch.generateResponse(query, dayName, timeStr);

    // If second topic also had high relevance, append a synthesized note
    let finalReply = generated.text;
    if (scoredTopics.length > 1 && scoredTopics[1].score >= 6) {
      const secondary = scoredTopics[1].topic.generateResponse(query, dayName, timeStr);
      finalReply += `\n\n---\n${secondary.text}`;
    }

    return {
      reply: finalReply,
      source: 'knowledge-engine',
      suggestedFollowUps: generated.followUps,
    };
  }

  // Graceful conversational fallback
  return {
    reply: `### Welcome to the Ismaili Center Houston Ambassador

The **Ismaili Center Houston** is the first purpose-built Ismaili Center in the United States, located in the Montrose district (Montrose Blvd & Allen Parkway).

**Quick Visitor Essentials (Houston Central Time)**:
- **Public Visiting Days**: Tuesdays, Thursdays, Saturdays, and Sundays (10:00 AM – 4:00 PM CT; 11-Acre Gardens open 8:00 AM – 4:00 PM CT).
- **Admission**: Free of charge for all visitors.
- **Architectural Tours**: Free 45-minute guided tours are available at [ismailicenter.org/tour-booking](https://ismailicenter.org/tour-booking/).
- **Architecture**: Designed by Farshid Moussavi OBE, RA, featuring triangular shaded verandahs and geometric ceramic screens.
- **Jamatkhana Prayer**: Bandagi (4:00–5:00 AM CT), Morning Dua (5:00–5:30 AM CT), Evening Prayer (7:00 PM Mon–Thu/Sat/Sun; 7:30 PM Fridays CT).

How may I assist you further today?`,
    source: 'knowledge-engine',
    suggestedFollowUps: [
      'What are the visitor hours?',
      'How do I book a tour?',
      'What is the prayer schedule?',
      'Who is the architect?',
    ],
  };
}

/**
 * Main Smart Assistant Coordinator
 * 1. Tries backend `/api/chat` (server-side Gemini)
 * 2. If running on static host (GitHub Pages / repo without backend) or backend is down:
 *    - Checks if `import.meta.env.VITE_GEMINI_API_KEY` is present in client environment
 *    - If present, makes direct client call
 *    - Otherwise, falls back to the smart, comprehensive `queryKnowledgeEngine`
 * 
 * Result: Guaranteed instant, high-intelligence responses in ALL environments!
 */
export async function getSmartAssistantResponse(
  message: string,
  history?: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<AssistantResponse> {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    return {
      reply: "Please enter a question about the Ismaili Center Houston.",
      source: 'knowledge-engine',
    };
  }

  // Detect whether running in a static GitHub environment (GitHub Pages or codespace)
  const isStaticGitHubHosting = typeof window !== 'undefined' && 
    (window.location.hostname.endsWith('github.io') || 
     window.location.hostname.includes('github.dev') ||
     window.location.protocol === 'file:');

  // Sanitize history so that Gemini API never receives a first turn with role "model"
  const sanitizedHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  if (Array.isArray(history) && history.length > 0) {
    let foundFirstUser = false;
    for (const item of history.slice(-8)) {
      if (item?.parts?.[0]?.text) {
        const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
        if (!foundFirstUser && role !== 'user') {
          continue; // drop initial model greeting
        }
        foundFirstUser = true;
        sanitizedHistory.push({ role, parts: [{ text: item.parts[0].text }] });
      }
    }
  }

  // 1. If NOT on static GitHub Pages, try server-side /api/chat with a fast 3.5s timeout
  if (!isStaticGitHubHosting) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Support relative base if deployed under custom subpath
      const apiEndpoint = typeof window !== 'undefined' && window.location.pathname.includes('Ismaili-Center-Houston-Phonebot-websites-app-')
        ? '/Ismaili-Center-Houston-Phonebot-websites-app-/api/chat'
        : '/api/chat';

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanMessage, history: sanitizedHistory }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data && data.reply) {
          return {
            reply: data.reply,
            source: data.source === 'gemini' ? 'gemini-server' : 'knowledge-engine',
            suggestedFollowUps: data.suggestedFollowUps || [
              'How do I book a tour?',
              'What are the visitor hours?',
              'Who designed the building?',
            ],
          };
        }
      }
    } catch (_serverErr) {
      // Unreachable server, fall through cleanly
    }
  }

  // 2. Check for client-side VITE_GEMINI_API_KEY (for static GitHub deployments with Vite env secrets)
  const clientKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (clientKey && typeof clientKey === 'string' && clientKey.trim().length > 10) {
    try {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clientKey.trim()}`;
      
      const systemInstruction = `You are the official digital ambassador for the Ismaili Center Houston. All schedules are strictly in US Central Time (America/Chicago). Public visiting hours are Tuesdays, Thursdays, Saturdays, and Sundays from 10:00 AM to 4:00 PM CT (Gardens 8:00 AM to 4:00 PM CT). Admission is free. Guided tours can be booked at https://ismailicenter.org/tour-booking/. Jamatkhana schedule: Bandagi 4:00-5:00 AM, Morning Dua 5:00-5:30 AM, Evening Prayer 7:00 PM (7:30 PM on Fridays). Architect: Farshid Moussavi. Landscape: Nelson Byrd Woltz (11 acres). Location: Montrose Blvd & Allen Parkway, Houston, TX. Provide polite, factual, beautifully formatted responses with markdown.`;

      const contents = [
        ...sanitizedHistory,
        { role: 'user', parts: [{ text: cleanMessage }] }
      ];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 900,
          }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return {
            reply: candidateText,
            source: 'gemini-client',
            suggestedFollowUps: [
              'What are the visitor hours?',
              'How do I book an architectural tour?',
              'Where is the Center located in Houston?',
            ],
          };
        }
      }
    } catch (_clientAiErr) {
      // Fall through to local knowledge engine
    }
  }

  // 3. Guaranteed instant comprehensive smart knowledge engine (works 100% on GitHub & everywhere with 0 latency)
  return queryKnowledgeEngine(cleanMessage);
}
