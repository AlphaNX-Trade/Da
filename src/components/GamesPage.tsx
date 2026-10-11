import React, { useState } from 'react';
import { Game } from '../types';
import { 
  Trophy, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X,
  Users
} from 'lucide-react';

interface GamesPageProps {
  games: Game[];
  onAddGame: (name: string) => Promise<void>;
  onUpdateGame: (id: string, name: string) => Promise<void>;
  onDeleteGame: (id: string) => Promise<void>;
}

export const GamesPage: React.FC<GamesPageProps> = ({
  games,
  onAddGame,
  onUpdateGame,
  onDeleteGame,
}) => {
  const [newGameName, setNewGameName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Confirmation State
  const [deletingGame, setDeletingGame] = useState<Game | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sampleGames = [
    'Cricket', 'Football', 'Volleyball', 'Kabaddi', 
    'Kho-Kho', 'Badminton', 'Running', 'Long Jump', 'Chess'
  ];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = newGameName.trim();
    if (!trimmed) {
      setFormError('Please enter a game name');
      return;
    }

    // Check duplicate locally
    if (games.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) {
      setFormError(`Game "${trimmed}" already exists.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddGame(trimmed);
      setNewGameName('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to add game');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = async (gameName: string) => {
    if (games.some(g => g.name.toLowerCase() === gameName.toLowerCase())) {
      return;
    }
    try {
      await onAddGame(gameName);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleStartEdit = (game: Game) => {
    setEditingGame(game);
    setEditName(game.name);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('Game name cannot be empty');
      return;
    }

    if (games.some(g => g.id !== editingGame.id && g.name.toLowerCase() === trimmed.toLowerCase())) {
      setEditError(`Another game named "${trimmed}" already exists.`);
      return;
    }

    try {
      setIsSavingEdit(true);
      await onUpdateGame(editingGame.id, trimmed);
      setEditingGame(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update game');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGame) return;
    try {
      setIsDeleting(true);
      await onDeleteGame(deletingGame.id);
      setDeletingGame(null);
    } catch (err: any) {
      alert(`Error deleting game: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered games
  const filteredGames = games.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-blue-600" />
              <span>Manage Games</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Add games once here. Every game automatically appears as a column on the Participation page.
            </p>
          </div>
          <div className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 max-w-sm">
            💡 <span className="font-semibold text-gray-800">Dynamic Columns:</span> Adding a game creates a new column in the checkbox table without affecting existing records.
          </div>
        </div>

        {/* Add Game Form */}
        <form onSubmit={handleAddSubmit} className="mt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={newGameName}
                onChange={(e) => {
                  setNewGameName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Enter new game name (e.g. Cricket, Kabaddi, Chess)..."
                className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  formError ? 'border-red-400 bg-red-50/30' : 'border-gray-300 bg-white'
                }`}
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newGameName.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Game'}</span>
            </button>
          </div>

          {formError && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{formError}</span>
            </p>
          )}

          {/* Quick Suggestions */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-gray-500">
            <span className="font-medium text-gray-600">Quick suggestions:</span>
            {sampleGames.map((sample) => {
              const alreadyAdded = games.some(g => g.name.toLowerCase() === sample.toLowerCase());
              if (alreadyAdded) return null;
              return (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleQuickAdd(sample)}
                  className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                >
                  + {sample}
                </button>
              );
            })}
          </div>
        </form>
      </div>

      {/* Games List & Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Search header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 text-base">
              Saved Games ({games.length})
            </h2>
            {searchQuery && (
              <span className="text-xs text-gray-500">
                (filtered: {filteredGames.length})
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List content */}
        {filteredGames.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            {games.length === 0 ? (
              <div>
                <p className="text-base font-semibold text-gray-700">No games added yet</p>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Type a game name in the box above or click on one of the quick suggestions to get started.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-gray-700">No matching games found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try clearing the search query "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredGames.map((game, index) => (
              <div
                key={game.id}
                className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-xs font-semibold text-gray-400 text-right">
                    {index + 1}.
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                      <span>{game.name}</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
                        <Users className="w-3 h-3 text-gray-500" />
                        {game.participant_count ?? 0} {game.participant_count === 1 ? 'participant' : 'participants'}
                      </span>
                      <span>•</span>
                      <span>Added {new Date(game.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartEdit(game)}
                    className="p-2 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors cursor-pointer"
                    title={`Edit ${game.name}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingGame(game)}
                    className="p-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors cursor-pointer"
                    title={`Delete ${game.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Game Modal */}
      {editingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Edit Game Name</h3>
              <button
                onClick={() => setEditingGame(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Game Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (editError) setEditError(null);
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                {editError && (
                  <p className="mt-1.5 text-xs text-red-600">{editError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Renaming this game updates the column header on the Participation page. All existing participant checkbox selections will remain intact.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGame(null)}
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

      {/* Delete Confirmation Modal */}
      {deletingGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Game?</h3>
            </div>

            <p className="text-sm text-gray-700">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{deletingGame.name}"</span>?
            </p>

            <div className="my-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              ⚠️ <span className="font-semibold">Notice:</span> Deleting this game will permanently remove its column from the Participation page and erase all associated participant selections for this game.
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeletingGame(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Game'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
