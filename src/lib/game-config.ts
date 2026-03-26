export const CONNECTION_TYPES = [
  { id: "major", label: "Your Major", emoji: "🎓", color: "#3B82F6" },
  { id: "adjacent", label: "Adjacent Fields", emoji: "🔬", color: "#10B981" },
  { id: "different", label: "Different Colleges", emoji: "🌍", color: "#F59E0B" },
  { id: "alumni", label: "Alumni/Professionals", emoji: "💼", color: "#8B5CF6" },
] as const;

export type ConnectionType = (typeof CONNECTION_TYPES)[number]["id"];

export interface Persona {
  id: string;
  name: string;
  major: string;
  goal: string;
  bestConnection: string;
  bestConnectionLabel: string;
  why: string;
  rates: Record<ConnectionType, number>;
}

export const PERSONAS: Persona[] = [
  {
    id: "maya",
    name: "Maya",
    major: "Data Science",
    goal: "looking for a project team",
    bestConnection: "different",
    bestConnectionLabel: "Different Colleges",
    why: "Needs domain partners, not more data people",
    rates: { major: 0.3, adjacent: 0.6, different: 0.65, alumni: 0.25 },
  },
  {
    id: "jordan",
    name: "Jordan",
    major: "Computer Science",
    goal: "looking for career opportunities",
    bestConnection: "alumni",
    bestConnectionLabel: "Alumni/Professionals",
    why: "Alumni provide job referrals and industry access",
    rates: { major: 0.35, adjacent: 0.55, different: 0.4, alumni: 0.7 },
  },
  {
    id: "riley",
    name: "Riley",
    major: "Business Analytics",
    goal: "prepping for case competitions",
    bestConnection: "different",
    bestConnectionLabel: "Different Colleges",
    why: "Diverse thinking strengthens case analysis",
    rates: { major: 0.4, adjacent: 0.6, different: 0.65, alumni: 0.3 },
  },
  {
    id: "sam",
    name: "Sam",
    major: "Mechanical Engineering",
    goal: "pursuing research",
    bestConnection: "alumni",
    bestConnectionLabel: "Alumni/Professionals",
    why: "Research access comes through vertical connections",
    rates: { major: 0.35, adjacent: 0.45, different: 0.3, alumni: 0.65 },
  },
  {
    id: "alex",
    name: "Alex",
    major: "CS + Design",
    goal: "building an indie game",
    bestConnection: "adjacent",
    bestConnectionLabel: "Adjacent Fields",
    why: "Games need creative collaborators from related fields",
    rates: { major: 0.3, adjacent: 0.6, different: 0.5, alumni: 0.4 },
  },
  {
    id: "taylor",
    name: "Taylor",
    major: "Business",
    goal: "building community",
    bestConnection: "alumni",
    bestConnectionLabel: "Alumni/Professionals",
    why: "Community building needs bridge connectors",
    rates: { major: 0.35, adjacent: 0.55, different: 0.65, alumni: 0.7 },
  },
];

export const ROUNDS_COUNT = 3;
export const ATTEMPTS_PER_ROUND = 4;
export const TOTAL_ATTEMPTS = ROUNDS_COUNT * ATTEMPTS_PER_ROUND;
export const DASHBOARD_CODE = "bandit2026";

export function rollSuccess(rate: number): boolean {
  return Math.random() < rate;
}

export function getPersonaById(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function getRandomPersona(): Persona {
  return PERSONAS[Math.floor(Math.random() * PERSONAS.length)];
}
