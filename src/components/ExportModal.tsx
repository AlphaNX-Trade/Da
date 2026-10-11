import React, { useState } from 'react';
import { Game, Participant, ParticipationRecord } from '../types';
import { api } from '../api';
import { Download, FileText, Check, X, Table, Users, CheckCircle } from 'lucide-react';

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
  const [downloading, setDownloading] = useState<'participants' | 'participation' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Function to trigger direct CSV download from backend or generated blob
  const triggerDownload = (url: string, filename: string, type: 'participants' | 'participation') => {
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
      setDownloadSuccess(type === 'participants' ? 'Participants CSV' : 'Participation CSV');
      setTimeout(() => setDownloadSuccess(null), 3000);
    }, 600);
  };

  const handleExportParticipants = () => {
    triggerDownload(api.getParticipantsExportUrl(), 'dasara_zone_participants.csv', 'participants');
  };

  const handleExportParticipation = () => {
    triggerDownload(api.getParticipationExportUrl(), 'dasara_zone_participation.csv', 'participation');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Export CSV Data</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-600">
          Download formatted CSV files compatible with Microsoft Excel, Google Sheets, and LibreOffice.
        </p>

        {downloadSuccess && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Downloaded {downloadSuccess} successfully!</span>
          </div>
        )}

        <div className="mt-5 space-y-3.5">
          {/* Export Option 1: Participants List */}
          <div className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-gray-900 text-sm">Export Participants</h4>
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
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading === 'participants' ? 'Downloading...' : 'Download CSV'}</span>
            </button>
          </div>

          {/* Export Option 2: Full Participation Matrix */}
          <div className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-sm">Export Participation Matrix</h4>
              </div>
              <p className="text-xs text-gray-500">
                Contains participant details and "Yes"/"No" columns for every game ({games.length} games).
              </p>
              <div className="text-[11px] font-mono text-gray-400 truncate max-w-xs">
                Format: Name, Age, Class, {games.slice(0, 2).map(g => g.name).join(', ')}..., Total Games
              </div>
            </div>

            <button
              onClick={handleExportParticipation}
              disabled={downloading !== null || participants.length === 0}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading === 'participation' ? 'Downloading...' : 'Download CSV'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 p-3 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-500">
          💡 <span className="font-semibold text-gray-700">Spreadsheet Tip:</span> These exports include UTF-8 Byte Order Marks (BOM), ensuring clean character rendering in Microsoft Excel without encoding errors.
        </div>

        <div className="mt-5 flex justify-end">
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
