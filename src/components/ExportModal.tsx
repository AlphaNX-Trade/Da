import React, { useState } from 'react';
import { Game, Participant, ParticipationRecord } from '../types';
import { api } from '../api';
import { Download, Check, X, Table, Users, CheckCircle, FolderArchive, GitBranch, Terminal, Copy } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  participants: Participant[];
  participation: ParticipationRecord[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  games,
  participants,
  participation,
}) => {
  const [downloading, setDownloading] = useState<'participants' | 'participation' | 'zip' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showGitGuide, setShowGitGuide] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  if (!isOpen) return null;

  // Function to trigger direct download from backend
  const triggerDownload = (url: string, filename: string, type: 'participants' | 'participation' | 'zip') => {
    setDownloading(type);
    setDownloadSuccess(null);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(null);
      const label = type === 'participants' 
        ? 'Participants CSV' 
        : type === 'participation' 
          ? 'Participation CSV' 
          : 'App Source Code ZIP (dasara-zone-app.zip)';
      setDownloadSuccess(label);
      setTimeout(() => setDownloadSuccess(null), 4000);
    }, 800);
  };

  const handleExportParticipants = () => {
    triggerDownload(api.getParticipantsExportUrl(), 'dasara_zone_participants.csv', 'participants');
  };

  const handleExportParticipation = () => {
    triggerDownload(api.getParticipationExportUrl(), 'dasara_zone_participation.csv', 'participation');
  };

  const handleExportZip = () => {
    triggerDownload(api.getAppZipUrl(), 'dasara-zone-app.zip', 'zip');
  };

  const copyToClipboard = (text: string, stepIndex: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Export &amp; Code Repository</h3>
              <p className="text-xs text-gray-500">Download data sheets or full application source code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {downloadSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Downloaded <strong>{downloadSuccess}</strong> successfully!</span>
          </div>
        )}

        <div className="mt-5 space-y-3.5">
          {/* Export Option 1: App Source Code ZIP */}
          <div className="p-4 rounded-xl border-2 border-blue-500/80 bg-blue-50/20 hover:bg-blue-50/40 transition-all flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-blue-600 shrink-0" />
                <h4 className="font-bold text-gray-900 text-sm">Download App ZIP (Full Source Code)</h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">Recommended</span>
              </div>
              <p className="text-xs text-gray-600">
                Complete package containing all React components, Express server, SQLite database with current participants and games, configurations, and setup guide.
              </p>
              <div className="text-[11px] font-mono text-blue-700">
                Archive: dasara-zone-app.zip
              </div>
            </div>

            <button
              onClick={handleExportZip}
              disabled={downloading !== null}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading === 'zip' ? 'Packaging...' : 'Download ZIP'}</span>
            </button>
          </div>

          {/* Export Option 2: Full Participation Matrix */}
          <div className="p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="font-bold text-gray-900 text-sm">Export Participation Matrix (CSV)</h4>
              </div>
              <p className="text-xs text-gray-500">
                Spreadsheet containing participant info and "Yes"/"No" selections for every game ({games.length} games).
              </p>
              <div className="text-[11px] font-mono text-gray-400 truncate max-w-xs">
                Format: Name, Age, Class, {games.slice(0, 2).map(g => g.name).join(', ')}..., Total Games
              </div>
            </div>

            <button
              onClick={handleExportParticipation}
              disabled={downloading !== null || participants.length === 0}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-300 text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading === 'participation' ? 'Downloading...' : 'Download CSV'}</span>
            </button>
          </div>

          {/* Export Option 3: Participants List */}
          <div className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <h4 className="font-bold text-gray-900 text-sm">Export Participants (CSV)</h4>
              </div>
              <p className="text-xs text-gray-500">
                Contains Name, Age, Class, and Section columns for all {participants.length} registered people.
              </p>
              <div className="text-[11px] font-mono text-gray-400">
                Format: Name, Age, Class, Section
              </div>
            </div>

            <button
              onClick={handleExportParticipants}
              disabled={downloading !== null || participants.length === 0}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading === 'participants' ? 'Downloading...' : 'Download CSV'}</span>
            </button>
          </div>
        </div>

        {/* Git Repository Instructions Toggle */}
        <div className="mt-5 border border-indigo-100 rounded-xl bg-indigo-50/40 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-950">How to push to a New Git Repository</span>
            </div>
            <button
              onClick={() => setShowGitGuide(!showGitGuide)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
            >
              {showGitGuide ? 'Hide Guide' : 'Show Step-by-Step Guide'}
            </button>
          </div>

          {showGitGuide && (
            <div className="mt-3 space-y-3 pt-3 border-t border-indigo-100 text-xs text-gray-700">
              <p className="text-gray-600">
                Follow these commands in your computer terminal after unzipping the downloaded file:
              </p>

              <div className="space-y-2">
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] relative">
                  <div className="text-slate-400 mb-1"># 1. Unzip and enter folder</div>
                  <code>unzip dasara-zone-app.zip -d dasara-zone &amp;&amp; cd dasara-zone</code>
                  <button
                    onClick={() => copyToClipboard('unzip dasara-zone-app.zip -d dasara-zone && cd dasara-zone', 1)}
                    className="absolute top-2.5 right-2.5 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                    title="Copy command"
                  >
                    {copiedStep === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] relative">
                  <div className="text-slate-400 mb-1"># 2. Initialize Git &amp; commit files</div>
                  <code>git init &amp;&amp; git branch -M main &amp;&amp; git add . &amp;&amp; git commit -m "Initial commit"</code>
                  <button
                    onClick={() => copyToClipboard('git init && git branch -M main && git add . && git commit -m "Initial commit"', 2)}
                    className="absolute top-2.5 right-2.5 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                    title="Copy command"
                  >
                    {copiedStep === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] relative">
                  <div className="text-slate-400 mb-1"># 3. Connect to your new remote repository &amp; push</div>
                  <code>git remote add origin https://github.com/&lt;your-username&gt;/&lt;your-new-repo&gt;.git<br />git push -u origin main</code>
                  <button
                    onClick={() => copyToClipboard('git remote add origin https://github.com/<your-username>/<your-new-repo>.git\ngit push -u origin main', 3)}
                    className="absolute top-2.5 right-2.5 p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                    title="Copy command"
                  >
                    {copiedStep === 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            Included in ZIP: React UI, Express server, SQLite DB, README.md
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
