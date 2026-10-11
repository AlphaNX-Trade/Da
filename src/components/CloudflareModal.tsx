import React, { useState } from 'react';
import { Cloud, X, Copy, Check, Terminal, Database, ExternalLink } from 'lucide-react';

interface CloudflareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudflareModal: React.FC<CloudflareModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const step1Sql = `npx wrangler d1 create dasara_zone_db`;
  const step2Sql = `npx wrangler d1 execute dasara_zone_db --file=migrations/0001_initial.sql --remote`;
  const step3Deploy = `npm run build\nnpx wrangler pages deploy dist`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cloudflare Pages &amp; D1 Setup</h3>
              <p className="text-xs text-gray-500">Production deployment instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-gray-700 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-gray-600 leading-relaxed">
            Dasara Zone is fully architected for <strong>Cloudflare Pages</strong> with <strong>Cloudflare D1</strong> (SQLite on Cloudflare's global edge). All Pages Functions, D1 migration files, and wrangler configurations are already generated in this repository.
          </p>

          {/* Step 1 */}
          <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                Step 1: Create your D1 Database in Cloudflare
              </span>
              <button
                onClick={() => copyToClipboard(step1Sql, 'step1')}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'step1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'step1' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-gray-900 text-gray-100 rounded-md text-xs font-mono overflow-x-auto">
              {step1Sql}
            </pre>
            <p className="text-[11px] text-gray-500">
              Wrangler will output a <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">database_id</code>. Paste it into your <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">wrangler.toml</code> file.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                Step 2: Run SQL Schema Migration
              </span>
              <button
                onClick={() => copyToClipboard(step2Sql, 'step2')}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'step2' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'step2' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-gray-900 text-gray-100 rounded-md text-xs font-mono overflow-x-auto">
              {step2Sql}
            </pre>
            <p className="text-[11px] text-gray-500">
              Applies the schema from <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-800">migrations/0001_initial.sql</code> (Games, Participants, Participation with foreign keys &amp; constraints).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                Step 3: Build &amp; Deploy to Cloudflare Pages
              </span>
              <button
                onClick={() => copyToClipboard(step3Deploy, 'step3')}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'step3' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'step3' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2.5 bg-gray-900 text-gray-100 rounded-md text-xs font-mono overflow-x-auto">
              {step3Deploy}
            </pre>
          </div>

          {/* Binding notice */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <p className="font-semibold">Cloudflare Pages Dashboard Binding:</p>
            <p>
              In Cloudflare Pages Dashboard &gt; <strong>Settings</strong> &gt; <strong>Functions</strong> &gt; <strong>D1 database bindings</strong>:
            </p>
            <p className="font-mono bg-white/70 p-1 rounded text-blue-950">
              Variable name: <strong>DB</strong> &rarr; D1 database: <strong>dasara_zone_db</strong>
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
