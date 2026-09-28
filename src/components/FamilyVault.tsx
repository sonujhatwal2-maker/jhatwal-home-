import React, { useState } from 'react';
import { FamilyUser, FamilyMemory, FamilyRule, FamilyChore } from '../types';
import {
  BookOpen,
  ShieldAlert,
  PhoneCall,
  Utensils,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  Info,
  Calendar,
  Lock,
} from 'lucide-react';

interface FamilyVaultProps {
  currentUser: FamilyUser;
  memories: FamilyMemory[];
  rules: FamilyRule[];
  chores: FamilyChore[];
  onAddMemory: (mem: { title: string; category: string; content: string }) => void;
  onDeleteMemory: (id: string) => void;
  onAddChore: (chore: { task: string; assignedTo: string; points: number }) => void;
  onToggleChore: (id: string, done: boolean) => void;
  onDeleteChore: (id: string) => void;
}

export const FamilyVault: React.FC<FamilyVaultProps> = ({
  currentUser,
  memories,
  rules,
  chores,
  onAddMemory,
  onDeleteMemory,
  onAddChore,
  onToggleChore,
  onDeleteChore,
}) => {
  const [activeSection, setActiveSection] = useState<'memories' | 'chores' | 'rules'>('memories');
  const [showAddMemModal, setShowAddMemModal] = useState(false);
  const [showAddChoreModal, setShowAddChoreModal] = useState(false);

  // New Memory Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'dietary' | 'emergency' | 'recipe' | 'note'>('dietary');
  const [newContent, setNewContent] = useState('');

  // New Chore Form State
  const [newTask, setNewTask] = useState('');
  const [newAssignee, setNewAssignee] = useState(currentUser.name);
  const [newPoints, setNewPoints] = useState(15);

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onAddMemory({
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
    });
    setNewTitle('');
    setNewContent('');
    setShowAddMemModal(false);
  };

  const handleCreateChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    onAddChore({
      task: newTask.trim(),
      assignedTo: newAssignee,
      points: Number(newPoints) || 10,
    });
    setNewTask('');
    setShowAddChoreModal(false);
  };

  const totalPoints = chores
    .filter((c) => c.done)
    .reduce((sum, c) => sum + c.points, 0);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'dietary':
        return { label: 'Allergy / Dietary', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: ShieldAlert };
      case 'emergency':
        return { label: 'Emergency / Contact', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: PhoneCall };
      case 'recipe':
        return { label: 'Recipe / Tradition', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: Utensils };
      default:
        return { label: 'Household Note', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Info };
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 text-stone-100">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-400" />
            Jhatwal Home Knowledge Vault & Routines
          </h2>
          <p className="text-stone-400 text-sm mt-0.5">
            The AI automatically reads these items to tailor recipes, safety alerts, homework guidelines, and schedules.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveSection('memories')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSection === 'memories'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Family Notes & Allergies ({memories.length})
          </button>
          <button
            onClick={() => setActiveSection('chores')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSection === 'chores'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Chore Board ({chores.length})
          </button>
          <button
            onClick={() => setActiveSection('rules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeSection === 'rules'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            House Rules ({rules.length})
          </button>
        </div>
      </div>

      {/* SECTION 1: MEMORIES & ALLERGIES */}
      {activeSection === 'memories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Family Knowledge Base ({memories.length} items)
            </span>
            <button
              onClick={() => setShowAddMemModal(true)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Family Note / Allergy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map((mem) => {
              const badge = getCategoryBadge(mem.category);
              const Icon = badge.icon;
              return (
                <div
                  key={mem.id}
                  className="bg-stone-900 border border-stone-800 rounded-3xl p-5 hover:border-stone-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <button
                        onClick={() => onDeleteMemory(mem.id)}
                        className="text-stone-500 hover:text-red-400 p-1 rounded transition cursor-pointer"
                        title="Remove note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-stone-100 mb-2">{mem.title}</h3>
                    <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap">
                      {mem.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
                    <span>Saved by {mem.updatedBy}</span>
                    <span className="text-amber-400/80 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Synced to Gemini
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: CHORE BOARD */}
      {activeSection === 'chores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Family Chore & Reward Board
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⭐ {totalPoints} Total Points Earned!
              </span>
            </div>
            <button
              onClick={() => setShowAddChoreModal(true)}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Chore
            </button>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-6 divide-y divide-stone-800">
            {chores.length === 0 ? (
              <p className="text-center text-sm text-stone-500 py-8">
                No chores assigned yet. Tap "Add Chore" above or ask the AI to generate a chore schedule!
              </p>
            ) : (
              chores.map((chore) => (
                <div
                  key={chore.id}
                  className="py-3.5 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleChore(chore.id, !chore.done)}
                      className="cursor-pointer text-stone-400 hover:text-amber-400 transition shrink-0"
                    >
                      {chore.done ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-600 hover:text-stone-400" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          chore.done ? 'line-through text-stone-500' : 'text-stone-200'
                        }`}
                      >
                        {chore.task}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-stone-400">
                          Assigned to: <strong className="text-amber-400">{chore.assignedTo}</strong>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          +{chore.points} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteChore(chore.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-red-400 p-1.5 rounded transition cursor-pointer"
                    title="Delete chore"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: HOUSE RULES */}
      {activeSection === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Household Routines & House Rules ({rules.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-stone-900 border border-stone-800 rounded-3xl p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {rule.category}
                  </span>
                  <span className="text-[11px] text-stone-500">By {rule.updatedBy}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{rule.title}</h3>
                <p className="text-sm text-stone-300 leading-relaxed">{rule.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddMemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Family Note to AI Memory</h3>
            <p className="text-xs text-stone-400 mb-4">
              Jhatwal Home AI will reference this note whenever answering household questions.
            </p>

            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e: any) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="dietary">Dietary & Allergies</option>
                  <option value="emergency">Emergency / Phone / Medical</option>
                  <option value="recipe">Tradition / Secret Recipe</option>
                  <option value="note">General Household Note / Wi-Fi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1 uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Leo's Peanut Sensitivity or Pet Vet Emergency"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1 uppercase tracking-wider">
                  Details / Instructions
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  placeholder="Detail the allergy, medication, Wi-Fi password, recipe steps, or reminder..."
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemModal(false)}
                  className="px-4 py-2 text-stone-400 hover:text-stone-200 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Save to AI Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Chore Modal */}
      {showAddChoreModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Family Chore</h3>
            <p className="text-xs text-stone-400 mb-4">
              Assign a helpful task to a family member with reward points.
            </p>

            <form onSubmit={handleCreateChore} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1 uppercase tracking-wider">
                  Chore Task
                </label>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="e.g. Feed Barnaby or Pack backpack for school"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1 uppercase tracking-wider">
                  Assign To
                </label>
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="e.g. Kabir, Sunita, Krish, Grandma"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1 uppercase tracking-wider">
                  Reward Points
                </label>
                <input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  min={5}
                  max={100}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChoreModal(false)}
                  className="px-4 py-2 text-stone-400 hover:text-stone-200 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
