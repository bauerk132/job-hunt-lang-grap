import React, { useState } from "react";
import { X, Save, User, Briefcase, DollarSign, MapPin, CheckCircle2, Shield, Database, UserCheck, RefreshCw } from "lucide-react";
import { CandidateProfile } from "../types";

interface CandidateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CandidateProfile;
  onSave: (profile: CandidateProfile) => void;
  onSnapshotToCosmos?: (profileSnapshot: CandidateProfile) => void;
  lastBackupTimestamp?: string | null;
}

export const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onSnapshotToCosmos,
  lastBackupTimestamp,
}) => {
  const [formData, setFormData] = useState<CandidateProfile>({ ...profile });
  const [skillInput, setSkillInput] = useState("");
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Candidate Profile & ATS Dossier Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Email (Partition Key)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Target Engineering Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Years of Relevant Experience</label>
              <input
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) =>
                  setFormData({ ...formData, yearsOfExperience: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Desired Salary Range</label>
              <input
                type="text"
                value={formData.desiredSalary}
                onChange={(e) => setFormData({ ...formData, desiredSalary: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Work Arrangement</label>
              <select
                value={formData.workMode}
                onChange={(e) =>
                  setFormData({ ...formData, workMode: e.target.value as any })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
                <option value="Any">Any</option>
              </select>
            </div>
          </div>

          {/* Skills Tag Input */}
          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Core Technical Skills & Stack (ATS Target Keywords)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Type skill & press Enter (e.g. Terraform, Kubernetes, Go)"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800/80 max-h-28 overflow-y-auto">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-200 border border-slate-800 flex items-center gap-1 text-[11px]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Resume Summary */}
          <div>
            <label className="text-slate-300 font-medium block mb-1">
              Resume Executive Summary (Source for Tailoring)
            </label>
            <textarea
              rows={3}
              value={formData.resumeSummary}
              onChange={(e) => setFormData({ ...formData, resumeSummary: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Free Local Storage Automated Persistence Banner & Manual Backup */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-emerald-950/30 to-slate-950 border border-emerald-500/30 text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">Free Local Storage & ATS Profile Persistence</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% FREE (LOCALSTORAGE)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Snapshots of this profile and its ATS configurations are stored locally in your browser's persistent LocalStorage (partition key: <code className="text-emerald-300">{formData.email}</code>). Completely free with zero Cosmos DB cloud RU bills or external database costs.
            </p>
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-500">
                Last Local Backup: <strong className="text-emerald-300 font-mono">{lastBackupTimestamp || "Just now"}</strong>
              </span>
              {onSnapshotToCosmos && (
                <button
                  type="button"
                  onClick={() => {
                    onSnapshotToCosmos(formData);
                    setSnapshotSuccess(true);
                    setTimeout(() => setSnapshotSuccess(false), 2500);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-white font-medium transition-colors"
                >
                  {snapshotSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Saved to LocalStorage!</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Backup Snapshot Now</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Platform Automation Credentials Notice */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 space-y-1">
            <span className="font-semibold text-white flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Automated Session Authentication
            </span>
            <p className="text-[11px]">
              Headless browser uses cookie session tokens stored in Azure Key Vault for LinkedIn Easy Apply and Indeed Instant Apply. No plaintext password is ever stored or logged.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-3.5 h-3.5" /> Save Profile & Strategy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
