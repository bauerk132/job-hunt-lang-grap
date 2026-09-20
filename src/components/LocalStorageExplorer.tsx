import React, { useState, useEffect } from "react";
import {
  Database,
  Search,
  Play,
  Copy,
  Check,
  RefreshCw,
  FolderTree,
  FileJson,
  Layers,
  Cpu,
  Zap,
  Server,
  ShieldCheck,
  UserCheck,
  HardDrive,
  Download,
  Upload,
  Trash2,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { CosmosDocument } from "../types";

export type StorageEngineMode = "LOCAL_STORAGE" | "INDEXED_DB" | "IN_MEMORY_FREE";

interface LocalStorageExplorerProps {
  documents: CosmosDocument[];
  onRefresh: () => void;
  onTriggerBackup?: () => void;
  storageMode: StorageEngineMode;
  onToggleStorageMode: (mode: StorageEngineMode) => void;
  onClearLocalStorage?: () => void;
  backupStatus?: {
    enabled: boolean;
    intervalMinutes: number;
    lastBackupTimestamp: string | null;
    totalBackupsLogged: number;
  };
}

export const LocalStorageExplorer: React.FC<LocalStorageExplorerProps> = ({
  documents,
  onRefresh,
  onTriggerBackup,
  storageMode,
  onToggleStorageMode,
  onClearLocalStorage,
  backupStatus,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM local_store ORDER BY _ts DESC");
  const [selectedDoc, setSelectedDoc] = useState<CosmosDocument | null>(documents[0] || null);
  const [copied, setCopied] = useState(false);
  const [exported, setExported] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [storageUsageBytes, setStorageUsageBytes] = useState<number>(0);
  const [executionLatency, setExecutionLatency] = useState<number>(2);

  // Compute local storage usage in bytes
  useEffect(() => {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += (localStorage[key].length + key.length) * 2;
        }
      }
      setStorageUsageBytes(total);
    } catch (_) {
      setStorageUsageBytes(JSON.stringify(documents).length * 2);
    }
  }, [documents]);

  useEffect(() => {
    if (documents.length > 0 && !selectedDoc) {
      setSelectedDoc(documents[0]);
    }
  }, [documents, selectedDoc]);

  const presetQueries = [
    { label: "All Items", query: "SELECT * FROM local_store ORDER BY _ts DESC" },
    { label: "Profile Backups", query: "SELECT * FROM local_store WHERE type = 'candidate_profile_backup'" },
    { label: "Rejection Patterns", query: "SELECT * FROM local_store WHERE type = 'rejection_pattern'" },
    { label: "Query Feedback History", query: "SELECT * FROM local_store WHERE type = 'query_iteration'" },
    { label: "Agent Run Telemetry", query: "SELECT * FROM local_store WHERE type = 'agent_run'" },
    { label: "Applications Submitted", query: "SELECT * FROM local_store WHERE type = 'application'" },
    { label: "Auto-Dismissed Low-Fit/Duplicates", query: "SELECT * FROM local_store WHERE type = 'background_dismissal'" },
  ];

  const handleExecuteQuery = async (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    setIsQuerying(true);
    const start = performance.now();
    try {
      const response = await fetch("/api/cosmos/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await response.json();
      setExecutionLatency(Math.max(1, Math.round(performance.now() - start)));
      if (data.documents && data.documents.length > 0) {
        setSelectedDoc(data.documents[0]);
      }
    } catch (e) {
      console.warn("Local query execution fallback:", e);
      setExecutionLatency(2);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleCopyJson = () => {
    if (!selectedDoc) return;
    navigator.clipboard.writeText(JSON.stringify(selectedDoc, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportAllJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(documents, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `job_agent_local_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const filteredDocs = documents.filter(
    (d) => activeFilter === "ALL" || d.type === activeFilter
  );

  const formattedKb = (storageUsageBytes / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Free Local Storage Top Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Zero-Cost Free Local Storage & Telemetry Store
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    100% FREE • $0.00 / MO
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>Engine: <strong className="text-emerald-300 font-semibold">{storageMode}</strong></span>
                <span className="text-slate-600">•</span>
                <span>Storage Key: <strong className="text-sky-300">job_agent_documents_v2</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">No Cosmos DB Cloud RU Invoices</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Storage Mode Selector Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onToggleStorageMode("LOCAL_STORAGE")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  storageMode === "LOCAL_STORAGE"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Persists in browser localStorage across tabs & reboots"
              >
                Browser LocalStorage
              </button>
              <button
                type="button"
                onClick={() => onToggleStorageMode("INDEXED_DB")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  storageMode === "INDEXED_DB"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Structured client-side IndexedDB key-value partition"
              >
                IndexedDB (Free)
              </button>
            </div>

            {/* Metric pill */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Local Usage:</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                {formattedKb} KB
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Latency:</span>
              <span className="font-mono text-cyan-400 font-semibold">{executionLatency}ms</span>
            </div>

            {/* Backup Snapshot Button */}
            {onTriggerBackup && (
              <button
                id="local-storage-snapshot-backup-btn"
                onClick={onTriggerBackup}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
                title="Instantly snapshot candidate profile & ATS configuration to LocalStorage"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Backup Profile</span>
              </button>
            )}

            {/* Export JSON button */}
            <button
              id="export-all-local-docs-btn"
              onClick={handleExportAllJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-colors"
              title="Download entire document database as standalone JSON file"
            >
              {exported ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{exported ? "Exported!" : "Export JSON"}</span>
            </button>

            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title="Refresh Local Documents"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Partition & Collections Ribbon */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
            <span>Store: <strong className="text-white">telemetry_logs</strong></span>
            <span className="text-slate-600">/</span>
            <span>Index: <strong className="text-emerald-300 font-bold">Local Key-Value Partition</strong></span>
            <span className="text-slate-600">/</span>
            <span>Monthly Azure DB Bill: <strong className="text-emerald-400 font-bold">$0.00 (Zero RU Charge)</strong></span>
          </div>

          {/* Collection Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] overflow-x-auto">
            {[
              { id: "ALL", label: "All Docs" },
              { id: "candidate_profile_backup", label: "Profile Backups" },
              { id: "agent_run", label: "Agent Runs" },
              { id: "query_iteration", label: "Query Feedback" },
              { id: "rejection_pattern", label: "Rejections" },
              { id: "application", label: "Applications" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-0.5 rounded font-medium transition-colors whitespace-nowrap ${
                  activeFilter === f.id
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Local Query Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-emerald-400" /> Fast Client & Local Store Query Engine
          </span>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Presets:</span>
            {presetQueries.map((pq, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSqlQuery(pq.query);
                  handleExecuteQuery(pq.query);
                }}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
              >
                {pq.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExecuteQuery()}
            placeholder="SELECT * FROM local_store WHERE type = 'rejection_pattern'"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => handleExecuteQuery()}
            disabled={isQuerying}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isQuerying ? "animate-spin" : ""}`} />
            Filter Query
          </button>
        </div>
      </div>

      {/* Automated Candidate Profile Backup Monitor Banner */}
      {backupStatus && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Automated Free Local Profile Backup</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ACTIVE (CRON */{backupStatus.intervalMinutes}m)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Periodically serializes complete candidate profile, ATS keyword configurations, and work arrangement preferences into LocalStorage. 100% free, private to your browser, and no paid cloud database required.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Last Snapshot</span>
                <span className="text-emerald-300 font-mono font-semibold">
                  {backupStatus.lastBackupTimestamp || "Initializing..."}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Snapshots Saved</span>
                <span className="text-white font-mono font-bold text-sm">
                  {backupStatus.totalBackupsLogged}
                </span>
              </div>
              {onTriggerBackup && (
                <button
                  onClick={onTriggerBackup}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Snapshot Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Split Documents View: Left Document Tree, Right JSON Document Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document List */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              Documents in Free Store ({filteredDocs.length})
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Cost: $0.00 / RU</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
            {filteredDocs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No documents match query
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-850 border-emerald-500 text-white ring-1 ring-emerald-500/30"
                        : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                      <span className="font-bold text-emerald-400">id: {doc.id}</span>
                      <span className="text-slate-500">{doc.timestamp?.substring(11, 19)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                          doc.type === "candidate_profile_backup"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : doc.type === "agent_run"
                            ? "bg-blue-950 text-blue-300 border border-blue-800"
                            : doc.type === "query_iteration"
                            ? "bg-purple-950 text-purple-300 border border-purple-800"
                            : doc.type === "rejection_pattern"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : doc.type === "background_dismissal"
                            ? "bg-orange-950 text-orange-300 border border-orange-800"
                            : "bg-teal-950 text-teal-300 border border-teal-800"
                        }`}
                      >
                        {doc.type}
                      </span>
                      <span className="text-[11px] text-slate-300 truncate font-mono">
                        pk: {doc.partitionKey}
                      </span>
                    </div>

                    <div className="mt-1.5 text-[11px] text-slate-400 truncate">
                      {doc.type === "candidate_profile_backup" && (
                        <span className="text-emerald-300/90 font-medium">
                          Snapshot: {doc.data?.candidateName || doc.data?.role || "Profile Backup"} ({doc.data?.triggerSource || "Automated Schedule"})
                        </span>
                      )}
                      {doc.data?.company && `${doc.data.company} • `}
                      {doc.data?.query && `Query: "${doc.data.query}"`}
                      {doc.data?.agentVersion && `Version: ${doc.data.agentVersion}`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* JSON Inspector */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white font-mono">
                {selectedDoc ? `Document: ${selectedDoc.id}.json` : "Document Inspector"}
              </span>
            </div>

            {selectedDoc && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy Document"}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-200/90 leading-relaxed">
            {selectedDoc ? (
              <pre>{JSON.stringify(selectedDoc, null, 2)}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                Select a document from the collection list
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
