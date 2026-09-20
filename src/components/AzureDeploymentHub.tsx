import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Download,
  Cloud,
  Layers,
  Terminal,
  Server,
  ShieldCheck,
  ExternalLink,
  Cpu,
} from "lucide-react";
import { productionCodeSnippets, CodeFile } from "../data/codeSnippets";

export const AzureDeploymentHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(productionCodeSnippets[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Architecture Blueprint Card */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-semibold">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              Azure Hosting & Containerized Architecture
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Production Deployment Blueprint: Azure Container Apps & Cosmos DB
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              This autonomous system is architected as an Azure Container App Job running headless Playwright browsers, LangGraph state checkpoints, and Azure Cosmos DB for NoSQL partitioned telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-500 block">Estimated Azure Cost</span>
              <span className="text-emerald-400 font-bold text-sm">~$8.50 / month</span>
              <span className="text-[10px] text-slate-400">Serverless Cosmos + Consumption Job</span>
            </div>
          </div>
        </div>

        {/* Visual Flow diagram */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-sky-400 mb-1">
              <Cpu className="w-3.5 h-3.5" /> 1. ACA Scheduled Job
            </div>
            <p className="text-slate-400 text-[11px]">
              Cron schedule triggers every 4 hours (`0 */4 * * *`). Spawns a headless container with LangChain & Playwright.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-indigo-400 mb-1">
              <Terminal className="w-3.5 h-3.5" /> 2. Headless Scraper & Applier
            </div>
            <p className="text-slate-400 text-[11px]">
              Automates LinkedIn Easy Apply & Indeed Instant Apply. Injects custom ATS answers, tailored resume bullets, and tracks application outcomes.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-pink-400 mb-1">
              <Layers className="w-3.5 h-3.5" /> 3. Cosmos DB Telemetry
            </div>
            <p className="text-slate-400 text-[11px]">
              Streams JSON logs to Cosmos DB NoSQL container (`telemetry_logs`). Emits RU consumption, ATS scores, and rejection communications.
            </p>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-purple-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 4. Query Feedback Mutator
            </div>
            <p className="text-slate-400 text-[11px]">
              Feedback loop analyzes failure signatures and mutates search queries with boolean operators before the next batch run.
            </p>
          </div>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              Production Source Code & Infrastructure Files
            </h3>
            <p className="text-xs text-slate-400">
              Inspect, copy, or download the full production code ready to deploy to Azure.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Code"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download File
            </button>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {productionCodeSnippets.map((file) => {
            const isSelected = selectedFile.filename === file.filename;
            return (
              <button
                key={file.filename}
                onClick={() => setSelectedFile(file)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? "bg-sky-950 text-sky-300 border border-sky-500/60 shadow-md"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                <span>{file.filename}</span>
                <span className="text-[10px] uppercase opacity-60">({file.language})</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 italic">
          {selectedFile.description}
        </div>

        {/* Code Block */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-sky-100 overflow-x-auto max-h-[500px] leading-relaxed">
          <pre>{selectedFile.code}</pre>
        </div>

        {/* Azure Deployment CLI instructions */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-sky-400" /> Azure CLI Fast Deploy Commands:
          </span>
          <div className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 space-y-1">
            <p className="text-slate-500"># 1. Provision Cosmos DB & Container Apps Environment</p>
            <p className="text-emerald-400">az group create --name JobAgentRG --location eastus2</p>
            <p className="text-emerald-400">az deployment group create --resource-group JobAgentRG --template-file azure_deploy.bicep</p>
            <p className="text-slate-500 mt-2"># 2. Build & Deploy Docker Image to Azure Container Registry</p>
            <p className="text-sky-300">az acr build --registry myjobacr --image langchain-job-agent:v1 .</p>
          </div>
        </div>
      </div>
    </div>
  );
};
