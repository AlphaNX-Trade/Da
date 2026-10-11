import React from 'react';
import { ActiveTab, DashboardStats } from '../types';
import { 
  Trophy, 
  Users, 
  CheckSquare, 
  Download, 
  Cloud, 
  Menu, 
  X,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats: DashboardStats;
  loading: boolean;
  onRefresh: () => void;
  onOpenExport: () => void;
  onOpenCloudflare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  loading,
  onRefresh,
  onOpenExport,
  onOpenCloudflare,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'participation' as ActiveTab, label: 'Participation', icon: CheckSquare, desc: 'Matrix & Checkboxes' },
    { id: 'games' as ActiveTab, label: 'Games', icon: Trophy, desc: 'Manage Game Names' },
    { id: 'participants' as ActiveTab, label: 'Participants', icon: Users, desc: 'Manage People' },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Branding & Main Navigation Bar */}
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl sm:text-2xl tracking-tight text-gray-900">
                  DASARA ZONE
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  v1.0
                </span>
              </div>
              <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                <span>Games & Participation Management</span>
                <span className="text-gray-300">•</span>
                <span className="text-blue-600 font-semibold">Alpha</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-xs border border-gray-200/80'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh all data"
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={onOpenExport}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-gray-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenCloudflare}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              title="Cloudflare Pages & D1 Deployment Guide"
            >
              <Cloud className="w-4 h-4" />
              <span>Cloudflare D1</span>
            </button>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 border border-gray-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Dashboard Stats Row */}
        <div className="py-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-600">
              <span className="font-medium text-gray-500">Total Games:</span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {stats.gamesCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-600">
              <span className="font-medium text-gray-500">Total Participants:</span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {stats.participantsCount}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-600">
              <span className="font-medium text-gray-500">Participation Selections:</span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {stats.selectionsCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span className="hidden sm:inline">Database: Connected &amp; Persistent</span>
            <span className="sm:hidden">DB Active</span>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-200 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-xs font-normal text-gray-400">{item.desc}</span>
                </button>
              );
            })}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenExport(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenCloudflare(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloudflare D1</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
