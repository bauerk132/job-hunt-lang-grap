import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenAI client:", e);
    }
  }
  return ai;
}

// In-Memory Cosmos DB Store with initial seeds
interface CosmosDoc {
  id: string;
  partitionKey: string;
  type: "agent_run" | "application" | "rejection_pattern" | "query_iteration" | "telemetry_log" | "background_dismissal" | "candidate_profile_backup";
  timestamp: string;
  data: Record<string, any>;
  _rid?: string;
  _ts?: number;
  ruCost?: number;
}

const cosmosDbDocuments: CosmosDoc[] = [
  {
    id: "run-az-0914-01",
    partitionKey: "usr_cloud_eng",
    type: "agent_run",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    data: {
      agentVersion: "langchain-v0.3.18-azure",
      cycleIndex: 1,
      targetPlatforms: ["LinkedIn", "Indeed"],
      rawQuery: "Senior React Developer",
      totalJobsDiscovered: 42,
      appliedCount: 15,
      rejectionCount: 12,
      callbackCount: 1,
      averageAtsScore: 71.4,
      status: "COMPLETED",
      host: "Azure Container Apps (Standard_D2s_v3, East US 2)",
    },
    _rid: "cosmos_rid_01",
    _ts: Math.floor(Date.now() / 1000) - 86400,
    ruCost: 3.42,
  },
  {
    id: "iter-q-01",
    partitionKey: "usr_cloud_eng",
    type: "query_iteration",
    timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
    data: {
      iteration: 1,
      originalQuery: "Senior React Developer",
      evolvedQuery: '("Full Stack Engineer" OR "Senior Frontend Engineer") AND ("TypeScript" OR "React") NOT "WordPress"',
      reasoning: "Rejection analysis indicated 64% of rejections on LinkedIn were due to heavy legacy stack requirements and agency listings. Boolean filter narrows to product companies with modern TS stack.",
      targetPlatforms: ["LinkedIn", "Indeed"],
      atsKeywordBoost: ["TypeScript", "Distributed Systems", "Cloud Run", "CI/CD"],
    },
    _rid: "cosmos_rid_02",
    _ts: Math.floor(Date.now() / 1000) - 79200,
    ruCost: 4.18,
  },
  {
    id: "rej-pat-01",
    partitionKey: "usr_cloud_eng",
    type: "rejection_pattern",
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    data: {
      company: "FinTech Scaleup Inc",
      platform: "LinkedIn Easy Apply",
      role: "Staff UI Architect",
      primaryFactor: "Oversaturated Candidate Pool (> 450 applicants in 3 hours)",
      secondaryFactor: "Missing explicit FinTech security compliance keyword in resume (SOC2 / PCI-DSS)",
      sentiment: "automated_templated_rejection",
      recommendedAdjustment: "Apply within first 60 minutes of posting using LinkedIn webhook filter; inject PCI-DSS/Auth compliance bullet into tailored resume.",
    },
    _rid: "cosmos_rid_03",
    _ts: Math.floor(Date.now() / 1000) - 64800,
    ruCost: 2.85,
  },
  {
    id: "prof_bkp_init_seed",
    partitionKey: "alex.mercer.dev@gmail.com",
    type: "candidate_profile_backup",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    data: {
      candidateName: "Alex Mercer",
      email: "alex.mercer.dev@gmail.com",
      role: "Senior Full-Stack & Cloud Systems Engineer",
      yearsOfExperience: 6,
      skills: ["React", "TypeScript", "Node.js", "Python", "LangChain", "Azure Cosmos DB", "Azure Container Apps", "Docker", "Tailwind CSS", "GraphQL"],
      targetLocations: ["Remote (US)", "New York, NY", "San Francisco, CA"],
      workMode: "remote_preferred",
      desiredSalary: "$165,000 - $190,000",
      backupTimestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      triggerSource: "SCHEDULED_AUTOMATION",
      version: "v2.4-snapshot",
      systemRecoveryReady: true,
      activePlatforms: { linkedin: true, indeed: true }
    },
    _rid: "cosmos_rid_04",
    _ts: Math.floor(Date.now() / 1000) - 900,
    ruCost: 3.12,
  },
];

// Health Check API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    framework: "LangChain Autonomous Agent",
    hosting: "Azure Container Apps & Cosmos DB",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Cosmos DB Documents API
app.get("/api/cosmos/documents", (req, res) => {
  const type = req.query.type as string;
  if (type) {
    return res.json(cosmosDbDocuments.filter((d) => d.type === type));
  }
  res.json(cosmosDbDocuments);
});

// Cosmos DB SQL Query Simulation API
app.post("/api/cosmos/query", (req, res) => {
  const { query, partitionKey } = req.body;
  const qLower = (query || "").toLowerCase();

  let results = [...cosmosDbDocuments];

  if (partitionKey && partitionKey !== "all") {
    results = results.filter((d) => d.partitionKey === partitionKey);
  }

  if (qLower.includes("where c.type = 'rejection_pattern'") || qLower.includes("type = 'rejection_pattern'")) {
    results = results.filter((d) => d.type === "rejection_pattern");
  } else if (qLower.includes("where c.type = 'query_iteration'") || qLower.includes("type = 'query_iteration'")) {
    results = results.filter((d) => d.type === "query_iteration");
  } else if (qLower.includes("where c.type = 'agent_run'") || qLower.includes("type = 'agent_run'")) {
    results = results.filter((d) => d.type === "agent_run");
  } else if (qLower.includes("where c.type = 'application'") || qLower.includes("type = 'application'")) {
    results = results.filter((d) => d.type === "application");
  } else if (qLower.includes("where c.type = 'candidate_profile_backup'") || qLower.includes("type = 'candidate_profile_backup'")) {
    results = results.filter((d) => d.type === "candidate_profile_backup");
  } else if (qLower.includes("where c.type = 'background_dismissal'") || qLower.includes("type = 'background_dismissal'")) {
    results = results.filter((d) => d.type === "background_dismissal");
  }

  const calculatedRu = (2.4 + results.length * 0.45 + Math.random() * 0.5).toFixed(2);

  res.json({
    query: query || "SELECT * FROM c",
    count: results.length,
    ruCharge: parseFloat(calculatedRu),
    executionTimeMs: Math.floor(12 + Math.random() * 18),
    documents: results,
  });
});

// Save new document to Cosmos DB store
app.post("/api/cosmos/log", (req, res) => {
  const docData = req.body;
  const newDoc: CosmosDoc = {
    id: docData.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    partitionKey: docData.partitionKey || "usr_cloud_eng",
    type: docData.type || "telemetry_log",
    timestamp: new Date().toISOString(),
    data: docData.data || {},
    _rid: `rid_${Math.random().toString(36).substring(2, 9)}`,
    _ts: Math.floor(Date.now() / 1000),
    ruCost: parseFloat((2.1 + Math.random() * 1.5).toFixed(2)),
  };

  cosmosDbDocuments.unshift(newDoc);
  res.json({ success: true, document: newDoc });
});

// Gemini AI Feedback Loop: Iterating Query Based On Rejections
app.post("/api/agent/iterate-query", async (req, res) => {
  const { currentQuery, rejections, candidateProfile, iterationCount } = req.body;

  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are a LangChain Autonomous Job Agent Feedback Loop Engine deployed on Azure.
Candidate Profile:
- Role: ${candidateProfile?.role || "Full Stack Software Engineer"}
- Experience: ${candidateProfile?.yearsOfExperience || 5} years
- Key Skills: ${candidateProfile?.skills?.join(", ") || "TypeScript, React, Node.js, Python, Azure, GraphQL"}
- Desired Salary: ${candidateProfile?.desiredSalary || "$145,000 - $175,000"}
- Work Mode: ${candidateProfile?.workMode || "Remote / Hybrid"}

Current Search Query: "${currentQuery || "Senior React Engineer"}"
Current Iteration: ${iterationCount || 1}

Recent Rejection Patterns & Feedback:
${JSON.stringify(rejections || [
  { reason: "Over 500 applicants within 4 hours; position closed quickly", count: 8 },
  { reason: "Candidate lacked explicit Azure cloud architecture or distributed systems in top headline", count: 4 },
  { reason: "Position required 8+ years; ATS filter rejected under 7 years", count: 5 },
], null, 2)}

Your task:
1. Synthesize the rejection patterns to determine why the current queries fail or get rejected.
2. Generate an evolved, precision-targeted search query for LinkedIn and Indeed (using Boolean operators: AND, OR, NOT, quotes, salary/pacing heuristics).
3. Specify 3-5 ATS keywords to inject into application tailoring.
4. Provide strategic advice on timing, filters (e.g. past 24 hours, Easy Apply only, under 10 applicants).

Format strictly as JSON with this schema:
{
  "evolvedQuery": "string (boolean formatted job query)",
  "linkedinQuery": "string (optimized specifically for LinkedIn search bar with quotes and operators)",
  "indeedQuery": "string (optimized specifically for Indeed with title: and as_and: syntax)",
  "hypothesis": "string (why this new query will have higher win-rate)",
  "rejectionAnalysis": "string (concise summary of failure factors diagnosed)",
  "targetKeywordBoosts": ["keyword1", "keyword2", "keyword3"],
  "pacingRule": "string (e.g. Filter posted within < 24 hrs, apply before 10 AM EST)",
  "expectedWinRateIncrease": "string (e.g. +28% ATS pass rate)"
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Gemini query iteration error:", err);
      // Fallback to algorithmic generator below
    }
  }

  // Fallback / Deterministic generator if Gemini key is absent or errored
  const iterNum = (iterationCount || 1) + 1;
  const fallbackEvolved = [
    `("${candidateProfile?.role || "Software Engineer"}" OR "Full Stack Engineer") AND ("TypeScript" OR "Cloud") NOT "Entry" NOT "Staff"`,
    `title:("Senior Engineer" OR "Staff Engineer") ("Azure" OR "Node.js") -recruiter -intern`,
    `("${candidateProfile?.role || "Cloud Architect"}") AND ("Distributed Systems" OR "Microservices") AND ("Remote" OR "Hybrid")`,
  ][iterNum % 3];

  res.json({
    evolvedQuery: fallbackEvolved,
    linkedinQuery: `"${candidateProfile?.role || "Senior Full Stack"}" AND ("TypeScript" OR "Next.js")`,
    indeedQuery: `title:("${candidateProfile?.role || "Full Stack"}") "Remote" -contract`,
    hypothesis: "Shifting from broad title to boolean tech-stack queries reduces competition by ~55% and matches high-signal ATS filters.",
    rejectionAnalysis: "Rejection analysis diagnosed high competition ratio on generic titles and experience threshold mismatch.",
    targetKeywordBoosts: ["Distributed Architecture", "Event-Driven Systems", "CI/CD Orchestration", "TypeScript 5.x"],
    pacingRule: "Prioritize postings indexed < 12 hours ago with < 30 applicants.",
    expectedWinRateIncrease: `+${24 + (iterNum * 4)}% interview conversion`,
  });
});

// Gemini AI Rejection Pattern Analyzer
app.post("/api/agent/analyze-rejection", async (req, res) => {
  const { rejectionEmailText, jobTitle, companyName } = req.body;

  const client = getGeminiClient();
  if (client && rejectionEmailText) {
    try {
      const prompt = `You are an AI Job Search Rejection Pattern Classifier.
Analyze this rejection notice for job: "${jobTitle || "Senior Developer"}" at "${companyName || "Tech Corp"}".
Notice Content:
"""
${rejectionEmailText}
"""

Diagnose:
1. Root Category: One of ["ATS_KEYWORD_DEFICIT", "OVERSATURATED_POOL", "EXPERIENCE_MISMATCH", "LOCATION_VISA_RESTRICTION", "GENERIC_AUTOMATION_CUTOFF", "INTERVIEW_STAGE_PIVOT"]
2. Confidence score (0 to 100)
3. Specific actionable adjustment for the candidate's next query or resume.
4. Rejection sentiment: Templated vs Human-reviewed.

Output JSON:
{
  "category": "string",
  "confidence": number,
  "diagnosis": "string",
  "recommendedAction": "string",
  "sentiment": "string"
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      return res.json(JSON.parse(response.text || "{}"));
    } catch (err) {
      console.error("Gemini rejection analysis error:", err);
    }
  }

  res.json({
    category: "OVERSATURATED_POOL",
    confidence: 89,
    diagnosis: "The email uses standard high-volume templating ('We received an extraordinary volume of highly qualified applicants'). Indicates candidate applied after top 50 applicant cutoff.",
    recommendedAction: "Apply using automated LinkedIn scraper triggers within 90 minutes of listing publication.",
    sentiment: "automated_templated_rejection",
  });
});

// Start Server with Vite
async function start() {
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
    console.log(`LangChain Azure Job Agent server running on http://0.0.0.0:${PORT}`);
  });
}

start();
