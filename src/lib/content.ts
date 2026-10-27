import { eq, asc, desc } from 'drizzle-orm';
import { getDb, hasDb, ensureDatabaseBootstrapped } from './db/client';
import { siteSettings, pageContent, events, galleryItems, members, projects } from './db/schema';

// ── Fallback Defaults ──
export const DEFAULT_SETTINGS = {
  accentColor: 'blue',
  systemStatus: 'GUILD SYSTEMS: NORMAL · DAVPS SRESHTHA VIHAR',
  bannerActive: false,
  bannerText: 'Annual Inter-House Cyber & AI Debate Registrations Open',
  bannerLink: '/gallery',
};

export const DEFAULT_PAGE_CONTENT: Record<string, Record<string, string>> = {
  home: {
    heroBadge: 'DAV PUBLIC SCHOOL, SRESHTHA VIHAR · CYBER GUILD',
    heroTitle: 'Securing bytes.<br/>Questioning algorithms.<br/><span class="text-blue-600 dark:text-blue-400 font-black">Building digital defenses.</span>',
    heroLead: 'Techno Sreshtha is DAV Public School’s flagship student cybersecurity and ethical AI guild. We deconstruct real-world security vulnerabilities, interrogate algorithmic bias, and build open safety tools for students.',
    statMembers: '50+',
    statLabs: '12+',
    statDrives: '06',
    track1Title: 'Cybersecurity Fundamentals',
    track1Desc: 'Hands-on mastery over real-world network mechanics, credential protection, password hygiene, safe web browsing, and recognizing modern phishing vectors.',
    track2Title: 'Responsible & Ethical AI',
    track2Desc: 'Moving beyond blindly copying AI outputs. We audit models for data bias, learn safe prompt engineering without privacy leakage, and preserve academic integrity.',
  },
  about: {
    title: 'Defending our campus in the age of synthetic media.',
    lead: 'Techno Sreshtha was established at DAV Public School, Sreshtha Vihar, with a singular mission: to transition students from passive, vulnerable consumers of technology into proactive, ethical digital citizens.',
    pillar1Title: 'RADICAL PRACTICALITY',
    pillar1Desc: 'No theoretical lectures without live demonstration. Every concept—from SQL injection to prompt injection—is demonstrated in safe, isolated labs.',
    pillar2Title: 'PEER-TO-PEER MENTORSHIP',
    pillar2Desc: 'Senior guild members mentor junior students, breaking down intimidating technical jargon into accessible, engaging modules.',
    pillar3Title: 'ETHICS FIRST',
    pillar3Desc: 'Offensive cybersecurity knowledge is only taught with rigorous ethical boundaries. We train white-hat defenders, not rogue actors.',
  },
  'ethical-ai': {
    title: 'The Ethical AI Charter',
    lead: 'Artificial intelligence tools are transforming how students research and code. Techno Sreshtha establishes clear, uncompromising guidelines for responsible, transparent, and rigorous AI adoption at DAV Public School.',
  },
  projects: {
    title: 'Practical Security Engineered by Students',
    lead: 'From Scratch games for primary classes to client-side cryptographic calculators and AI prompt audit tools—here is what our members build.',
  },
  contact: {
    title: 'Initiate Contact with the Guild',
    lead: 'Interested in joining the cybersecurity guild, proposing a workshop, or inviting our student ambassadors for an awareness session? Send a dispatch directly to our coordinators.',
    email: 'cyberclub@davsv.edu',
    location: 'DAV Public School, Sreshtha Vihar · Computer Laboratory 2 & Auditorium Wing',
    schedule: 'Biweekly Club Assembly: Mondays & Thursdays · After School (2:00 PM – 3:30 PM)',
  },
};

export const DEFAULT_EVENTS = [
  {
    id: 1,
    title: 'Web Exploits & Safe Coding',
    track: 'WORKSHOP',
    status: 'INTERACTIVE',
    eventDate: 'Biweekly Thursday',
    location: 'Computer Lab 2',
    description: 'Deconstructing common client-side injection attacks, browser cookies, and how HTTPS encrypts student communications.',
    registrationLink: '',
    sortOrder: 1,
  },
  {
    id: 2,
    title: 'Annual Cyber & AI Quiz Debate',
    track: 'COMPETITION',
    status: 'COMPETITION',
    eventDate: 'Annual Tournament',
    location: 'Auditorium Wing',
    description: 'Inter-house challenge testing ethical AI principles, cyber laws, digital forensics puzzles, and poster making.',
    registrationLink: '',
    sortOrder: 2,
  },
  {
    id: 3,
    title: 'Campus-Wide Cyber Hygiene Drive',
    track: 'COMMUNITY',
    status: 'COMMUNITY',
    eventDate: 'Annual Campaign',
    location: 'Campus-Wide',
    description: 'Student ambassadors sharing live demonstrations on setting up 2FA, spotting scam WhatsApp links, and securing home Wi-Fi.',
    registrationLink: '',
    sortOrder: 3,
  },
];

export const DEFAULT_GALLERY = [
  {
    yearCategory: '2025–2026',
    albumTitle: 'Inter-House Cyber & AI Quiz Debates',
    caption: 'Class 5 Preliminary Round',
    imageUrl: '/assets/2025/2025quiz (1).webp',
    sortOrder: 1,
  },
  {
    yearCategory: '2025–2026',
    albumTitle: 'Inter-House Cyber & AI Quiz Debates',
    caption: 'Class 6 Debate Quarter-Finals',
    imageUrl: '/assets/2025/2025quiz (2).jpeg',
    sortOrder: 2,
  },
  {
    yearCategory: '2025–2026',
    albumTitle: 'Inter-House Cyber & AI Quiz Debates',
    caption: 'Auditorium Championship Finals',
    imageUrl: '/assets/2025/2025quiz (3).webp',
    sortOrder: 3,
  },
  {
    yearCategory: '2025–2026',
    albumTitle: 'AI Literacy & Safe Prompting Labs',
    caption: 'Lab Setup & Initial Briefing',
    imageUrl: '/assets/2025/2025workshop (1).jpeg',
    sortOrder: 4,
  },
  {
    yearCategory: '2025–2026',
    albumTitle: 'AI Literacy & Safe Prompting Labs',
    caption: 'Live Demonstration on Bias Detection',
    imageUrl: '/assets/2025/2025workshop (2).webp',
    sortOrder: 5,
  },
  {
    yearCategory: '2025–2026',
    albumTitle: 'AI Literacy & Safe Prompting Labs',
    caption: 'Peer Code Reviews & Verification',
    imageUrl: '/assets/2025/2025workshop (3).webp',
    sortOrder: 6,
  },
  {
    yearCategory: '2024–2025',
    albumTitle: 'Foundational Cybersecurity Challenges',
    caption: 'Junior Category Puzzles',
    imageUrl: '/assets/2024/2024quiz (1).webp',
    sortOrder: 7,
  },
  {
    yearCategory: '2024–2025',
    albumTitle: 'Password Safety & Two-Factor Hygiene',
    caption: 'Keynote & Slides',
    imageUrl: '/assets/2024/2024workshop (1).webp',
    sortOrder: 8,
  },
  {
    yearCategory: '2024–2025',
    albumTitle: 'Pledge for Digital Safety',
    caption: 'Poster Exhibit',
    imageUrl: '/assets/2024/2024awareness (1).webp',
    sortOrder: 9,
  },
];

export const DEFAULT_MEMBERS = [
  { name: 'Mr. Ashok Goel', role: 'Faculty Advisor · Technical Infrastructure', category: 'FACULTY', imageUrl: '/assets/teachers/Ashok Goel Sir.webp', sortOrder: 1 },
  { name: 'Mrs. Meena Gulati', role: 'Senior Computer Faculty · Curriculum Lead', category: 'FACULTY', imageUrl: '/assets/teachers/Meena Gulati Maam.webp', sortOrder: 2 },
  { name: 'Mrs. Parerna Sudan', role: 'Cyber Safety Mentor · Student Outreach', category: 'FACULTY', imageUrl: '/assets/teachers/Parerana Sudan Maam.webp', sortOrder: 3 },
  { name: 'Ms. Ranjana Verma', role: 'Faculty Mentor · Competitions Lead', category: 'FACULTY', imageUrl: '/assets/teachers/Ranjana Verma Maam.webp', sortOrder: 4 },
  { name: 'Ms. Renu Mittal', role: 'Computer Faculty · AI Ethics Coordinator', category: 'FACULTY', imageUrl: '/assets/teachers/Renu Mittal Maam.webp', sortOrder: 5 },
  { name: 'Mrs. Sangeeta Kapoor', role: 'Senior Faculty · Student Guidance', category: 'FACULTY', imageUrl: '/assets/teachers/Sangeeta Kapoor Maam.webp', sortOrder: 6 },
  { name: 'Ms. Srishti', role: 'Technical Mentor · Digital Literacy', category: 'FACULTY', imageUrl: '/assets/teachers/Srishti Maam.webp', sortOrder: 7 },
  { name: 'Aradhya Thakur', role: 'Core Lead · Technical Projects', category: 'CORE_STUDENT', imageUrl: '/assets/students/Aradhya Thakur.webp', sortOrder: 8 },
  { name: 'Rishika Kanojia', role: 'Core Member · Cyber Awareness', category: 'CORE_STUDENT', imageUrl: '/assets/students/Rishika Kanojia.webp', sortOrder: 9 },
  { name: 'Simra Naaz', role: 'Core Member · Ethical AI Outreach', category: 'CORE_STUDENT', imageUrl: '/assets/students/Simra Naaz.webp', sortOrder: 10 },
  { name: 'Ayushi Sharma', role: 'Core Member · Debate & Quizzes', category: 'CORE_STUDENT', imageUrl: '/assets/students/Ayushi Sharma.webp', sortOrder: 11 },
  { name: 'Vanya Saini', role: 'Core Member · Student Engagement', category: 'CORE_STUDENT', imageUrl: '/assets/students/Vanya Saini.webp', sortOrder: 12 },
];

export const DEFAULT_PROJECTS = [
  {
    title: 'CyberGuard: The Phishing Maze',
    categoryTag: 'SCRATCH / GAMIFIED LEARNING',
    track: 'JUNIOR WING (CLASSES 4–6)',
    description: 'An interactive puzzle adventure where students navigate a corporate network, spot suspect email headers, and neutralize ransomware bots before the timer expires.',
    status: 'ACTIVE DEMO',
    linkUrl: 'https://scratch.mit.edu',
    sortOrder: 1,
  },
  {
    title: 'Client-Side Password Entropy Engine',
    categoryTag: 'CRYPTOGRAPHY / WEB APP',
    track: 'ALL GRADES',
    description: 'Pure client-side password entropy evaluator. Computes bits of unpredictability, models brute-force cluster crack times, and flags dictionary vulnerabilities without network transmission.',
    status: 'LIVE ON HOMEPAGE',
    linkUrl: '/#entropy-lab',
    sortOrder: 2,
  },
  {
    title: 'The AI Disclosure Generator',
    categoryTag: 'ETHICAL AI / ACADEMIC INTEGRITY',
    track: 'MIDDLE & SENIOR WING',
    description: 'A structured form generator helping students format transparent citations and disclosures when using AI models for school projects.',
    status: 'SPECIFICATION RELEASED',
    linkUrl: '/ethical-ai',
    sortOrder: 3,
  },
  {
    title: 'Social Footprint Audit Guide',
    categoryTag: 'PRIVACY / DEFENSIVE HYGIENE',
    track: 'COMMUNITY CAMPAIGN',
    description: 'A checklist protocol designed by DAV students to audit camera permissions, location metadata, and public exposure on social media apps.',
    status: 'PDF CHECKLIST',
    linkUrl: '/chatbot',
    sortOrder: 4,
  },
];

// ── Live Query Functions ──

export async function getSiteSettings() {
  const db = getDb();
  if (!db) return DEFAULT_SETTINGS;

  try {
    await ensureDatabaseBootstrapped();
    const rows = await db.select().from(siteSettings);
    const map = new Map(rows.map((r) => [r.key, r.value]));

    return {
      accentColor: map.get('accent_color') || DEFAULT_SETTINGS.accentColor,
      systemStatus: map.get('system_status') || DEFAULT_SETTINGS.systemStatus,
      bannerActive: map.get('banner_active') === 'true',
      bannerText: map.get('banner_text') || DEFAULT_SETTINGS.bannerText,
      bannerLink: map.get('banner_link') || DEFAULT_SETTINGS.bannerLink,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function getPageContent(pageSlug: string): Promise<Record<string, string>> {
  const fallback = DEFAULT_PAGE_CONTENT[pageSlug] || {};
  const db = getDb();
  if (!db) return fallback;

  try {
    await ensureDatabaseBootstrapped();
    const rows = await db.select().from(pageContent).where(eq(pageContent.pageSlug, pageSlug));
    if (rows.length === 0) return fallback;

    const merged = { ...fallback };
    for (const r of rows) {
      merged[r.sectionKey] = r.content;
    }
    return merged;
  } catch {
    return fallback;
  }
}

export async function getEvents() {
  const db = getDb();
  if (!db) return DEFAULT_EVENTS;

  try {
    await ensureDatabaseBootstrapped();
    const rows = await db.select().from(events).orderBy(asc(events.sortOrder));
    return rows.length > 0 ? rows : DEFAULT_EVENTS;
  } catch {
    return DEFAULT_EVENTS;
  }
}

export async function getGallery() {
  const db = getDb();
  if (!db) return DEFAULT_GALLERY;

  try {
    await ensureDatabaseBootstrapped();
    const rows = await db.select().from(galleryItems).orderBy(asc(galleryItems.sortOrder));
    return rows.length > 0 ? rows : DEFAULT_GALLERY;
  } catch {
    return DEFAULT_GALLERY;
  }
}

export async function getMembers() {
  const db = getDb();
  if (!db) return DEFAULT_MEMBERS;

  try {
    await ensureDatabaseBootstrapped();
    const rows = await db.select().from(members).orderBy(asc(members.sortOrder));
    return rows.length > 0 ? rows : DEFAULT_MEMBERS;
  } catch {
    return DEFAULT_MEMBERS;
  }
}

export async function getProjects() {
  const db = getDb();
  if (!db) return DEFAULT_PROJECTS;

  try {
    await ensureDatabaseBootstrapped();
    const rows = await db.select().from(projects).orderBy(asc(projects.sortOrder));
    return rows.length > 0 ? rows : DEFAULT_PROJECTS;
  } catch {
    return DEFAULT_PROJECTS;
  }
}
