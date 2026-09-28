import React, { useState } from 'react';
import { FamilyUser, AIMode } from '../types';
import {
  Utensils,
  GraduationCap,
  Sparkles,
  BookOpen,
  Compass,
  ArrowRight,
  Send,
  Check,
  Copy,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface FamilyToolsProps {
  currentUser: FamilyUser;
  onSendToChat: (prompt: string, mode: AIMode) => void;
}

export const FamilyTools: React.FC<FamilyToolsProps> = ({ currentUser, onSendToChat }) => {
  const [activeTool, setActiveTool] = useState<'chef' | 'homework' | 'story' | 'trip'>('chef');

  // Chef state
  const [ingredients, setIngredients] = useState('Chicken breasts, pasta, broccoli, garlic, olive oil, lemon');
  const [cookTime, setCookTime] = useState('30 mins');
  const [mealType, setMealType] = useState('Weeknight Dinner');

  // Homework state
  const [subject, setSubject] = useState('Math');
  const [gradeLevel, setGradeLevel] = useState('5th Grade');
  const [question, setQuestion] = useState('How do I add fractions with different denominators like 1/3 + 2/5?');

  // Story state
  const [childName, setChildName] = useState(currentUser.role === 'kid' ? currentUser.name : 'Kabir');
  const [storyTheme, setStoryTheme] = useState('Space Exploration with Pet Dog Barnaby');
  const [storyMoral, setStoryMoral] = useState('Courage and curiosity when trying new things');

  // Trip state
  const [destination, setDestination] = useState('Nearby weekend nature reserve or state park');
  const [tripDuration, setTripDuration] = useState('Saturday Day Trip');
  const [tripVibe, setTripVibe] = useState('Kid-friendly easy hiking, picnic, playground, stroller-safe');

  const handleLaunchChef = () => {
    const prompt = `[PANTRY MAGIC CHEF]
I have the following ingredients available in our kitchen: "${ingredients}".
Target cooking time: ${cookTime}.
Meal type: ${mealType}.

Please craft a delicious, comforting recipe for our family that strictly adheres to our household allergy rules (tree-nut/peanut safe for Kabir).
Include:
1. Recipe Name
2. Prep & Cook time
3. Ingredients list with exact measurements
4. Clear step-by-step instructions
5. Kid-friendly serving suggestion`;
    onSendToChat(prompt, 'general');
  };

  const handleLaunchHomework = () => {
    const prompt = `[SOCRATIC HOMEWORK TUTOR]
Subject: ${subject}
Grade Level: ${gradeLevel}
Student: ${currentUser.role === 'kid' ? currentUser.name : 'Kabir'}

Homework Question / Problem:
"${question}"

Please guide me through solving this step-by-step using the Socratic method.
Do NOT simply give the final answer right away.
Instead:
1. Explain the core concept with a relatable real-world analogy (e.g. slices of pizza or lego bricks).
2. Walk through the first step clearly.
3. Ask me a friendly question so I can take the next step myself!`;
    onSendToChat(prompt, 'thinking');
  };

  const handleLaunchStory = () => {
    const prompt = `[MAGICAL BEDTIME STORY]
Hero: ${childName}
Theme: ${storyTheme}
Moral / Life Lesson: ${storyMoral}

Please weave a bedtime story to read together tonight.
Make it imaginative, warm, and comforting. Include fun dialogue, sensory descriptions (the stars glowing, the warm wind), and end with a peaceful, sleepy conclusion suitable for falling asleep happily.`;
    onSendToChat(prompt, 'general');
  };

  const handleLaunchTrip = () => {
    const prompt = `[FAMILY TRIP & OUTING PLANNER]
Target Destination / Area: ${destination}
Duration: ${tripDuration}
Family Style & Priorities: ${tripVibe}

Please plan a realistic, stress-free family itinerary.
Factor in:
1. Morning departure & energy levels
2. Kid snack & bathroom breaks
3. Main activity / gentle trail or museum
4. Casual family lunch recommendations
5. Afternoon low-key wrap-up before kids get overtired`;
    onSendToChat(prompt, 'maps');
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 text-stone-100">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400" />
          Family Intelligence Toolkits
        </h2>
        <p className="text-stone-400 text-sm mt-0.5">
          Specialized Gemini assistants programmed with your family rules, safety allergies, and household context.
        </p>
      </div>

      {/* Toolkit Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setActiveTool('chef')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTool === 'chef'
              ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10'
              : 'bg-stone-900 border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="p-2 w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-3">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-100">Pantry Chef</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Fridge recipes & allergy checks</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTool('homework')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTool === 'homework'
              ? 'bg-purple-500/20 border-purple-500/60 shadow-lg shadow-purple-500/10'
              : 'bg-stone-900 border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="p-2 w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-100">Homework Tutor</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Socratic step-by-step tutor</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTool('story')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTool === 'story'
              ? 'bg-rose-500/20 border-rose-500/60 shadow-lg shadow-rose-500/10'
              : 'bg-stone-900 border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="p-2 w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-100">Bedtime Story</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Personalized fairy tales</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTool('trip')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTool === 'trip'
              ? 'bg-emerald-500/20 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
              : 'bg-stone-900 border-stone-800 hover:border-stone-700'
          }`}
        >
          <div className="p-2 w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-100">Trip Planner</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">Kid-friendly outings & Maps</p>
          </div>
        </button>
      </div>

      {/* Active Tool Form Panel */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8">
        {/* TOOL 1: PANTRY CHEF */}
        {activeTool === 'chef' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Utensils className="w-4 h-4" />
              Pantry Magic Chef
            </div>
            <h3 className="text-xl font-bold text-white">
              Turn Whatever Is In Your Fridge Into Tonight's Family Dinner
            </h3>
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-2xl text-xs text-red-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Safety Lock Active: Jhatwal Home AI strictly filters recipes to be 100% peanut-safe for Kabir and respects Grandma's preferences.
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Available Ingredients in Kitchen / Fridge
                </label>
                <textarea
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="e.g. Ground turkey, bell peppers, black beans, salsa, tortillas"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                    Cooking Time Available
                  </label>
                  <select
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="15-20 mins (Quick rush dinner)">15-20 mins (Quick rush dinner)</option>
                    <option value="30 mins (Standard weeknight)">30 mins (Standard weeknight)</option>
                    <option value="45-60 mins (Relaxed family meal)">45-60 mins (Relaxed family meal)</option>
                    <option value="Slow cooker / Instant pot style">Slow cooker / Instant pot style</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                    Meal Type
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="Comforting Family Dinner">Comforting Family Dinner</option>
                    <option value="Healthy Quick Lunch">Healthy Quick Lunch</option>
                    <option value="Weekend Big Breakfast">Weekend Big Breakfast</option>
                    <option value="Wholesome Kid After-School Snack">Wholesome Kid After-School Snack</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleLaunchChef}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <span>Generate Recipe in Family Chat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TOOL 2: HOMEWORK TUTOR */}
        {activeTool === 'homework' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <GraduationCap className="w-4 h-4" />
              Socratic Homework Tutor (Powered by Deep Thinking)
            </div>
            <h3 className="text-xl font-bold text-white">
              Patient, Step-by-Step Conceptual Tutoring Without Spoilers
            </h3>
            <p className="text-xs text-stone-400">
              Uses Gemini 3.1 Pro's high thinking reasoning mode to explain math, science, and grammar intuitively.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="Math (Algebra / Fractions / Geometry)">Math (Algebra / Fractions / Geometry)</option>
                  <option value="Science (Biology / Physics / Space)">Science (Biology / Physics / Space)</option>
                  <option value="Language Arts & Essay Writing">Language Arts & Essay Writing</option>
                  <option value="Social Studies & History">Social Studies & History</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Grade / Age Level
                </label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  placeholder="e.g. 5th Grade, Middle School, High School"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                The Question, Equation, or Concept
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="Paste the problem or question here..."
              />
            </div>

            <button
              onClick={handleLaunchHomework}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <span>Begin Socratic Tutoring Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TOOL 3: BEDTIME STORY */}
        {activeTool === 'story' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              Magical Family Bedtime Storyteller
            </div>
            <h3 className="text-xl font-bold text-white">
              Custom Story Crafted For Your Kids & Family Tonight
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Hero / Main Character
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Kabir & Krish"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Moral / Theme
                </label>
                <input
                  type="text"
                  value={storyMoral}
                  onChange={(e) => setStoryMoral(e.target.value)}
                  placeholder="e.g. Kindness, teamwork, patience"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Story World & Setting
              </label>
              <textarea
                value={storyTheme}
                onChange={(e) => setStoryTheme(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="e.g. Secret treehouse time-machine, deep ocean submarine, pet dog Barnaby becomes king"
              />
            </div>

            <button
              onClick={handleLaunchStory}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <span>Weave Bedtime Tale</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TOOL 4: TRIP PLANNER */}
        {activeTool === 'trip' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-4 h-4" />
              Family Outing & Weekend Trip Planner (Google Maps Grounded)
            </div>
            <h3 className="text-xl font-bold text-white">
              Stress-Free Family Schedules Factoring In Rest & Kid Fun
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Destination / Activity Idea
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. San Francisco Golden Gate Park or Local Zoo"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                  Trip Duration
                </label>
                <select
                  value={tripDuration}
                  onChange={(e) => setTripDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value="Half-Day Morning Adventure (3-4 hours)">Half-Day Morning Adventure (3-4 hours)</option>
                  <option value="Full Day Outing (10am - 5pm)">Full Day Outing (10am - 5pm)</option>
                  <option value="Weekend 2-Day Getaway">Weekend 2-Day Getaway</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1.5">
                Family Preferences & Priorities
              </label>
              <textarea
                value={tripVibe}
                onChange={(e) => setTripVibe(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                placeholder="e.g. Stroller friendly, playgrounds for 10-year old, quiet cafe for grandparents"
              />
            </div>

            <button
              onClick={handleLaunchTrip}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <span>Build Maps Grounded Itinerary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
