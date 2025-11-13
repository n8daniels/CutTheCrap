// Core Bill Types
export interface Bill {
  id: string;
  number: string; // e.g., "H.R. 1234" or "S. 567"
  title: string;
  sponsor: string;
  status: BillStatus;
  congress: number; // e.g., 118
  chamber: Chamber;
  introducedDate: string;
  lastActionDate: string;
  summary: string;
  bigPicture: BigPicture;
  sections: BillSection[];
  votes?: VoteData;
  partisanTakes?: PartisanTakes;
  createdAt: string;
  updatedAt: string;
}

export enum BillStatus {
  INTRODUCED = 'introduced',
  IN_COMMITTEE = 'in_committee',
  PASSED_HOUSE = 'passed_house',
  PASSED_SENATE = 'passed_senate',
  PASSED_BOTH = 'passed_both',
  SENT_TO_PRESIDENT = 'sent_to_president',
  SIGNED = 'signed',
  VETOED = 'vetoed',
  BECAME_LAW = 'became_law',
  FAILED = 'failed',
}

export enum Chamber {
  HOUSE = 'house',
  SENATE = 'senate',
  BOTH = 'both',
}

// Big Picture Card
export interface BigPicture {
  summary: string; // 5th-grade summary
  soWhat: string; // Why it matters
  winners: string[]; // Who benefits
  losers: string[]; // Who loses
  sneakIndex: SneakIndex; // Hidden/high-impact riders
  overallLean: number; // -5 to +5 (left to right)
}

export interface SneakIndex {
  score: number; // 0-10, higher = more sneaky/hidden items
  highlights: string[]; // Key riders or hidden provisions
}

// Bill Sections
export interface BillSection {
  id: string;
  billId: string;
  sectionNumber: string;
  title: string;
  preview: string; // Short simplified preview
  simplifiedSummary: string; // 5th-grade explanation
  deepDive?: DeepDive;
  ideologyScore: number; // -5 to +5 (socialist to libertarian)
  politicalLean: number; // -5 to +5 (left to right)
  economicTags: EconomicTag[];
  riskNotes?: string[];
  rawText?: string;
  contentHash: string; // For caching
  order: number;
}

// Deep Dive Analysis
export interface DeepDive {
  historicalContext: string;
  geopoliticalImplications: string;
  economicFraming: string;
  precedentRisks: string[];
  ideologicalFingerprints: string[];
  expertAnalysis?: string;
}

// Economic and Political Tags
export enum EconomicTag {
  CAPITALIST = 'capitalist',
  CORPORATIST = 'corporatist',
  SOCIALIST = 'socialist',
  LIBERTARIAN = 'libertarian',
  AUTHORITARIAN = 'authoritarian',
  KEYNESIAN = 'keynesian',
  FREE_MARKET = 'free_market',
  REGULATED = 'regulated',
  REDISTRIBUTIVE = 'redistributive',
}

// Vote Data
export interface VoteData {
  house?: ChamberVote;
  senate?: ChamberVote;
}

export interface ChamberVote {
  date: string;
  result: VoteResult;
  yeas: number;
  nays: number;
  present: number;
  notVoting: number;
  breakdown: VoteBreakdown;
}

export enum VoteResult {
  PASSED = 'passed',
  FAILED = 'failed',
  TIE = 'tie',
}

export interface VoteBreakdown {
  democratic: PartyVotes;
  republican: PartyVotes;
  independent: PartyVotes;
}

export interface PartyVotes {
  yeas: number;
  nays: number;
  present: number;
  notVoting: number;
}

// Partisan Takes (Verified Authors)
export interface PartisanTakes {
  democratic?: PartisanPerspective;
  republican?: PartisanPerspective;
}

export interface PartisanPerspective {
  authorId: string;
  authorName: string;
  authorTitle: string;
  perspective: string; // Main perspective text
  keyPoints: string[];
  concerns?: string[];
  supports?: string[];
  createdAt: string;
  verified: boolean;
}

// Verified Author
export interface VerifiedAuthor {
  id: string;
  name: string;
  email: string;
  party: Party;
  title: string;
  bio?: string;
  verified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

export enum Party {
  DEMOCRATIC = 'democratic',
  REPUBLICAN = 'republican',
  INDEPENDENT = 'independent',
}

// LLM Analysis Request/Response
export interface LLMAnalysisRequest {
  content: string;
  analysisType: AnalysisType;
  context?: Record<string, unknown>;
}

export interface LLMAnalysisResponse {
  analysis: string;
  metadata?: Record<string, unknown>;
  model: string;
  timestamp: string;
}

export enum AnalysisType {
  SUMMARY = 'summary',
  DEEP_DIVE = 'deep_dive',
  IDEOLOGY = 'ideology',
  LEAN = 'lean',
  ECONOMIC_TAGS = 'economic_tags',
}

// Caching
export interface CachedContent {
  id: string;
  contentHash: string;
  content: string;
  analysisType: AnalysisType;
  result: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  timestamp: string;
}

// Authentication
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  party?: Party;
}

export enum UserRole {
  ADMIN = 'admin',
  VERIFIED_AUTHOR = 'verified_author',
  USER = 'user',
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}
