import React from 'react';
import { Trophy, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenCloudflare: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCloudflare }) => {
  return (
    <footer className="mt-12 bg-white border-t border-gray-200 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center">
            <Trophy className="w-3 h-3" />
          </div>
          <span className="font-bold text-gray-900">DASARA ZONE</span>
          <span className="text-gray-300">•</span>
          <span>Games &amp; Participation Management</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenCloudflare}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Cloudflare D1 Ready
          </button>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1 font-semibold text-gray-800">
            <span>Developed by</span>
            <span className="text-blue-600 font-bold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
              Alpha
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
