export interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
  yearsOfExperience: number;
  skills: string[];
  targetLocations: string[];
  workMode: "Remote" | "Hybrid" | "On-site" | "Any";
  desiredSalary: string;
  linkedinConnected: boolean;
  indeedConnected: boolean;
  resumeSummary: string;
}

export interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  platform: "LinkedIn" | "Indeed";
  location: string;
  salaryRange: string;
  postedTimeAgo: string;
  applicantCount: number;
  atsFitScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  status: "discovered" | "tailoring" | "applied" | "rejected" | "interview" | "skipped" | "dismissed";
  rejectionReason?: string;
  dismissalReason?: string;
  dismissedAt?: string;
  appliedTimestamp?: string;
  appliedDate?: string;
  easyApplyUrl: string;
  tailoredSummarySnippet?: string;
}

export interface QueryIteration {
  iteration: number;
  query: string;
  linkedinQuery: string;
  indeedQuery: string;
  timestamp: string;
  reasoning: string;
  rejectionTriggersAnalyzed: number;
  hypothesis: string;
  targetKeywordBoosts: string[];
  pacingRule: string;
  conversionRate: number;
  totalApplied: number;
  interviewCallbacks: number;
}

export interface RejectionLog {
  id: string;
  jobId: string;
  company: string;
  role: string;
  platform: "LinkedIn" | "Indeed";
  date: string;
  category: "OVERSATURATED_POOL" | "ATS_KEYWORD_DEFICIT" | "EXPERIENCE_MISMATCH" | "LOCATION_RESTRICTION" | "GENERIC_AUTOMATION_CUTOFF";
  snippet: string;
  confidence: number;
  recommendedAdjustment: string;
  detectedAtIteration: number;
}

export interface AgentExecutionStep {
  id: string;
  timestamp: string;
  phase: "QUERY_SYNTHESIS" | "JOB_HARVEST" | "ATS_EVALUATION" | "DOSSIER_TAILORING" | "AUTO_APPLY" | "REJECTION_INGEST" | "FEEDBACK_OPTIMIZATION" | "COSMOS_TELEMETRY";
  title: string;
  detail: string;
  platform?: "LinkedIn" | "Indeed" | "Azure" | "CosmosDB";
  status: "idle" | "running" | "success" | "warning" | "error";
  metadata?: Record<string, any>;
}

export interface CosmosDocument {
  id: string;
  partitionKey: string;
  type: "agent_run" | "application" | "rejection_pattern" | "query_iteration" | "telemetry_log" | "background_dismissal" | "candidate_profile_backup";
  timestamp: string;
  data: Record<string, any>;
  _rid?: string;
  _ts?: number;
  ruCost?: number;
}

export type StretchTier = "MOONSHOT" | "STEP_UP" | "CORE_TARGET";

export interface StretchRoleAnalysis {
  id: string;
  jobId?: string;
  title: string;
  company: string;
  platform: "LinkedIn" | "Indeed";
  salaryRange: string;
  tier: StretchTier;
  atsFitScore: number;
  estimatedProbability: number;
  experienceRequired: number;
  experienceDelta: number;
  missingSkills: string[];
  matchedSkills: string[];
  aspirationalAppeal: string;
  skillGapsExplanation: string;
  compensatoryStrengths: string[];
  bridgeStrategy: string;
  customPitchAngle: string;
  recommendedApplicationPriority: "HIGH" | "BALANCED" | "EXPERIMENTAL";
}
