import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Header } from "./components/Header";
import { AgentConsole } from "./components/AgentConsole";
import { FeedbackLoopView } from "./components/FeedbackLoopView";
import { RejectionAnalyzer } from "./components/RejectionAnalyzer";
import { CosmosDbExplorer } from "./components/CosmosDbExplorer";
import { AzureDeploymentHub } from "./components/AzureDeploymentHub";
import { CandidateProfileModal } from "./components/CandidateProfileModal";
import { StretchAnalysisView } from "./components/StretchAnalysisView";
import { DailyDigestModal } from "./components/DailyDigestModal";
import { ThemeSelectorModal } from "./components/ThemeSelectorModal";
import { ThemeId, THEMES } from "./types/theme";

import {
  initialCandidateProfile,
  initialJobs,
  initialQueryIterations,
  initialRejectionLogs,
  initialStretchAnalyses,
} from "./data/mockData";
import {
  CandidateProfile,
  JobOpportunity,
  QueryIteration,
  RejectionLog,
  AgentExecutionStep,
  CosmosDocument,
  StretchRoleAnalysis,
} from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("agent");
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>(initialCandidateProfile);
  const [jobs, setJobs] = useState<JobOpportunity[]>(initialJobs);
  const [stretchAnalyses, setStretchAnalyses] = useState<StretchRoleAnalysis[]>(initialStretchAnalyses);
  const [iterations, setIterations] = useState<QueryIteration[]>(initialQueryIterations);
  const [rejections, setRejections] = useState<RejectionLog[]>(initialRejectionLogs);
  const [cosmosDocs, setCosmosDocs] = useState<CosmosDocument[]>([]);
  const [steps, setSteps] = useState<AgentExecutionStep[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isIterating, setIsIterating] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isDailyDigestOpen, setIsDailyDigestOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [activePlatforms, setActivePlatforms] = useState({ linkedin: true, indeed: true });
  const [lastBackupTimestamp, setLastBackupTimestamp] = useState<string | null>(null);
  const [totalProfileBackups, setTotalProfileBackups] = useState<number>(0);
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem("job_agent_theme_id") as ThemeId;
      if (saved && (saved === "azure" || saved === "emerald" || saved === "crimson")) {
        return saved;
      }
    } catch (_) {}
    return "azure";
  });

  useEffect(() => {
    try {
      localStorage.setItem("job_agent_theme_id", activeThemeId);
    } catch (_) {}
  }, [activeThemeId]);

  const [batchApplyEnabled, setBatchApplyEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("job_agent_batch_apply_enabled");
      return saved !== null ? saved === "true" : true;
    } catch (_) {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("job_agent_batch_apply_enabled", String(batchApplyEnabled));
    } catch (_) {}
  }, [batchApplyEnabled]);

  const currentTheme = THEMES[activeThemeId] || THEMES.azure;

  // Current active query is the latest iteration query
  const currentIterationObj = iterations[iterations.length - 1] || iterations[0];
  const currentQuery = currentIterationObj.query;

  // Load initial Cosmos DB documents from backend
  const fetchCosmosDocs = async () => {
    try {
      const res = await fetch("/api/cosmos/documents");
      if (res.ok) {
        const data = await res.json();
        setCosmosDocs(data);
        const backups = data.filter((d: CosmosDocument) => d.type === "candidate_profile_backup");
        setTotalProfileBackups(backups.length);
        if (backups.length > 0) {
          setLastBackupTimestamp(new Date(backups[0].timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
      }
    } catch (e) {
      console.warn("Could not fetch Cosmos documents from server:", e);
    }
  };

  useEffect(() => {
    fetchCosmosDocs();
  }, []);

  // Helper to append a step to terminal
  const addStep = (step: Omit<AgentExecutionStep, "id" | "timestamp">) => {
    const newStep: AgentExecutionStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setSteps((prev) => [newStep, ...prev]);
    return newStep;
  };

  // Helper to log document to server Cosmos DB
  const logToCosmos = async (type: CosmosDocument["type"], data: Record<string, any>) => {
    try {
      const res = await fetch("/api/cosmos/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partitionKey: candidateProfile.email,
          type,
          data,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.document) {
          setCosmosDocs((prev) => [json.document, ...prev]);
        }
      }
    } catch (e) {
      console.warn("Error logging to Cosmos DB:", e);
    }
  };

  // Automated & Manual Candidate Profile Backup to Cosmos DB
  const performProfileBackup = async (
    profileToBackup: CandidateProfile = candidateProfile,
    triggerSource: "SCHEDULED_AUTOMATION" | "MANUAL_TRIGGER" | "PROFILE_UPDATE" = "MANUAL_TRIGGER"
  ) => {
    const backupId = `bkp-prof-${Date.now().toString(36)}`;
    const snapshotTimestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // Step in console telemetry
    addStep({
      phase: "COSMOS_TELEMETRY",
      title: `Cosmos DB Snapshot: Candidate Profile`,
      detail: `Persisted snapshot of ${profileToBackup.name} (${profileToBackup.role}) to Cosmos DB container 'telemetry_logs' via /partitionKey (${profileToBackup.email}) [Trigger: ${triggerSource}]`,
      status: "success",
      platform: "CosmosDB",
      metadata: {
        backupId,
        skillsTracked: profileToBackup.skills.length,
        desiredSalary: profileToBackup.desiredSalary,
        workMode: profileToBackup.workMode,
      },
    });

    try {
      const res = await fetch("/api/cosmos/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: backupId,
          partitionKey: profileToBackup.email,
          type: "candidate_profile_backup",
          data: {
            candidateName: profileToBackup.name,
            email: profileToBackup.email,
            phone: profileToBackup.phone,
            role: profileToBackup.role,
            yearsOfExperience: profileToBackup.yearsOfExperience,
            skills: profileToBackup.skills,
            targetLocations: profileToBackup.targetLocations,
            workMode: profileToBackup.workMode,
            desiredSalary: profileToBackup.desiredSalary,
            resumeSummary: profileToBackup.resumeSummary,
            backupTimestamp: snapshotTimestamp,
            triggerSource,
            version: "v2.4-snapshot",
            systemRecoveryReady: true,
            activePlatforms,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.document) {
          setCosmosDocs((prev) => [json.document, ...prev]);
          setLastBackupTimestamp(formattedTime);
          setTotalProfileBackups((prev) => prev + 1);
        }
      }
    } catch (e) {
      console.warn("Could not log profile backup to Cosmos DB:", e);
    }
  };

  // Periodic Automated Backup Task: Run initial backup on boot, then repeat every 5 minutes
  useEffect(() => {
    // Perform initial backup snapshot on container spinup
    const timer = setTimeout(() => {
      performProfileBackup(candidateProfile, "SCHEDULED_AUTOMATION");
    }, 2000);

    // Periodic interval: every 5 minutes (300,000ms)
    const interval = setInterval(() => {
      performProfileBackup(candidateProfile, "SCHEDULED_AUTOMATION");
    }, 300000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Background Process: Auto-dismiss low-ATS (<60%) jobs and duplicates from primary discovery
  useEffect(() => {
    // 1. Identify jobs that need dismissal
    // We inspect existing non-dismissed jobs to track duplicates
    const seenSignatures = new Map<string, string>(); // signature -> first job id
    let hasChanges = false;
    const dismissedInfoList: { job: JobOpportunity; reason: string }[] = [];

    // First pass: register already applied / interview / existing discovered jobs
    // We iterate from oldest to newest or standard order so the first discovered instance is kept
    jobs.forEach((job) => {
      // Normalize title and company for deduplication
      const cleanTitle = job.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();
      const cleanCompany = job.company
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();
      const sig = `${cleanTitle}::${cleanCompany}`;

      if (job.status !== "dismissed") {
        if (!seenSignatures.has(sig)) {
          seenSignatures.set(sig, job.id);
        }
      }
    });

    const updatedJobs = jobs.map((job) => {
      // Only auto-dismiss jobs currently in 'discovered' queue
      if (job.status === "discovered") {
        const cleanTitle = job.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .trim();
        const cleanCompany = job.company
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .trim();
        const sig = `${cleanTitle}::${cleanCompany}`;
        const firstSeenId = seenSignatures.get(sig);

        // Low ATS condition (< 60%)
        if (job.atsFitScore < 60) {
          hasChanges = true;
          const reason = `ATS score ${job.atsFitScore}% is below minimum quality threshold (60%)`;
          dismissedInfoList.push({ job, reason });
          return {
            ...job,
            status: "dismissed" as const,
            dismissalReason: reason,
            dismissedAt: "Just now",
          };
        }

        // Duplicate condition: if another job has same signature and different id
        if (firstSeenId && firstSeenId !== job.id) {
          hasChanges = true;
          const reason = `Duplicate posting detected: matches identical role at ${job.company}`;
          dismissedInfoList.push({ job, reason });
          return {
            ...job,
            status: "dismissed" as const,
            dismissalReason: reason,
            dismissedAt: "Just now",
          };
        }
      }

      return job;
    });

    if (hasChanges) {
      setJobs(updatedJobs);

      // Log background telemetry and steps
      dismissedInfoList.forEach(({ job, reason }) => {
        addStep({
          phase: "ATS_EVALUATION",
          title: `Auto-Dismissed from Primary Queue: ${job.title}`,
          detail: `${job.company} (${job.platform}): ${reason}. Removed from primary discovery list.`,
          status: "warning",
          platform: job.platform,
        });

        logToCosmos("background_dismissal", {
          jobId: job.id,
          title: job.title,
          company: job.company,
          platform: job.platform,
          atsFitScore: job.atsFitScore,
          reason,
          timestamp: new Date().toISOString(),
          action: "AUTOMATIC_BACKGROUND_DISMISSAL",
        });
      });
    }
  }, [jobs]);

  // Execute full autonomous LangGraph agent cycle
  const handleRunCycle = async () => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      // Step 1: Query Synthesis
      addStep({
        phase: "QUERY_SYNTHESIS",
        title: "Node: query_synthesis",
        detail: `Synthesizing active boolean search string for Gen ${currentIterationObj.iteration}. Query: "${currentQuery}"`,
        status: "running",
      });
      await new Promise((r) => setTimeout(r, 600));

      addStep({
        phase: "QUERY_SYNTHESIS",
        title: "Query Confirmed with Rejection Guardrails",
        detail: `Applied negative filters NOT "Staff", NOT "WordPress". Target sites: ${
          activePlatforms.linkedin ? "LinkedIn " : ""
        }${activePlatforms.indeed ? "Indeed" : ""}`,
        status: "success",
        metadata: {
          pacing: currentIterationObj.pacingRule,
          threshold: "Min ATS 80%",
        },
      });

      // Step 2: Job Harvesting
      addStep({
        phase: "JOB_HARVEST",
        title: "Node: job_harvester (Headless Chromium)",
        detail: "Executing headless browser automation across LinkedIn Easy Apply and Indeed Instant Apply...",
        status: "running",
      });
      await new Promise((r) => setTimeout(r, 900));

      const newDiscoveredJob: JobOpportunity = {
        id: `job-${Date.now()}`,
        title: "Cloud Infrastructure & Full Stack Engineer",
        company: "Aura Cognitive Labs",
        platform: Math.random() > 0.5 ? "LinkedIn" : "Indeed",
        location: "Remote (US)",
        salaryRange: "$160k - $185k",
        postedTimeAgo: "18 mins ago",
        applicantCount: 9,
        atsFitScore: 95,
        matchedKeywords: ["TypeScript", "Azure", "Python", "Docker", "Cosmos DB"],
        missingKeywords: [],
        status: "discovered",
        easyApplyUrl: "https://www.linkedin.com/jobs/view/940281",
      };

      setJobs((prev) => [newDiscoveredJob, ...prev]);

      addStep({
        phase: "JOB_HARVEST",
        title: "Discovered Fresh Low-Saturation Opportunity",
        detail: `Found "${newDiscoveredJob.title}" at ${newDiscoveredJob.company} (${newDiscoveredJob.applicantCount} applicants, posted 18m ago).`,
        status: "success",
      });

      // Check if batch apply is enabled and identify all jobs in queue that exceed >85% ATS score
      const otherQualifiedJobs = batchApplyEnabled
        ? jobs.filter(
            (j) =>
              (j.status === "discovered" || j.status === "tailoring") &&
              j.atsFitScore > 85 &&
              j.id !== newDiscoveredJob.id
          )
        : [];

      const batchToSubmit = [newDiscoveredJob, ...otherQualifiedJobs];
      const isMultiBatch = batchApplyEnabled && batchToSubmit.length > 1;

      // Step 3: ATS Evaluation & Tailoring
      addStep({
        phase: "ATS_EVALUATION",
        title: isMultiBatch
          ? `Node: batch_ats_evaluator (${batchToSubmit.length} Positions >85% ATS)`
          : "Node: ats_evaluator_and_tailor",
        detail: isMultiBatch
          ? `Calculating semantic keyword vector distance for ${batchToSubmit.length} jobs meeting >85% ATS threshold: [${batchToSubmit.map((j) => `${j.company} (${j.atsFitScore}%)`).join(", ")}]...`
          : `Calculating semantic keyword vector distance against candidate profile (${candidateProfile.yearsOfExperience} yrs YoE)...`,
        status: "running",
      });
      await new Promise((r) => setTimeout(r, 800));

      addStep({
        phase: "DOSSIER_TAILORING",
        title: isMultiBatch
          ? `Parallel Dossiers Tailored (${batchToSubmit.length} Positions)`
          : "Synthesized ATS-Optimized Answers",
        detail: isMultiBatch
          ? `All ${batchToSubmit.length} opportunities surpassed >85% threshold. Synthesized custom resume PDFs, cover letters, and keyword alignments in parallel.`
          : `ATS Fit Score: 95%. Injected tailored keywords: [Azure Container Apps, Cosmos DB, Microservices]. Custom cover letter formatted.`,
        status: "success",
        metadata: {
          atsScore: isMultiBatch ? `${batchToSubmit.map((j) => `${j.company}: ${j.atsFitScore}%`).join(", ")}` : "95/100",
          status: "QUALIFIED_FOR_AUTO_APPLY",
          mode: isMultiBatch ? "PARALLEL_BATCH_DISPATCH" : "SINGLE_DISPATCH",
        },
      });

      // Step 4: Auto Apply (Parallel or Single)
      addStep({
        phase: "AUTO_APPLY",
        title: isMultiBatch
          ? `Node: concurrent_headless_submitter (${batchToSubmit.length} Threads In-Flight)`
          : "Node: automated_form_submission (Unattended)",
        detail: isMultiBatch
          ? `Spawning parallel headless worker threads across LinkedIn & Indeed. Executing zero-click form submissions simultaneously for ${batchToSubmit.length} positions...`
          : `Navigating multi-step modal on ${newDiscoveredJob.platform} Easy Apply. Injecting candidate credentials & uploading tailored resume PDF...`,
        status: "running",
      });
      await new Promise((r) => setTimeout(r, 1200));

      const confirmations = batchToSubmit.map((j) => ({
        job: j,
        confirmation: `CONF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      }));

      // Mark all batch jobs as applied
      const nowAppliedDate = new Date().toISOString();
      setJobs((prev) =>
        prev.map((j) => {
          const match = confirmations.find((c) => c.job.id === j.id);
          if (match) {
            return {
              ...j,
              status: "applied",
              appliedTimestamp: "Just now",
              appliedDate: nowAppliedDate,
              tailoredSummarySnippet: isMultiBatch
                ? `Batch auto-applied with ${j.atsFitScore}% ATS fit. Submitted in simultaneous parallel multi-thread execution.`
                : "Emphasized Azure cloud systems, Cosmos DB partition optimizations, and high-concurrency Node.js microservices.",
            };
          }
          return j;
        })
      );

      addStep({
        phase: "AUTO_APPLY",
        title: isMultiBatch
          ? `Batch Applications Submitted Successfully (${confirmations.length} Completed)`
          : "Application Submitted Successfully",
        detail: isMultiBatch
          ? `Successfully completed simultaneous Easy Apply across ${confirmations.length} positions without human input! Confirmations: ${confirmations.map((c) => `${c.job.company} (${c.confirmation})`).join(", ")}`
          : `Successfully completed Easy Apply without human input. Confirmation: ${confirmations[0].confirmation}`,
        status: "success",
        metadata: {
          confirmation: confirmations.map((c) => c.confirmation).join(", "),
          batchCount: confirmations.length,
          timeElapsed: isMultiBatch ? "2.4s (Parallel)" : "2.1s",
        },
      });

      // Step 5: Cosmos DB Telemetry
      addStep({
        phase: "COSMOS_TELEMETRY",
        title: isMultiBatch
          ? `Node: cosmos_telemetry_emitter (${confirmations.length} Batch Records)`
          : "Node: cosmos_telemetry_emitter",
        detail: `Streaming application payload, ATS match matrix, and execution trace for ${confirmations.length} submissions to Azure Cosmos DB NoSQL container...`,
        status: "running",
      });

      for (const item of confirmations) {
        await logToCosmos("application", {
          company: item.job.company,
          title: item.job.title,
          platform: item.job.platform,
          atsScore: item.job.atsFitScore,
          confirmation: item.confirmation,
          status: "APPLIED",
          submissionMode: isMultiBatch ? "CONCURRENT_BATCH_APPLY_ABOVE_85_ATS" : "ZERO_HUMAN_INPUT_UNATTENDED",
        });
      }

      addStep({
        phase: "COSMOS_TELEMETRY",
        title: "Cosmos DB Telemetry Document Written",
        detail: `PartitionKey: '${candidateProfile.email}', Container: 'telemetry_logs', Combined Request Charge: ${(confirmations.length * 3.14).toFixed(2)} RU/s.`,
        status: "success",
      });

      // Celebration confetti
      try {
        confetti({
          particleCount: isMultiBatch ? 90 : 50,
          spread: isMultiBatch ? 80 : 60,
          origin: { y: 0.8 },
          colors: ["#6366f1", "#10b981", "#38bdf8"],
        });
      } catch (e) {
        // Confetti optional
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Trigger feedback loop mutation via Gemini AI
  const handleTriggerIteration = async () => {
    if (isIterating) return;
    setIsIterating(true);

    try {
      const currentGen = iterations.length;
      const res = await fetch("/api/agent/iterate-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentQuery,
          rejections: rejections.map((r) => ({ reason: r.snippet, category: r.category })),
          candidateProfile,
          iterationCount: currentGen,
        }),
      });

      const data = await res.json();

      const newIteration: QueryIteration = {
        iteration: currentGen + 1,
        query: data.evolvedQuery || `("${candidateProfile.role}") AND ("Azure" OR "Cloud") NOT "Agency"`,
        linkedinQuery: data.linkedinQuery || `"${candidateProfile.role}" AND "Azure"`,
        indeedQuery: data.indeedQuery || `title:("${candidateProfile.role}") "Azure"`,
        timestamp: "Just now",
        reasoning: data.rejectionAnalysis || "Synthesized failure patterns from Cosmos DB logs.",
        rejectionTriggersAnalyzed: rejections.length,
        hypothesis: data.hypothesis || "Tightening cloud architectural requirements eliminates junior saturation.",
        targetKeywordBoosts: data.targetKeywordBoosts || ["Azure Container Apps", "Cosmos DB", "LangGraph"],
        pacingRule: data.pacingRule || "Prioritize jobs indexed < 90 mins.",
        conversionRate: Math.min(38, Math.round(currentIterationObj.conversionRate + 6.4)),
        totalApplied: 0,
        interviewCallbacks: 0,
      };

      setIterations((prev) => [...prev, newIteration]);

      // Log to Cosmos DB
      await logToCosmos("query_iteration", {
        iteration: newIteration.iteration,
        query: newIteration.query,
        hypothesis: newIteration.hypothesis,
        reasoning: newIteration.reasoning,
        boosts: newIteration.targetKeywordBoosts,
      });

      addStep({
        phase: "FEEDBACK_OPTIMIZATION",
        title: `Evolved Search Policy Gen ${newIteration.iteration}`,
        detail: `New active query: ${newIteration.query}. Expected win-rate boost: ${data.expectedWinRateIncrease || "+25%"}`,
        status: "success",
      });
    } catch (err) {
      console.error("Failed to mutate query:", err);
    } finally {
      setIsIterating(false);
    }
  };

  // Analyze custom rejection email via Gemini AI
  const handleAnalyzeCustomEmail = async (emailText: string, jobTitle: string, company: string) => {
    const res = await fetch("/api/agent/analyze-rejection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rejectionEmailText: emailText,
        jobTitle,
        companyName: company,
      }),
    });
    const data = await res.json();

    const newRejection: RejectionLog = {
      id: `rej-${Date.now()}`,
      jobId: `custom-job-${Date.now()}`,
      company,
      role: jobTitle,
      platform: "LinkedIn",
      date: "Just now",
      category: data.category || "OVERSATURATED_POOL",
      snippet: emailText.substring(0, 180) + (emailText.length > 180 ? "..." : ""),
      confidence: data.confidence || 90,
      recommendedAdjustment: data.recommendedAction || "Adjust query parameters.",
      detectedAtIteration: iterations.length,
    };

    setRejections((prev) => [newRejection, ...prev]);

    // Log to Cosmos DB
    await logToCosmos("rejection_pattern", {
      company,
      role: jobTitle,
      category: newRejection.category,
      diagnosis: data.diagnosis,
      recommendedAction: newRejection.recommendedAdjustment,
      confidence: newRejection.confidence,
    });

    return data;
  };

  // Apply single job manually
  const handleApplySingleJob = async (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "applied",
              appliedTimestamp: "Just now",
              appliedDate: new Date().toISOString(),
              tailoredSummarySnippet: "Tailored to job specifications using candidate profile skills.",
            }
          : j
      )
    );

    const targetJob = jobs.find((j) => j.id === jobId);
    if (targetJob) {
      await logToCosmos("application", {
        company: targetJob.company,
        title: targetJob.title,
        platform: targetJob.platform,
        atsScore: targetJob.atsFitScore,
        status: "APPLIED",
        submissionMode: "DIRECT_TRIGGER",
      });

      addStep({
        phase: "AUTO_APPLY",
        title: `Manual Trigger Applied: ${targetJob.title}`,
        detail: `Successfully automated submission to ${targetJob.company} (${targetJob.platform}).`,
        status: "success",
      });
    }
  };

  // Execute concurrent batch application for all qualified jobs (>85% ATS score)
  const handleExecuteBatchApply = async () => {
    if (isRunning) return;

    const qualifiedJobs = jobs.filter(
      (j) => (j.status === "discovered" || j.status === "tailoring") && j.atsFitScore > 85
    );

    if (qualifiedJobs.length === 0) {
      addStep({
        phase: "ATS_EVALUATION",
        title: "Batch Apply Standby: No Unapplied Jobs >85% ATS",
        detail: "All current opportunities have either already been applied or do not reach the 85% ATS threshold. Trigger an autonomous harvest cycle to discover new roles.",
        status: "warning",
      });
      return;
    }

    setIsRunning(true);
    try {
      // Step 1: Batch Qualification Filter
      addStep({
        phase: "ATS_EVALUATION",
        title: `Node: batch_qualification_evaluator (${qualifiedJobs.length} Qualified Roles)`,
        detail: `Screening discovered pool against >85% ATS threshold. Found ${qualifiedJobs.length} highly matched positions: [${qualifiedJobs.map((j) => `${j.company} - ${j.atsFitScore}%`).join(", ")}]. Dispatching concurrent multi-worker pipelines...`,
        status: "running",
        metadata: {
          qualifiedCount: qualifiedJobs.length,
          threshold: ">85% ATS Fit",
          roles: qualifiedJobs.map((j) => `${j.title} @ ${j.company}`),
        },
      });
      await new Promise((r) => setTimeout(r, 600));

      addStep({
        phase: "DOSSIER_TAILORING",
        title: `Node: parallel_dossier_synthesizer (${qualifiedJobs.length} Positions)`,
        detail: `Synthesized tailored resume PDFs, custom cover letters, and keyword alignments for ${qualifiedJobs.length} positions in parallel execution threads.`,
        status: "running",
      });
      await new Promise((r) => setTimeout(r, 800));

      addStep({
        phase: "DOSSIER_TAILORING",
        title: "Dossiers Tailored in Parallel",
        detail: `Generated custom ATS submissions for ${qualifiedJobs.map((j) => j.company).join(", ")}. Injected required cloud, language, and framework tokens.`,
        status: "success",
      });

      // Step 2: Concurrent Headless Form Submissions
      addStep({
        phase: "AUTO_APPLY",
        title: `Node: concurrent_headless_submitter (${qualifiedJobs.length} Submissions In-Flight)`,
        detail: `Spawning parallel headless browser workers across LinkedIn & Indeed. Executing zero-click form submissions simultaneously...`,
        status: "running",
      });
      await new Promise((r) => setTimeout(r, 1200));

      // Generate confirmation codes for each job
      const batchConfirmations = qualifiedJobs.map((j) => ({
        job: j,
        confirmation: `CONF-BATCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      }));

      // Update all qualified jobs in state to "applied"
      const nowBatchDate = new Date().toISOString();
      setJobs((prev) =>
        prev.map((j) => {
          const match = batchConfirmations.find((c) => c.job.id === j.id);
          if (match) {
            return {
              ...j,
              status: "applied",
              appliedTimestamp: "Just now",
              appliedDate: nowBatchDate,
              tailoredSummarySnippet: `Batch auto-applied with ${j.atsFitScore}% ATS fit. Submitted in parallel zero-click multi-thread execution.`,
            };
          }
          return j;
        })
      );

      addStep({
        phase: "AUTO_APPLY",
        title: `Concurrent Batch Auto-Apply Complete (${batchConfirmations.length} Submitted)`,
        detail: `Successfully submitted ${batchConfirmations.length} job applications in parallel without human input! Confirmations: ${batchConfirmations.map((c) => `${c.job.company} (${c.confirmation})`).join(", ")}`,
        status: "success",
        metadata: {
          submittedCount: batchConfirmations.length,
          confirmations: batchConfirmations.map((c) => c.confirmation),
          mode: "CONCURRENT_PARALLEL_SUBMISSION",
        },
      });

      // Step 3: Cosmos DB Telemetry for each application
      addStep({
        phase: "COSMOS_TELEMETRY",
        title: `Node: cosmos_telemetry_emitter (Batch Logs)`,
        detail: `Streaming batch payload and execution trace for ${batchConfirmations.length} applications to Azure Cosmos DB...`,
        status: "running",
      });

      for (const item of batchConfirmations) {
        await logToCosmos("application", {
          company: item.job.company,
          title: item.job.title,
          platform: item.job.platform,
          atsScore: item.job.atsFitScore,
          confirmation: item.confirmation,
          status: "APPLIED",
          submissionMode: "CONCURRENT_BATCH_APPLY_ABOVE_85_ATS",
        });
      }

      addStep({
        phase: "COSMOS_TELEMETRY",
        title: "Cosmos DB Batch Documents Written",
        detail: `Persisted ${batchConfirmations.length} documents to Cosmos DB 'telemetry_logs' container (PartitionKey: '${candidateProfile.email}'). Combined Request Charge: ${(batchConfirmations.length * 3.14).toFixed(2)} RU/s.`,
        status: "success",
      });

      // Celebration confetti
      try {
        confetti({
          particleCount: 85,
          spread: 85,
          origin: { y: 0.7 },
          colors: ["#10b981", "#06b6d4", "#6366f1"],
        });
      } catch (_) {}
    } finally {
      setIsRunning(false);
    }
  };

  // Add missing skill(s) to candidate profile from Feedback Loop frequency analysis
  const handleAddSkillToProfile = (skill: string) => {
    handleAddMultipleSkillsToProfile([skill]);
  };

  const handleAddMultipleSkillsToProfile = (skillsToAdd: string[]) => {
    const validSkills = skillsToAdd
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (validSkills.length === 0) return;

    setCandidateProfile((prev) => {
      const existing = new Set(prev.skills.map((s) => s.toLowerCase()));
      const newSkills = validSkills.filter((s) => !existing.has(s.toLowerCase()));
      if (newSkills.length === 0) return prev;
      return {
        ...prev,
        skills: [...prev.skills, ...newSkills],
      };
    });

    const lowerValidSkills = new Set(validSkills.map((s) => s.toLowerCase()));

    // Re-evaluate jobs that were missing any of these keywords
    setJobs((prev) =>
      prev.map((job) => {
        const newlyMatched = job.missingKeywords.filter((mk) =>
          lowerValidSkills.has(mk.toLowerCase())
        );
        if (newlyMatched.length > 0) {
          const newMissing = job.missingKeywords.filter(
            (mk) => !lowerValidSkills.has(mk.toLowerCase())
          );
          const newMatched = [...job.matchedKeywords, ...newlyMatched];
          const newScore = Math.min(99, job.atsFitScore + newlyMatched.length * 6);
          return {
            ...job,
            missingKeywords: newMissing,
            matchedKeywords: newMatched,
            atsFitScore: newScore,
          };
        }
        return job;
      })
    );

    // Stream profile enhancement telemetry to Cosmos DB
    logToCosmos("candidate_profile_update" as any, {
      action: "SKILLS_AUTO_ADOPTED_FROM_FEEDBACK_LOOP",
      adoptedSkills: validSkills,
      candidateEmail: candidateProfile.email,
    });

    addStep({
      phase: "FEEDBACK_OPTIMIZATION",
      title: `Auto-Adopted ATS Skills: ${validSkills.join(", ")}`,
      detail: `Incorporated high-frequency missing keywords (${validSkills.join(", ")}) into profile and recalibrated pipeline ATS vectors.`,
      status: "success",
    });

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#14b8a6"],
      });
    } catch (e) {
      // Confetti optional
    }
  };

  // Handle applying to a stretch or step-up role with compensatory dossier
  const handleApplyStretchJob = (analysis: StretchRoleAnalysis) => {
    const existingJob = jobs.find((j) => j.id === analysis.jobId);
    const jobTitle = analysis.title;
    const company = analysis.company;

    if (existingJob) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === existingJob.id
            ? {
                ...j,
                status: "applied",
                appliedTimestamp: "Just now",
                tailoredSummarySnippet: analysis.customPitchAngle,
              }
            : j
        )
      );
    } else {
      const newJob: JobOpportunity = {
        id: `stretch-job-${Date.now()}`,
        title: analysis.title,
        company: analysis.company,
        platform: analysis.platform,
        location: "Remote (US)",
        salaryRange: analysis.salaryRange,
        postedTimeAgo: "Just now",
        applicantCount: analysis.tier === "MOONSHOT" ? 310 : analysis.tier === "STEP_UP" ? 42 : 12,
        atsFitScore: analysis.atsFitScore,
        matchedKeywords: analysis.matchedSkills,
        missingKeywords: analysis.missingSkills,
        status: "applied",
        appliedTimestamp: "Just now",
        easyApplyUrl: `https://${analysis.platform.toLowerCase()}.com/jobs/stretch`,
        tailoredSummarySnippet: analysis.customPitchAngle,
      };
      setJobs((prev) => [newJob, ...prev]);
    }

    // Cosmos DB Telemetry
    logToCosmos("application", {
      tier: analysis.tier,
      jobTitle,
      company,
      platform: analysis.platform,
      atsScore: analysis.atsFitScore,
      strategy: "COMPENSATORY_STRETCH_DOSSIER",
      compensatoryStrengths: analysis.compensatoryStrengths,
      estimatedOdds: `${analysis.estimatedProbability}%`,
    });

    addStep({
      phase: "AUTO_APPLY",
      title: `Submitted ${analysis.tier === "MOONSHOT" ? "Moonshot Reach" : "Step-Up Stretch"}: ${jobTitle}`,
      detail: `Injected compensatory positioning dossier for ${company}. Framed ${candidateProfile.yearsOfExperience} yrs experience with high-velocity cloud & AI architectural proofs.`,
      status: "success",
      platform: analysis.platform,
    });

    try {
      confetti({
        particleCount: analysis.tier === "MOONSHOT" ? 70 : 45,
        spread: 80,
        origin: { y: 0.6 },
        colors:
          analysis.tier === "MOONSHOT"
            ? ["#f43f5e", "#fb7185", "#ec4899", "#a855f7"]
            : ["#8b5cf6", "#6366f1", "#06b6d4", "#10b981"],
      });
    } catch (e) {
      // Confetti optional
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${currentTheme.rootClass}`}>
      {/* Thematic Header with System Telemetry & Theme Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRunning={isRunning}
        onRunCycle={handleRunCycle}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenDailyDigest={() => setIsDailyDigestOpen(true)}
        currentIteration={currentIterationObj.iteration}
        winRate={currentIterationObj.conversionRate}
        activeThemeId={activeThemeId}
        onSelectTheme={setActiveThemeId}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === "agent" && (
          <AgentConsole
            jobs={jobs}
            steps={steps}
            isRunning={isRunning}
            onRunCycle={handleRunCycle}
            candidateProfile={candidateProfile}
            currentQuery={currentQuery}
            onApplySingleJob={handleApplySingleJob}
            activePlatforms={activePlatforms}
            setActivePlatforms={setActivePlatforms}
            onNavigateToStretch={() => setActiveTab("stretch")}
            onOpenDailyDigest={() => setIsDailyDigestOpen(true)}
            batchApplyEnabled={batchApplyEnabled}
            setBatchApplyEnabled={setBatchApplyEnabled}
            onExecuteBatchApply={handleExecuteBatchApply}
            activeThemeId={activeThemeId}
          />
        )}

        {activeTab === "stretch" && (
          <StretchAnalysisView
            candidateProfile={candidateProfile}
            jobs={jobs}
            stretchAnalyses={stretchAnalyses}
            onApplyStretchJob={handleApplyStretchJob}
            onAddSkillToProfile={handleAddSkillToProfile}
          />
        )}

        {activeTab === "feedback" && (
          <FeedbackLoopView
            iterations={iterations}
            onTriggerIteration={handleTriggerIteration}
            isIterating={isIterating}
            candidateProfile={candidateProfile}
            jobs={jobs}
            rejections={rejections}
            onAddSkillToProfile={handleAddSkillToProfile}
            onAddMultipleSkills={handleAddMultipleSkillsToProfile}
            onNavigateToStretch={() => setActiveTab("stretch")}
          />
        )}

        {activeTab === "rejections" && (
          <RejectionAnalyzer
            rejections={rejections}
            onAnalyzeCustomEmail={handleAnalyzeCustomEmail}
          />
        )}

        {activeTab === "cosmos" && (
          <CosmosDbExplorer
            documents={cosmosDocs}
            onRefresh={fetchCosmosDocs}
            onTriggerBackup={() => performProfileBackup(candidateProfile, "MANUAL_TRIGGER")}
            backupStatus={{
              enabled: true,
              intervalMinutes: 5,
              lastBackupTimestamp,
              totalBackupsLogged: totalProfileBackups,
            }}
          />
        )}

        {activeTab === "code" && <AzureDeploymentHub />}
      </main>

      {/* Candidate Profile Modal */}
      <CandidateProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={candidateProfile}
        onSave={(newProfile) => {
          setCandidateProfile(newProfile);
          performProfileBackup(newProfile, "PROFILE_UPDATE");
        }}
        onSnapshotToCosmos={(snapshot) => performProfileBackup(snapshot, "MANUAL_TRIGGER")}
        lastBackupTimestamp={lastBackupTimestamp}
      />

      {/* Daily Digest Modal */}
      <DailyDigestModal
        isOpen={isDailyDigestOpen}
        onClose={() => setIsDailyDigestOpen(false)}
        jobs={jobs}
        rejections={rejections}
        iterations={iterations}
        candidateProfile={candidateProfile}
        stretchAnalyses={stretchAnalyses}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* Chromatic 3-Theme Variations Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        activeThemeId={activeThemeId}
        onSelectTheme={setActiveThemeId}
      />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-md py-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: currentTheme.primaryHex }}
            />
            <span>LangChain Autonomous Job Agent • Active Palette: <strong className="text-white">{currentTheme.name}</strong></span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="hover:underline text-slate-300 font-medium flex items-center gap-1"
            >
              <span>Switch Theme ({currentTheme.name})</span>
            </button>
            <span className="text-slate-600">|</span>
            <span>Serverless RU Billing: ~3.4 RU/query</span>
            <span className="text-slate-600">|</span>
            <span>State: LangGraph Memory Checkpointed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
