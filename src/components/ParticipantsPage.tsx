import React, { useState, useMemo } from 'react';
import { Participant, STANDARD_CLASSES } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X,
  Filter,
  Trophy
} from 'lucide-react';

interface ParticipantsPageProps {
  participants: Participant[];
  onAddParticipant: (data: { name: string; age: number; class: string; section?: string | null }) => Promise<void>;
  onUpdateParticipant: (id: string, data: { name: string; age: number; class: string; section?: string | null }) => Promise<void>;
  onDeleteParticipant: (id: string) => Promise<void>;
}

export const ParticipantsPage: React.FC<ParticipantsPageProps> = ({
  participants,
  onAddParticipant,
  onUpdateParticipant,
  onDeleteParticipant,
}) => {
  // Add Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('10th Standard');
  const [customClass, setCustomClass] = useState('');
  const [section, setSection] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Duplicate Warning Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<{
    pendingData: { name: string; age: number; class: string; section?: string | null };
    existingMatch: Participant;
  } | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('ALL');

  // Edit Modal State
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editClass, setEditClass] = useState<string>('10th Standard');
  const [editCustomClass, setEditCustomClass] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Confirmation State
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Participant name is required.');
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 120) {
      setFormError('Please enter a valid age (positive whole number).');
      return;
    }

    const effectiveClass = selectedClass === 'Other' ? customClass.trim() : selectedClass.trim();
    if (!effectiveClass) {
      setFormError('Class is required.');
      return;
    }

    const trimmedSection = section.trim() || null;

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
      // Trigger duplicate warning modal
      setDuplicateWarning({
        pendingData: payload,
        existingMatch: existing,
      });
      return;
    }

    // Proceed to create
    await executeAdd(payload);
  };

  const executeAdd = async (payload: { name: string; age: number; class: string; section?: string | null }) => {
    try {
      setIsSubmitting(true);
      await onAddParticipant(payload);
      // Reset form
      setName('');
      setAge('');
      setSection('');
      if (selectedClass === 'Other') setCustomClass('');
      setDuplicateWarning(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add participant');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleConfirmDelete = async () => {
    if (!deletingParticipant) return;
    try {
      setIsDeleting(true);
      await onDeleteParticipant(deletingParticipant.id);
      setDeletingParticipant(null);
    } catch (err: any) {
      alert(`Error deleting participant: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered participants
  const filteredParticipants = participants.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesClass = filterClass === 'ALL' || p.class.toLowerCase() === filterClass.toLowerCase();
    return matchesQuery && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Add Participant Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Manage Participants</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Add people once here. Each person automatically appears as a row on the Participation page.
            </p>
          </div>
          <div className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 max-w-sm">
            💡 <span className="font-semibold text-gray-800">Automatic Rows:</span> Add once, then check their games on the Participation matrix.
          </div>
        </div>

        {/* Add Participant Form */}
        <form onSubmit={handleFormSubmit} className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Name */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Participant Name (e.g. Alpha, Rahul)"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={isSubmitting}
              />
            </div>

            {/* Age */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g. 15"
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={isSubmitting}
              />
            </div>

            {/* Class */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  disabled={isSubmitting}
                >
                  {STANDARD_CLASSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {selectedClass === 'Other' && (
                  <input
                    type="text"
                    value={customClass}
                    onChange={(e) => setCustomClass(e.target.value)}
                    placeholder="Class name"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />
                )}
              </div>
            </div>

            {/* Section */}
            <div className="lg:col-span-1">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Sec
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="A, B..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !age}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer h-10"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Adding...' : 'Add Person'}</span>
              </button>
            </div>
          </div>

          {formError && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{formError}</span>
            </p>
          )}
        </form>
      </div>

      {/* Participants List & Filter Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Search and Filters Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 text-base">
              Participant Records ({participants.length})
            </h2>
            {(searchQuery || filterClass !== 'ALL') && (
              <span className="text-xs text-gray-500">
                (filtered: {filteredParticipants.length})
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Filter by class */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full sm:w-36 px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Classes</option>
                {filterClassOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
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
        </div>

        {/* Table / List */}
        {filteredParticipants.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            {participants.length === 0 ? (
              <div>
                <p className="text-base font-semibold text-gray-700">No participants added yet</p>
                <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Fill in the name, age, and class in the form above to add your first participant.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-base font-semibold text-gray-700">No matching participants found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting or clearing your search and class filters.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterClass('ALL'); }}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="table-scroll-wrapper overflow-x-auto custom-scrollbar w-full" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'auto' }}>
            <table className="w-full min-w-[650px] text-left text-sm text-gray-700">
              <thead className="bg-gray-100/75 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="py-3 px-4 w-12 text-center">#</th>
                  <th scope="col" className="py-3 px-4">Name</th>
                  <th scope="col" className="py-3 px-4">Age</th>
                  <th scope="col" className="py-3 px-4">Class</th>
                  <th scope="col" className="py-3 px-4">Section</th>
                  <th scope="col" className="py-3 px-4">Games Assigned</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredParticipants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 text-center text-xs text-gray-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {p.age} yrs
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {p.class}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {p.section ? (
                        <span className="font-medium text-gray-800">{p.section}</span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        <Trophy className="w-3 h-3 text-gray-500" />
                        {p.games_count ?? 0} {p.games_count === 1 ? 'game' : 'games'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors cursor-pointer"
                          title="Edit participant"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingParticipant(p)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors cursor-pointer"
                          title="Delete participant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              A participant named <span className="font-bold text-gray-900">"{duplicateWarning.pendingData.name}"</span> in Class <span className="font-bold text-gray-900">{duplicateWarning.pendingData.class}</span> already exists in the records.
            </p>

            <div className="my-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
              <p>Existing record:</p>
              <p className="font-medium">
                • {duplicateWarning.existingMatch.name} (Age: {duplicateWarning.existingMatch.age}, Class: {duplicateWarning.existingMatch.class}, Sec: {duplicateWarning.existingMatch.section || 'None'})
              </p>
              <p className="pt-1 text-amber-700">
                If this is a different student with the same name, you can still add them.
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
                onClick={() => executeAdd(duplicateWarning.pendingData)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Add Anyway</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Participant Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Edit Participant Details</h3>
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
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Updating details will automatically sync across the Participation table without losing any checked games.
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

      {/* Delete Confirmation Modal */}
      {deletingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Participant?</h3>
            </div>

            <p className="text-sm text-gray-700">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{deletingParticipant.name}"</span> (Class {deletingParticipant.class})?
            </p>

            <div className="my-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              ⚠️ <span className="font-semibold">Notice:</span> Deleting this participant will remove their row from the Participation page and delete all of their game participation records.
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeletingParticipant(null)}
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
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Person'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
