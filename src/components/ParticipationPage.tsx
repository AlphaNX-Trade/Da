import React, { useState, useMemo } from 'react';
import { Game, Participant, ParticipationRecord, STANDARD_CLASSES } from '../types';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  X, 
  AlertCircle, 
  Check, 
  Loader2, 
  RefreshCw, 
  Download, 
  Users, 
  Trophy,
  SlidersHorizontal,
  UserPlus,
  Edit3,
  AlertTriangle
} from 'lucide-react';

interface ParticipationPageProps {
  games: Game[];
  participants: Participant[];
  participation: ParticipationRecord[];
  onToggleParticipation: (participantId: string, gameId: string, selected: boolean) => Promise<void>;
  onOpenExport: () => void;
  onNavigateToGames: () => void;
  onNavigateToParticipants: () => void;
  onAddParticipant: (data: { name: string; age: number; class: string; section?: string | null }) => Promise<void>;
  onUpdateParticipant: (id: string, data: { name: string; age: number; class: string; section?: string | null }) => Promise<void>;
}

export const ParticipationPage: React.FC<ParticipationPageProps> = ({
  games,
  participants,
  participation,
  onToggleParticipation,
  onOpenExport,
  onNavigateToGames,
  onNavigateToParticipants,
  onAddParticipant,
  onUpdateParticipant,
}) => {
  // Search & Filter States
  const [searchName, setSearchName] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ALL');
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);

  // Cell-level asynchronous state tracking
  // Key: `${participantId}_${gameId}` => 'idle' | 'saving' | 'error'
  const [cellStatus, setCellStatus] = useState<Record<string, 'saving' | 'error'>>({});
  const [lastSavedCell, setLastSavedCell] = useState<string | null>(null);
  const [lastErrorMsg, setLastErrorMsg] = useState<string | null>(null);

  // Add Participant Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAge, setAddAge] = useState('');
  const [addClass, setAddClass] = useState<string>('10th Standard');
  const [addCustomClass, setAddCustomClass] = useState('');
  const [addSection, setAddSection] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  // Duplicate Warning Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<{
    pendingData: { name: string; age: number; class: string; section?: string | null };
    existingMatch: Participant;
  } | null>(null);

  // Edit Participant Modal State
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editClass, setEditClass] = useState<string>('10th Standard');
  const [editCustomClass, setEditCustomClass] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Quick lookup set for current confirmed selections
  const participationSet = useMemo(() => {
    const set = new Set<string>();
    for (const record of participation) {
      set.add(`${record.participant_id}_${record.game_id}`);
    }
    return set;
  }, [participation]);

  // Participation count by participant
  const countByParticipant = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const record of participation) {
      counts[record.participant_id] = (counts[record.participant_id] || 0) + 1;
    }
    return counts;
  }, [participation]);

  // Participation count by game
  const countByGame = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const record of participation) {
      counts[record.game_id] = (counts[record.game_id] || 0) + 1;
    }
    return counts;
  }, [participation]);

  // Classes for filter dropdown: all standard classes plus any existing DB classes
  const filterClassOptions = useMemo(() => {
    const list: string[] = [];
    for (const c of STANDARD_CLASSES) {
      if (c !== 'Other') list.push(c);
    }
    for (const p of participants) {
      if (p.class && !list.includes(p.class)) {
        list.push(p.class);
      }
    }
    return list;
  }, [participants]);

  // Filtered participants
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // Name filter
      if (searchName.trim() && !p.name.toLowerCase().includes(searchName.toLowerCase().trim())) {
        return false;
      }

      // Class filter
      if (selectedClass !== 'ALL' && p.class.toLowerCase() !== selectedClass.toLowerCase()) {
        return false;
      }

      // Game filter (show only participants playing specific game)
      if (selectedGameFilter !== 'ALL') {
        const isSelected = participationSet.has(`${p.id}_${selectedGameFilter}`);
        if (!isSelected) return false;
      }

      // Unassigned filter (participants who have 0 games)
      if (onlyUnassigned) {
        const count = countByParticipant[p.id] || 0;
        if (count > 0) return false;
      }

      return true;
    });
  }, [participants, searchName, selectedClass, selectedGameFilter, onlyUnassigned, participationSet, countByParticipant]);

  const hasActiveFilters = searchName !== '' || selectedClass !== 'ALL' || selectedGameFilter !== 'ALL' || onlyUnassigned;

  const handleClearFilters = () => {
    setSearchName('');
    setSelectedClass('ALL');
    setSelectedGameFilter('ALL');
    setOnlyUnassigned(false);
  };

  // Toggle Checkbox handler with optimistic update & database confirmation
  const handleToggle = async (participantId: string, gameId: string, currentSelected: boolean) => {
    const cellKey = `${participantId}_${gameId}`;
    const nextSelected = !currentSelected;

    // Set cell saving status
    setCellStatus(prev => ({ ...prev, [cellKey]: 'saving' }));
    setLastErrorMsg(null);

    try {
      await onToggleParticipation(participantId, gameId, nextSelected);

      // Successfully saved to database
      setCellStatus(prev => {
        const updated = { ...prev };
        delete updated[cellKey];
        return updated;
      });

      // Brief confirmed indicator
      setLastSavedCell(cellKey);
      setTimeout(() => {
        setLastSavedCell(prev => (prev === cellKey ? null : prev));
      }, 1800);
    } catch (err: any) {
      // Failed to save
      console.error('Failed to toggle participation:', err);
      setCellStatus(prev => ({ ...prev, [cellKey]: 'error' }));
      setLastErrorMsg(err.message || 'Failed to save to database. Tap the box to retry.');
    }
  };

  // Add Participant Submit Handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const trimmedName = addName.trim();
    if (!trimmedName) {
      setAddError('Participant name is required.');
      return;
    }

    const parsedAge = parseInt(addAge, 10);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      setAddError('Please enter a valid age (positive whole number).');
      return;
    }

    const effectiveClass = addClass === 'Other' ? addCustomClass.trim() : addClass.trim();
    if (!effectiveClass) {
      setAddError('Class is required.');
      return;
    }

    const trimmedSection = addSection.trim() || null;

    const payload = {
      name: trimmedName,
      age: parsedAge,
      class: effectiveClass,
      section: trimmedSection,
    };

    // Check potential duplicate participant (same name and class)
    const existing = participants.find(
      p => p.name.toLowerCase() === trimmedName.toLowerCase() && p.class.toLowerCase() === effectiveClass.toLowerCase()
    );

    if (existing) {
      setDuplicateWarning({
        pendingData: payload,
        existingMatch: existing,
      });
      return;
    }

    await executeAddParticipant(payload);
  };

  const executeAddParticipant = async (payload: { name: string; age: number; class: string; section?: string | null }) => {
    try {
      setIsSavingAdd(true);
      await onAddParticipant(payload);
      // Reset form and close modal
      setAddName('');
      setAddAge('');
      setAddSection('');
      if (addClass === 'Other') setAddCustomClass('');
      setDuplicateWarning(null);
      setIsAddModalOpen(false);
    } catch (err: any) {
      setAddError(err.message || 'Failed to save participant to database');
    } finally {
      setIsSavingAdd(false);
    }
  };

  // Edit Participant Handlers
  const handleStartEdit = (p: Participant) => {
    setEditingParticipant(p);
    setEditName(p.name);
    setEditAge(p.age.toString());

    const isStandard = (STANDARD_CLASSES as readonly string[]).includes(p.class) && p.class !== 'Other';
    if (isStandard) {
      setEditClass(p.class);
      setEditCustomClass('');
    } else {
      const legacyMap: Record<string, string> = {
        '8th': '8th Standard',
        '9th': '9th Standard',
        '10th': '10th Standard',
        '11th': '11th Standard',
        '12th': '12th Standard',
        '1st': '1st Standard',
        '2nd': '2nd Standard',
        '3rd': '3rd Standard',
        '4th': '4th Standard',
        '5th': '5th Standard',
        '6th': '6th Standard',
        '7th': '7th Standard',
      };
      if (legacyMap[p.class]) {
        setEditClass(legacyMap[p.class]);
        setEditCustomClass('');
      } else {
        setEditClass('Other');
        setEditCustomClass(p.class);
      }
    }
    setEditSection(p.section || '');
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setEditError('Participant name is required.');
      return;
    }

    const parsedAge = parseInt(editAge, 10);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      setEditError('Please enter a valid age (positive whole number).');
      return;
    }

    const effectiveClass = editClass === 'Other' ? editCustomClass.trim() : editClass.trim();
    if (!effectiveClass) {
      setEditError('Class is required.');
      return;
    }

    const trimmedSection = editSection.trim() || null;

    try {
      setIsSavingEdit(true);
      await onUpdateParticipant(editingParticipant.id, {
        name: trimmedName,
        age: parsedAge,
        class: effectiveClass,
        section: trimmedSection,
      });
      setEditingParticipant(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update participant');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const isAnySaving = Object.values(cellStatus).some(status => status === 'saving');
  const errorCount = Object.values(cellStatus).filter(status => status === 'error').length;

  return (
    <div className="space-y-5">
      {/* Top Description & Actions Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-blue-600" />
                <span>Participation Matrix</span>
              </h1>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-semibold">
                Auto-Saving
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Tick checkboxes to assign participants to games. Every selection saves immediately to the database.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Real-time saving status badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium">
              {isAnySaving ? (
                <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50/50">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Saving to database...</span>
                </span>
              ) : errorCount > 0 ? (
                <span className="flex items-center gap-1.5 text-red-700 bg-red-50/50">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>{errorCount} unsaved (tap cell to retry)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>All changes saved to database</span>
                </span>
              )}
            </div>

            {/* + Add Participant Primary Action Button */}
            <button
              onClick={() => {
                setAddError(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Add a new participant row to the table"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Participant</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Global error banner if saving failed */}
        {lastErrorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{lastErrorMsg}</span>
            </div>
            <button
              onClick={() => setLastErrorMsg(null)}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search participant by name */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search participant..."
                className="w-full pl-9 pr-7 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchName && (
                <button
                  onClick={() => setSearchName('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter by class */}
            <div className="flex items-center gap-1">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Classes</option>
                {filterClassOptions.map((c) => (
                  <option key={c} value={c}>Class: {c}</option>
                ))}
              </select>
            </div>

            {/* Filter by game */}
            <div className="flex items-center gap-1">
              <select
                value={selectedGameFilter}
                onChange={(e) => setSelectedGameFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Games</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>Only in: {g.name}</option>
                ))}
              </select>
            </div>

            {/* Unassigned toggle */}
            <button
              onClick={() => setOnlyUnassigned(!onlyUnassigned)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                onlyUnassigned
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{onlyUnassigned ? '☑' : '☐'}</span>
              <span>No Games Selected (0)</span>
            </button>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 text-right shrink-0">
            Showing <span className="font-semibold text-gray-800">{filteredParticipants.length}</span> of {participants.length} participants across <span className="font-semibold text-gray-800">{games.length}</span> games
          </div>
        </div>
      </div>

      {/* Main Dynamic Table Container */}
      {games.length === 0 || participants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center shadow-xs">
          {games.length === 0 && participants.length === 0 ? (
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <CheckSquare className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Get Started with Dasara Zone</h2>
              <p className="text-sm text-gray-600">
                To build your participation matrix, add your games and participants first.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2.5 pt-2">
                <button
                  onClick={onNavigateToGames}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  <span>1. Add Games</span>
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>2. + Add Participant</span>
                </button>
              </div>
            </div>
          ) : games.length === 0 ? (
            <div className="max-w-md mx-auto space-y-3">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto" />
              <h2 className="text-lg font-bold text-gray-900">No Games Added Yet</h2>
              <p className="text-sm text-gray-600">
                You have {participants.length} participants ready. Add games to create checkbox columns.
              </p>
              <button
                onClick={onNavigateToGames}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Go to Games Page</span>
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-3">
              <Users className="w-12 h-12 text-gray-300 mx-auto" />
              <h2 className="text-lg font-bold text-gray-900">No Participants Added Yet</h2>
              <p className="text-sm text-gray-600">
                You have {games.length} games configured. Click below to add participants and start ticking checkboxes.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Participant</span>
              </button>
            </div>
          )}
        </div>
      ) : filteredParticipants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-xs">
          <p className="text-base font-semibold text-gray-800">No participants match your filter criteria</p>
          <p className="text-sm text-gray-500 mt-1">Try clearing or adjusting the search and filters.</p>
          <button
            onClick={handleClearFilters}
            className="mt-3 px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Table information bar */}
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">Participation Matrix</span>
              <span className="text-gray-300">•</span>
              <span>{participants.length} participants • {games.length} games</span>
            </div>
            <div className="text-xs text-gray-400 font-medium">
              <span>Swipe or scroll to navigate</span>
            </div>
          </div>

          {/* Dedicated Table Wrapper: Horizontal touch swipe and natural vertical page flow */}
          <div 
            className="table-scroll-wrapper overflow-x-auto relative custom-scrollbar w-full"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'auto',
              overscrollBehaviorX: 'contain'
            }}
          >
            <table 
              className="w-full min-w-max text-left text-sm border-separate border-spacing-0"
              style={{ minWidth: 'max-content' }}
            >
              <thead className="bg-gray-100 text-xs font-semibold text-gray-700">
                <tr className="bg-gray-100 text-xs font-semibold text-gray-700">
                  {/* Sticky top-left corner index */}
                  <th scope="col" className="w-12 min-w-[48px] max-w-[48px] py-3 px-2 text-center sticky top-0 left-0 z-40 bg-gray-100 border-b border-r border-gray-200 shadow-xs">
                    #
                  </th>
                  {/* Sticky top-left corner Participant Name */}
                  <th scope="col" className="min-w-[170px] max-w-[220px] py-3 px-4 text-left sticky top-0 left-[48px] z-40 bg-gray-100 border-b border-r-2 border-gray-300 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    Participant Name
                  </th>
                  <th scope="col" className="w-16 min-w-[64px] py-3 px-3 text-center sticky top-0 z-30 bg-gray-100 border-b border-r border-gray-200">
                    Age
                  </th>
                  <th scope="col" className="w-28 min-w-[110px] py-3 px-3 text-center sticky top-0 z-30 bg-gray-100 border-b border-r border-gray-200">
                    Class
                  </th>
                  <th scope="col" className="w-14 min-w-[56px] py-3 px-3 text-center sticky top-0 z-30 bg-gray-100 border-b border-r border-gray-200">
                    Sec
                  </th>

                  {/* Dynamic Sticky Game Columns */}
                  {games.map((game) => {
                    const participantTotal = countByGame[game.id] || 0;
                    return (
                      <th
                        key={game.id}
                        scope="col"
                        className="w-32 min-w-[130px] max-w-[160px] py-3 px-3 text-center sticky top-0 z-30 bg-gray-100 border-b border-r border-gray-200 hover:bg-gray-200/60 transition-colors"
                      >
                        <div className="font-bold text-gray-900 truncate" title={game.name}>
                          {game.name}
                        </div>
                        <div className="mt-0.5">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {participantTotal} {participantTotal === 1 ? 'player' : 'players'}
                          </span>
                        </div>
                      </th>
                    );
                  })}

                  {/* Total Selections Column */}
                  <th scope="col" className="w-28 min-w-[110px] py-3 px-4 text-center sticky top-0 z-30 bg-gray-100 font-bold text-gray-800 border-b border-gray-200">
                    Total Games
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {filteredParticipants.map((participant, pIndex) => {
                  const assignedCount = countByParticipant[participant.id] || 0;

                  return (
                    <tr
                      key={participant.id}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      {/* Sticky Index */}
                      <td className="w-12 min-w-[48px] max-w-[48px] py-2.5 px-2 text-center text-xs text-gray-400 font-medium sticky left-0 z-10 bg-white group-hover:bg-blue-50/40 border-b border-r border-gray-200">
                        {pIndex + 1}
                      </td>

                      {/* Sticky Participant Name + Quick Edit Button */}
                      <td className="min-w-[170px] max-w-[220px] py-2.5 px-4 font-semibold text-gray-900 sticky left-[48px] z-10 bg-white group-hover:bg-blue-50/40 border-b border-r-2 border-gray-300 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate max-w-[130px]" title={participant.name}>
                            {participant.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(participant)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                            title={`Edit ${participant.name}'s details`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Age */}
                      <td className="w-16 min-w-[64px] py-2.5 px-3 text-center text-xs text-gray-600 border-b border-r border-gray-200 bg-white group-hover:bg-blue-50/20">
                        {participant.age}
                      </td>

                      {/* Class */}
                      <td className="w-28 min-w-[110px] py-2.5 px-3 text-center border-b border-r border-gray-200 bg-white group-hover:bg-blue-50/20">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 truncate max-w-[95px]" title={participant.class}>
                          {participant.class}
                        </span>
                      </td>

                      {/* Section */}
                      <td className="w-14 min-w-[56px] py-2.5 px-3 text-center text-xs text-gray-500 border-b border-r border-gray-200 bg-white group-hover:bg-blue-50/20">
                        {participant.section || '—'}
                      </td>

                      {/* Checkbox columns for every game */}
                      {games.map((game) => {
                        const cellKey = `${participant.id}_${game.id}`;
                        const isChecked = participationSet.has(cellKey);
                        const status = cellStatus[cellKey];
                        const isSaving = status === 'saving';
                        const isError = status === 'error';
                        const justSaved = lastSavedCell === cellKey;

                        return (
                          <td
                            key={game.id}
                            className={`w-32 min-w-[130px] max-w-[160px] py-2 px-3 text-center border-b border-r border-gray-200 transition-colors ${
                              isChecked ? 'bg-blue-50/30' : 'bg-white group-hover:bg-blue-50/20'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {/* Large touch-friendly checkbox button */}
                              <button
                                type="button"
                                onClick={() => handleToggle(participant.id, game.id, isChecked)}
                                disabled={isSaving}
                                aria-label={`${isChecked ? 'Unassign' : 'Assign'} ${participant.name} for ${game.name}`}
                                className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                                  isChecked
                                    ? 'bg-blue-600 text-white shadow-xs border-2 border-blue-600 hover:bg-blue-700'
                                    : 'bg-white text-transparent border-2 border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                } ${
                                  isError
                                    ? 'ring-2 ring-red-500 border-red-500 bg-red-50'
                                    : ''
                                } ${
                                  isSaving ? 'opacity-70 cursor-wait' : ''
                                }`}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                ) : isError ? (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                ) : isChecked ? (
                                  <Check className="w-5 h-5 stroke-[2.75]" />
                                ) : (
                                  <span className="w-3 h-3 block opacity-0"></span>
                                )}

                                {/* Subtle flash badge on save confirmation */}
                                {justSaved && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-ping"></span>
                                )}
                              </button>
                            </div>
                          </td>
                        );
                      })}

                      {/* Participant Total Games Summary Badge */}
                      <td className="w-28 min-w-[110px] py-2.5 px-4 text-center border-b border-gray-200 bg-white group-hover:bg-blue-50/20">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            assignedCount > 0
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {assignedCount} {assignedCount === 1 ? 'game' : 'games'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-blue-600 inline-block"></span>
                <span>Checked = Participating</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-gray-300 bg-white inline-block"></span>
                <span>Unchecked = Not Participating</span>
              </span>
            </div>
            <div className="font-medium text-gray-700">
              Total Participations Assigned: <span className="font-bold text-blue-700">{participation.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Participant Modal (Triggered by "+ Add Participant" above the table) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Add Participant</h3>
                  <p className="text-xs text-gray-500">New row will be added to the Participation table</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddError(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Participant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => {
                    setAddName(e.target.value);
                    if (addError) setAddError(null);
                  }}
                  placeholder="Enter full name..."
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  autoFocus
                  disabled={isSavingAdd}
                />
              </div>

              {/* Age and Section Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={addAge}
                    onChange={(e) => {
                      setAddAge(e.target.value);
                      if (addError) setAddError(null);
                    }}
                    placeholder="e.g. 15"
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    disabled={isSavingAdd}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Section (optional)
                  </label>
                  <input
                    type="text"
                    value={addSection}
                    onChange={(e) => setAddSection(e.target.value)}
                    placeholder="A, B, C..."
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    disabled={isSavingAdd}
                  />
                </div>
              </div>

              {/* Class Field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={addClass}
                    onChange={(e) => setAddClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    disabled={isSavingAdd}
                  >
                    {STANDARD_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {addClass === 'Other' && (
                    <input
                      type="text"
                      value={addCustomClass}
                      onChange={(e) => setAddCustomClass(e.target.value)}
                      placeholder="Class name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSavingAdd}
                    />
                  )}
                </div>
              </div>

              {addError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <p className="text-xs text-gray-500">
                Saving will create a new row with checkboxes for all {games.length} games and persist it to the database.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSavingAdd}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAdd || !addName.trim() || !addAge}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingAdd ? 'Saving...' : 'Save Participant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Warning Dialog */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Possible Duplicate Participant</h3>
            </div>

            <p className="text-sm text-gray-700">
              A participant named <span className="font-bold text-gray-900">"{duplicateWarning.pendingData.name}"</span> in Class <span className="font-bold text-gray-900">{duplicateWarning.pendingData.class}</span> already exists.
            </p>

            <div className="my-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <p>Existing record:</p>
              <p className="font-medium">
                • {duplicateWarning.existingMatch.name} (Age: {duplicateWarning.existingMatch.age}, Class: {duplicateWarning.existingMatch.class}, Sec: {duplicateWarning.existingMatch.section || 'None'})
              </p>
              <p className="pt-1 text-amber-700">
                If this is a different student with the same name, you can still proceed.
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeAddParticipant(duplicateWarning.pendingData)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Add Anyway</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Participant Modal (Allows editing participant details right from the matrix) */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Edit Participant</h3>
                  <p className="text-xs text-gray-500">Update details without affecting checkboxes</p>
                </div>
              </div>
              <button
                onClick={() => setEditingParticipant(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    placeholder="A, B, C..."
                    className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {STANDARD_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {editClass === 'Other' && (
                    <input
                      type="text"
                      value={editCustomClass}
                      onChange={(e) => setEditCustomClass(e.target.value)}
                      placeholder="Class name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  )}
                </div>
              </div>

              {editError && (
                <p className="text-xs text-red-600">{editError}</p>
              )}

              <p className="text-xs text-gray-500">
                Updating details will automatically sync across the table. All game checkboxes remain unchanged.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
