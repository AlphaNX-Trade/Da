import React, { useState, useEffect, useCallback } from 'react';
import { Game, Participant, ParticipationRecord, DashboardStats, ActiveTab } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { GamesPage } from './components/GamesPage';
import { ParticipantsPage } from './components/ParticipantsPage';
import { ParticipationPage } from './components/ParticipationPage';
import { ExportModal } from './components/ExportModal';
import { CloudflareModal } from './components/CloudflareModal';
import { Footer } from './components/Footer';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('participation');
  const [games, setGames] = useState<Game[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participation, setParticipation] = useState<ParticipationRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    gamesCount: 0,
    participantsCount: 0,
    selectionsCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [cloudflareModalOpen, setCloudflareModalOpen] = useState(false);

  // Load all data from real persistent database
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedGames, fetchedParticipants, fetchedParticipation, fetchedStats] = await Promise.all([
        api.getGames(),
        api.getParticipants(),
        api.getParticipation(),
        api.getStats(),
      ]);

      setGames(fetchedGames);
      setParticipants(fetchedParticipants);
      setParticipation(fetchedParticipation);
      setStats(fetchedStats);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to connect to database. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recalculate stats helper
  const updateLocalStats = (newGames?: Game[], newParticipants?: Participant[], newParticipation?: ParticipationRecord[]) => {
    setStats({
      gamesCount: newGames ? newGames.length : games.length,
      participantsCount: newParticipants ? newParticipants.length : participants.length,
      selectionsCount: newParticipation ? newParticipation.length : participation.length,
    });
  };

  // Game Handlers
  const handleAddGame = async (name: string) => {
    const created = await api.createGame(name);
    const updatedGames = [...games, created];
    setGames(updatedGames);
    updateLocalStats(updatedGames, undefined, undefined);
  };

  const handleUpdateGame = async (id: string, name: string) => {
    await api.updateGame(id, name);
    setGames(prev => prev.map(g => (g.id === id ? { ...g, name } : g)));
  };

  const handleDeleteGame = async (id: string) => {
    await api.deleteGame(id);
    const updatedGames = games.filter(g => g.id !== id);
    const updatedParticipation = participation.filter(p => p.game_id !== id);
    setGames(updatedGames);
    setParticipation(updatedParticipation);
    updateLocalStats(updatedGames, undefined, updatedParticipation);
  };

  // Participant Handlers
  const handleAddParticipant = async (data: { name: string; age: number; class: string; section?: string | null }) => {
    const created = await api.createParticipant(data);
    const updatedParticipants = [...participants, created];
    setParticipants(updatedParticipants);
    updateLocalStats(undefined, updatedParticipants, undefined);
  };

  const handleUpdateParticipant = async (id: string, data: { name: string; age: number; class: string; section?: string | null }) => {
    const updated = await api.updateParticipant(id, data);
    setParticipants(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
  };

  const handleDeleteParticipant = async (id: string) => {
    await api.deleteParticipant(id);
    const updatedParticipants = participants.filter(p => p.id !== id);
    const updatedParticipation = participation.filter(p => p.participant_id !== id);
    setParticipants(updatedParticipants);
    setParticipation(updatedParticipation);
    updateLocalStats(undefined, updatedParticipants, updatedParticipation);
  };

  // Participation Toggle Handler
  const handleToggleParticipation = async (participantId: string, gameId: string, selected: boolean) => {
    // 1. Optimistic update
    let nextParticipation: ParticipationRecord[];
    if (selected) {
      const tempRecord: ParticipationRecord = {
        id: `temp_${Date.now()}`,
        participant_id: participantId,
        game_id: gameId,
        created_at: new Date().toISOString(),
      };
      nextParticipation = [...participation, tempRecord];
    } else {
      nextParticipation = participation.filter(
        p => !(p.participant_id === participantId && p.game_id === gameId)
      );
    }

    setParticipation(nextParticipation);
    updateLocalStats(undefined, undefined, nextParticipation);

    // 2. Database call
    try {
      const response = await api.toggleParticipation(participantId, gameId, selected);
      
      // Update with server confirmed record if returned
      if (selected && response.selected) {
        // Reload participation in background to get canonical database IDs
        api.getParticipation().then(canonical => {
          setParticipation(canonical);
          updateLocalStats(undefined, undefined, canonical);
        });
      }
    } catch (err: any) {
      // Revert optimistic update on failure
      setParticipation(participation);
      updateLocalStats(undefined, undefined, participation);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        loading={loading}
        onRefresh={loadData}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenCloudflare={() => setCloudflareModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Connection Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Database Connection Error</h3>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* View Switcher */}
        {activeTab === 'participation' && (
          <ParticipationPage
            games={games}
            participants={participants}
            participation={participation}
            onToggleParticipation={handleToggleParticipation}
            onOpenExport={() => setExportModalOpen(true)}
            onNavigateToGames={() => setActiveTab('games')}
            onNavigateToParticipants={() => setActiveTab('participants')}
            onAddParticipant={handleAddParticipant}
            onUpdateParticipant={handleUpdateParticipant}
          />
        )}

        {activeTab === 'games' && (
          <GamesPage
            games={games}
            onAddGame={handleAddGame}
            onUpdateGame={handleUpdateGame}
            onDeleteGame={handleDeleteGame}
          />
        )}

        {activeTab === 'participants' && (
          <ParticipantsPage
            participants={participants}
            onAddParticipant={handleAddParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            onDeleteParticipant={handleDeleteParticipant}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onOpenCloudflare={() => setCloudflareModalOpen(true)} />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        games={games}
        participants={participants}
        participation={participation}
      />

      {/* Cloudflare Documentation Modal */}
      <CloudflareModal
        isOpen={cloudflareModalOpen}
        onClose={() => setCloudflareModalOpen(false)}
      />
    </div>
  );
}
