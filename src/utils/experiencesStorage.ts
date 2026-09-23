import { CenterExperience } from '../types.ts';
import { logLifespanEvent } from './userHistoryStorage.ts';

const EXPERIENCES_KEY = 'ich_center_experiences_v1';

export const OFFICIAL_TOUR_URL = 'https://the.ismaili/us/en/spaces/ismaili-center-houston/tours';

export const DEFAULT_EXPERIENCES: CenterExperience[] = [
  {
    id: 'exp-arch-tour',
    title: 'Guided Architectural Tour',
    category: 'tour',
    shortDescription: 'In-depth docent walkthrough of Farshid Moussavi’s iconic Montrose building and shaded verandahs.',
    fullDescription: 'Explore the vision, geometry, and craftsmanship behind the first purpose-built Ismaili Center in the United States. Docents guide visitors through the civic atrium, natural lighting pergolas, and ceramic tile exterior that honors Islamic design within Houston’s urban fabric.',
    schedule: 'Tuesdays, Thursdays, Saturdays & Sundays • 10:30 AM & 2:00 PM CT',
    duration: '45 minutes',
    admission: 'Free / Complimentary (Advance registration required)',
    officialBookingUrl: 'https://the.ismaili/us/en/spaces/ismaili-center-houston/tours',
    badge: 'Official Docent Led',
    highlights: [
      'Farshid Moussavi visionary design',
      'Triangular shaded ceramic tile verandas',
      'Pluralistic civic atrium & gathering spaces',
      'Passive daylighting and natural ventilation'
    ],
    isActive: true,
    updatedAt: 'Recently Updated',
  },
  {
    id: 'exp-gardens',
    title: '11-Acre Persian Charbagh Gardens',
    category: 'garden',
    shortDescription: 'Reflective walking paths, geometric water basins, and lush native Texan flora.',
    fullDescription: 'Designed by renowned landscape architect Nelson Byrd Woltz, the eleven-acre gardens reinterpret the classic Persian quadrilateral garden (Charbagh) for the Gulf Coast climate. Shaded by live oaks and redbuds, the gardens offer tranquil water cascades and contemplative seating.',
    schedule: 'Public Days: Tue, Thu, Sat, Sun • 8:00 AM – 4:00 PM CT',
    duration: 'Self-guided (30–60 minutes)',
    admission: 'Free & open to all visitors',
    officialBookingUrl: 'https://the.ismaili/us/en/spaces/ismaili-center-houston/tours',
    badge: 'Outdoor Oasis',
    highlights: [
      'Fourfold Persian garden geometry (Charbagh)',
      'Drought-tolerant native Texan plants',
      'Reflective geometric pools and fountains',
      'Direct connection to Buffalo Bayou greenway'
    ],
    isActive: true,
    updatedAt: 'Recently Updated',
  },
  {
    id: 'exp-contemplation',
    title: 'Jamatkhana & Contemplative Spaces',
    category: 'spiritual',
    shortDescription: 'Serene spiritual sanctuary with intricate geometric stone lattices and ambient illumination.',
    fullDescription: 'A sanctuary dedicated to prayer, contemplation, and peaceful reflection. Non-congregational visitors are welcomed during public opening hours to admire the acoustic refinement and spiritual architecture that fosters peace and interfaith respect.',
    schedule: 'Designated viewing during public civic hours (10:00 AM – 4:00 PM CT)',
    duration: '20–30 minutes',
    admission: 'Free',
    officialBookingUrl: 'https://the.ismaili/us/en/spaces/ismaili-center-houston/tours',
    badge: 'Sacred Architecture',
    highlights: [
      'Precision acoustic design for devotional chant',
      'Intricate geometric acoustic timber & stone',
      'Ambient natural and recessed illumination',
      'Quietude and interfaith reverence'
    ],
    isActive: true,
    updatedAt: 'Recently Updated',
  },
  {
    id: 'exp-cultural-gallery',
    title: 'Cultural Exhibitions & Pluralism Gallery',
    category: 'exhibition',
    shortDescription: 'Rotating exhibits celebrating Islamic arts, world heritage, and the ethics of pluralism.',
    fullDescription: 'Featuring curated historical photography, models of Ismaili Centers across London, Lisbon, Dubai, and Toronto, and rotating contemporary visual arts. Highlights how Islamic societies throughout history embraced diversity as a catalyst for innovation.',
    schedule: 'Tuesdays, Thursdays, Saturdays & Sundays • 10:00 AM – 4:00 PM CT',
    duration: 'Self-guided (30–45 minutes)',
    admission: 'Free',
    officialBookingUrl: 'https://the.ismaili/us/en/spaces/ismaili-center-houston/tours',
    badge: 'Exhibition',
    highlights: [
      'Global Ismaili architecture archives',
      'Contemporary Muslim calligraphy and textiles',
      'Pluralism historical timelines & media stations',
      'Curated books and educational materials'
    ],
    isActive: true,
    updatedAt: 'Recently Updated',
  },
  {
    id: 'exp-civic-dialogue',
    title: 'Civic Dialogue & Academic Symposia',
    category: 'cultural',
    shortDescription: 'Public lectures, musical performances, and interfaith summits in the Center’s auditorium.',
    fullDescription: 'Built as an ambassadorial platform for Houston and the world, hosting world-class scholars, civic leaders, musical ensembles, and international cultural dialogues to foster shared humanity and bridge cultural divides.',
    schedule: 'Special Evening & Weekend Programs (Announced on Official Site)',
    duration: '60–90 minutes',
    admission: 'Complimentary registration on official site',
    officialBookingUrl: 'https://the.ismaili/us/en/spaces/ismaili-center-houston/tours',
    badge: 'Civic Programs',
    highlights: [
      'State-of-the-art civic auditorium',
      'Collaborations with Houston universities & museums',
      'Interfaith & humanitarian summits',
      'Open to the general public'
    ],
    isActive: true,
    updatedAt: 'Recently Updated',
  }
];

export function getCenterExperiences(): CenterExperience[] {
  if (typeof window === 'undefined') return DEFAULT_EXPERIENCES;
  try {
    const raw = localStorage.getItem(EXPERIENCES_KEY);
    if (!raw) {
      localStorage.setItem(EXPERIENCES_KEY, JSON.stringify(DEFAULT_EXPERIENCES));
      return DEFAULT_EXPERIENCES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(EXPERIENCES_KEY, JSON.stringify(DEFAULT_EXPERIENCES));
      return DEFAULT_EXPERIENCES;
    }
    // Normalize booking URLs to the official tours address if pointing to legacy roots
    const migrated = parsed.map((item: CenterExperience) => {
      if (!item.officialBookingUrl || item.officialBookingUrl.includes('ismaili-center-houston') || item.officialBookingUrl.includes('ismailicenter.org')) {
        return { ...item, officialBookingUrl: OFFICIAL_TOUR_URL };
      }
      return item;
    });
    return migrated;
  } catch {
    return DEFAULT_EXPERIENCES;
  }
}

export function saveCenterExperience(updatedExp: CenterExperience): CenterExperience[] {
  const current = getCenterExperiences();
  const exists = current.some(e => e.id === updatedExp.id);
  let updatedList: CenterExperience[];

  if (exists) {
    updatedList = current.map(e => e.id === updatedExp.id ? { ...updatedExp, updatedAt: 'Just now' } : e);
  } else {
    updatedList = [...current, { ...updatedExp, updatedAt: 'Just now' }];
  }

  try {
    localStorage.setItem(EXPERIENCES_KEY, JSON.stringify(updatedList));
  } catch {}

  logLifespanEvent({
    type: 'admin_action',
    title: `Experience Updated: ${updatedExp.title}`,
    summary: `Administrator updated "${updatedExp.title}" (Schedule: ${updatedExp.schedule}, Status: ${updatedExp.isActive ? 'Active' : 'Hidden'}).`,
    userIdentifier: 'Administrator',
    status: 'completed',
    details: {
      experienceId: updatedExp.id,
      title: updatedExp.title,
      category: updatedExp.category,
      schedule: updatedExp.schedule,
    }
  });

  return updatedList;
}

export function addCenterExperience(newExpData: Omit<CenterExperience, 'id' | 'updatedAt'>): CenterExperience[] {
  const current = getCenterExperiences();
  const id = `exp-custom-${Date.now()}`;
  const newExp: CenterExperience = {
    ...newExpData,
    id,
    updatedAt: 'Just added',
  };

  const updatedList = [...current, newExp];
  try {
    localStorage.setItem(EXPERIENCES_KEY, JSON.stringify(updatedList));
  } catch {}

  logLifespanEvent({
    type: 'admin_action',
    title: `New Experience Created: ${newExp.title}`,
    summary: `Administrator added new public experience "${newExp.title}" (${newExp.category}).`,
    userIdentifier: 'Administrator',
    status: 'completed',
    details: {
      experienceId: newExp.id,
      title: newExp.title,
    }
  });

  return updatedList;
}

export function deleteCenterExperience(id: string): CenterExperience[] {
  const current = getCenterExperiences();
  const target = current.find(e => e.id === id);
  const updatedList = current.filter(e => e.id !== id);

  try {
    localStorage.setItem(EXPERIENCES_KEY, JSON.stringify(updatedList));
  } catch {}

  if (target) {
    logLifespanEvent({
      type: 'admin_action',
      title: `Experience Removed: ${target.title}`,
      summary: `Administrator removed experience "${target.title}" from public view.`,
      userIdentifier: 'Administrator',
      status: 'completed',
    });
  }

  return updatedList;
}

export function toggleExperienceActive(id: string): CenterExperience[] {
  const current = getCenterExperiences();
  const updatedList = current.map(e => {
    if (e.id === id) {
      const nextState = !e.isActive;
      logLifespanEvent({
        type: 'admin_action',
        title: `Experience Status Changed: ${e.title}`,
        summary: `Administrator set "${e.title}" to ${nextState ? 'Active' : 'Inactive (Hidden)'}.`,
        userIdentifier: 'Administrator',
        status: 'completed',
      });
      return { ...e, isActive: nextState, updatedAt: 'Just now' };
    }
    return e;
  });

  try {
    localStorage.setItem(EXPERIENCES_KEY, JSON.stringify(updatedList));
  } catch {}

  return updatedList;
}

export function resetExperiencesToDefault(): CenterExperience[] {
  try {
    localStorage.setItem(EXPERIENCES_KEY, JSON.stringify(DEFAULT_EXPERIENCES));
  } catch {}

  logLifespanEvent({
    type: 'admin_action',
    title: 'Experiences Restored to Default',
    summary: 'Administrator reset the Center experiences directory to official defaults.',
    userIdentifier: 'Administrator',
    status: 'completed',
  });

  return DEFAULT_EXPERIENCES;
}
