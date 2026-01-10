import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, Clock, BarChart2, CheckCircle, 
  Plus, Trash2, Moon, Sun, ChevronRight, PlayCircle, AlertCircle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

/**
 * JEE STUDY PLANNER
 * -----------------
 * A dashboard for tracking JEE preparation.
 * Features:
 * - 5 Fixed Subjects
 * - Chapter Tracking (Lectures, Misc, DIBY)
 * - Physics KPP System
 * - Study Timer
 * - Auto-save to LocalStorage
 */

// --- CONSTANTS ---
const SUBJECTS = [
  "Physics", 
  "Maths", 
  "Organic Chemistry", 
  "Inorganic Chemistry", 
  "Physical Chemistry"
];

const INITIAL_DATA = {
  tasks: [],
  subjects: SUBJECTS.reduce((acc, sub) => ({
    ...acc,
    [sub]: { chapters: [], timeSpent: 0, kpp: [] } // kpp only used in Physics
  }), {}),
  studyLog: [], // For daily trend graph
  darkMode: false
};

// --- COMPONENTS ---

// 1. UI PRIMITIVES (Simple reusable styled components)
const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2";
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20",
    secondary: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600",
    danger: "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
    ghost: "text-gray-500 hover:text-amber-500"
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ProgressBar = ({ current, total, color = "bg-amber-500" }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 font-medium text-gray-500 dark:text-gray-400">
        <span>Progress</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// 2. CHAPTER CARD (Handles Lectures, Misc, and Subject specific logic)
const ChapterCard = ({ subject, chapter, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Logic: Calculate MAIN lecture progress
  const completedMain = chapter.lectures.filter(l => l).length;
  const progressPercent = chapter.totalLectures > 0 
    ? Math.round((completedMain / chapter.totalLectures) * 100) 
    : 0;

  // Handler: Update main lecture status
  const toggleLecture = (index) => {
    const newLectures = [...chapter.lectures];
    newLectures[index] = !newLectures[index];
    onUpdate({ ...chapter, lectures: newLectures });
  };

  // Handler: Add Misc Lecture
  const addMiscLecture = () => {
    const name = prompt("Enter Misc Lecture Name (e.g., 'Extra PYQ Session'):");
    if (name) {
      onUpdate({ 
        ...chapter, 
        miscLectures: [...(chapter.miscLectures || []), { name, completed: false }] 
      });
    }
  };

  // Handler: Toggle Misc Lecture
  const toggleMisc = (idx) => {
    const newMisc = [...(chapter.miscLectures || [])];
    newMisc[idx].completed = !newMisc[idx].completed;
    onUpdate({ ...chapter, miscLectures: newMisc });
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      {/* Header Section */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${progressPercent === 100 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {progressPercent === 100 ? <CheckCircle size={20} /> : <BookOpen size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">{chapter.name}</h3>
            <p className="text-sm text-gray-500">
              {completedMain}/{chapter.totalLectures} Main Lectures • {progressPercent}% Done
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="!p-2">
            <Trash2 size={16} />
          </Button>
          <ChevronRight size={20} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
          
          {/* Main Lectures Grid */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wider">Main Lectures</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Array.from({ length: parseInt(chapter.totalLectures) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => toggleLecture(i)}
                  className={`p-2 rounded-md text-sm font-medium border transition-colors ${
                    chapter.lectures[i] 
                      ? 'bg-amber-500 border-amber-500 text-white' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-500'
                  }`}
                >
                  Lec {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Misc Lectures Section (Does NOT affect progress) */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Miscellaneous (Extras)</h4>
              <button onClick={addMiscLecture} className="text-xs text-amber-600 font-medium hover:underline">+ Add Extra</button>
            </div>
            <div className="space-y-2">
              {chapter.miscLectures?.map((misc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={misc.completed} 
                    onChange={() => toggleMisc(idx)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span className={`text-sm ${misc.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                    {misc.name}
                  </span>
                </div>
              ))}
              {(!chapter.miscLectures || chapter.miscLectures.length === 0) && (
                <p className="text-xs text-gray-400 italic">No extra lectures added.</p>
              )}
            </div>
          </div>

          {/* MATHS ONLY: DIBY Questions */}
          {subject === 'Maths' && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">DIBY Questions Tracker</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block">Total Qs</label>
                  <input 
                    type="number" 
                    value={chapter.dibyTotal || 0}
                    onChange={(e) => onUpdate({ ...chapter, dibyTotal: parseInt(e.target.value) || 0 })}
                    className="w-full p-1 text-sm rounded border dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block">Solved</label>
                  <input 
                    type="number" 
                    value={chapter.dibySolved || 0}
                    onChange={(e) => onUpdate({ ...chapter, dibySolved: parseInt(e.target.value) || 0 })}
                    className="w-full p-1 text-sm rounded border dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>
                <div className="flex-1 text-right">
                  <span className="text-2xl font-bold text-blue-600">
                    {chapter.dibyTotal > 0 ? Math.round((chapter.dibySolved / chapter.dibyTotal) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// 3. PHYSICS KPP SYSTEM (Separate Component)
const KPPSection = ({ kppData, chapters, onUpdate }) => {
  const [newKPP, setNewKPP] = useState({ name: '', chapterId: '', score: '', total: '' });

  const handleAdd = () => {
    if (!newKPP.name || !newKPP.chapterId) return alert("Name and Chapter are required");
    const kpp = {
      id: Date.now(),
      ...newKPP,
      attempted: false,
      corrected: false
    };
    onUpdate([...kppData, kpp]);
    setNewKPP({ name: '', chapterId: '', score: '', total: '' });
  };

  const updateKPP = (id, field, value) => {
    const updated = kppData.map(k => k.id === id ? { ...k, [field]: value } : k);
    onUpdate(updated);
  };

  const deleteKPP = (id) => {
    onUpdate(kppData.filter(k => k.id !== id));
  };

  // Prepare Chart Data
  const chartData = kppData.map(k => ({
    name: k.name,
    percentage: (parseInt(k.score || 0) / parseInt(k.total || 1)) * 100
  }));

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart2 className="text-amber-500" /> KPP Performance Graph</h3>
        <div className="h-64 w-full">
          {kppData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip />
                <Bar dataKey="percentage" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Score %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-gray-400">No KPP data yet</div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold mb-4">Manage KPPs</h3>
        {/* Add New KPP */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <input 
            placeholder="KPP Name" 
            className="p-2 rounded border dark:bg-gray-800 dark:border-gray-600"
            value={newKPP.name}
            onChange={e => setNewKPP({ ...newKPP, name: e.target.value })}
          />
          <select 
            className="p-2 rounded border dark:bg-gray-800 dark:border-gray-600"
            value={newKPP.chapterId}
            onChange={e => setNewKPP({ ...newKPP, chapterId: e.target.value })}
          >
            <option value="">Link Chapter</option>
            {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input 
            placeholder="My Score" type="number"
            className="p-2 rounded border dark:bg-gray-800 dark:border-gray-600"
            value={newKPP.score}
            onChange={e => setNewKPP({ ...newKPP, score: e.target.value })}
          />
          <input 
            placeholder="Total Marks" type="number"
            className="p-2 rounded border dark:bg-gray-800 dark:border-gray-600"
            value={newKPP.total}
            onChange={e => setNewKPP({ ...newKPP, total: e.target.value })}
          />
          <Button onClick={handleAdd}>Add KPP</Button>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 bg-gray-50 dark:bg-gray-700/50 uppercase">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Attempted</th>
                <th className="p-3">Corrected</th>
                <th className="p-3">Score</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {kppData.map(k => (
                <tr key={k.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 font-medium">{k.name}</td>
                  <td className="p-3">
                    <input type="checkbox" checked={k.attempted} onChange={() => updateKPP(k.id, 'attempted', !k.attempted)} />
                  </td>
                  <td className="p-3">
                    <input type="checkbox" checked={k.corrected} onChange={() => updateKPP(k.id, 'corrected', !k.corrected)} />
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-amber-600">{k.score}</span> / {k.total}
                  </td>
                  <td className="p-3">
                    <button onClick={() => deleteKPP(k.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// 4. TIMER COMPONENT
const StudyTimer = ({ subjects, onSaveTime }) => {
  const [mode, setMode] = useState('stopwatch'); // stopwatch | timer
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [selectedSub, setSelectedSub] = useState(SUBJECTS[0]);
  const [inputMinutes, setInputMinutes] = useState(25);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if (mode === 'stopwatch') {
          setTimeLeft(t => t + 1);
        } else {
          setTimeLeft(t => {
            if (t <= 0) { setIsActive(false); onSaveTime(selectedSub, inputMinutes * 60); return 0; }
            return t - 1;
          });
        }
      }, 1000);
    } else if (!isActive && timeLeft !== 0 && mode === 'stopwatch') {
       clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, mode, selectedSub, onSaveTime, inputMinutes]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setIsActive(false);
    if (mode === 'stopwatch') {
      onSaveTime(selectedSub, timeLeft);
      setTimeLeft(0);
    }
  };

  const startTimer = () => {
    if (mode === 'timer') setTimeLeft(inputMinutes * 60);
    setIsActive(true);
  };

  return (
    <Card className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none">
      <div className="w-full flex justify-between mb-4">
        <h3 className="font-bold flex items-center gap-2"><Clock size={18} /> Focus Mode</h3>
        <select 
          className="bg-white/20 text-white border-none rounded text-sm p-1 focus:ring-0"
          value={selectedSub}
          onChange={(e) => setSelectedSub(e.target.value)}
        >
          {SUBJECTS.map(s => <option key={s} value={s} className="text-gray-900">{s}</option>)}
        </select>
      </div>

      <div className="text-5xl font-mono font-bold mb-6 tracking-wider">
        {formatTime(timeLeft)}
      </div>

      <div className="flex gap-2 w-full">
        {!isActive ? (
          <button onClick={startTimer} className="flex-1 bg-white text-amber-600 py-2 rounded-lg font-bold hover:bg-gray-100 transition">
            Start {mode === 'timer' ? 'Timer' : 'Focus'}
          </button>
        ) : (
          <button onClick={handleStop} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 transition">
            Stop & Save
          </button>
        )}
      </div>

      <div className="flex gap-4 mt-4 text-xs font-medium text-white/80">
        <button onClick={() => { setMode('stopwatch'); setIsActive(false); setTimeLeft(0); }} className={mode === 'stopwatch' ? 'text-white underline' : ''}>Stopwatch</button>
        <button onClick={() => { setMode('timer'); setIsActive(false); }} className={mode === 'timer' ? 'text-white underline' : ''}>Timer</button>
      </div>
      
      {mode === 'timer' && !isActive && (
        <input 
          type="number" value={inputMinutes} onChange={(e) => setInputMinutes(e.target.value)}
          className="mt-2 w-16 bg-white/20 text-center text-white rounded border-none"
        />
      )}
    </Card>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  // 1. STATE
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('jeePlannerData');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedSubject, setSelectedSubject] = useState('Physics');

  // 2. AUTO-SAVE EFFECT
  useEffect(() => {
    localStorage.setItem('jeePlannerData', JSON.stringify(data));
    if (data.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data]);

  // 3. ACTIONS
  const toggleDarkMode = () => setData(prev => ({ ...prev, darkMode: !prev.darkMode }));

  // Subject Actions
  const addChapter = (sub) => {
    const name = prompt("Enter Chapter Name:");
    const lectures = prompt("Total Main Lectures (Number):");
    if (name && lectures) {
      const newChapter = {
        id: Date.now().toString(),
        name,
        totalLectures: parseInt(lectures),
        lectures: new Array(parseInt(lectures)).fill(false),
        miscLectures: [],
        dibyTotal: 0,
        dibySolved: 0
      };
      const newData = { ...data };
      newData.subjects[sub].chapters.push(newChapter);
      setData(newData);
    }
  };

  const updateChapter = (sub, updatedChapter) => {
    const newData = { ...data };
    const idx = newData.subjects[sub].chapters.findIndex(c => c.id === updatedChapter.id);
    newData.subjects[sub].chapters[idx] = updatedChapter;
    setData(newData);
  };

  const deleteChapter = (sub, id) => {
    if(!window.confirm("Are you sure?")) return;
    const newData = { ...data };
    newData.subjects[sub].chapters = newData.subjects[sub].chapters.filter(c => c.id !== id);
    setData(newData);
  };

  // Task Actions
  const addTask = (text, subject) => {
    const newTask = { id: Date.now(), text, subject, completed: false };
    setData(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
  };
  
  const toggleTask = (id) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const deleteTask = (id) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  // Timer Action
  const saveStudyTime = (subject, seconds) => {
    const newData = { ...data };
    // Update total subject time
    newData.subjects[subject].timeSpent += seconds;
    
    // Update daily log
    const today = new Date().toISOString().split('T')[0];
    const existingEntry = newData.studyLog.find(e => e.date === today);
    if (existingEntry) {
      existingEntry.minutes += Math.round(seconds / 60);
    } else {
      newData.studyLog.push({ date: today, minutes: Math.round(seconds / 60) });
      // Keep only last 7 days
      if (newData.studyLog.length > 7) newData.studyLog.shift();
    }
    setData(newData);
  };

  // 4. RENDER HELPERS
  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Good afternoon, Aspirant!</h2>
            <p className="text-gray-500">Let's crush some goals today.</p>
          </div>
          <Button onClick={() => document.getElementById('taskInput').focus()} variant="primary">
            <Plus size={18} /> New Task
          </Button>
        </div>

        {/* Graphs Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Card className="h-64">
             <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Study Trend (Last 7 Days)</h4>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data.studyLog}>
                 <XAxis dataKey="date" hide />
                 <YAxis />
                 <RechartsTooltip />
                 <Line type="monotone" dataKey="minutes" stroke="#f59e0b" strokeWidth={3} dot={{r:4}} />
               </LineChart>
             </ResponsiveContainer>
           </Card>
           <Card className="h-64">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Subject Distribution (Hours)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SUBJECTS.map(s => ({ name: s.slice(0,3), hours: Math.round(data.subjects[s].timeSpent/3600) }))}>
                  <XAxis dataKey="name" />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
           </Card>
        </div>

        {/* Task List */}
        <Card>
          <h3 className="font-bold text-lg mb-4">Today's Tasks</h3>
          <div className="flex gap-2 mb-4">
            <input 
              id="taskInput"
              type="text" 
              placeholder="Add a new task..." 
              className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              onKeyDown={(e) => {
                if(e.key === 'Enter' && e.target.value) {
                  addTask(e.target.value, "General");
                  e.target.value = "";
                }
              }}
            />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.tasks.length === 0 && <div className="text-center py-8 text-gray-400">All clear for today!</div>}
            {data.tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg group">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={task.completed} 
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span className={`${task.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                    {task.text}
                  </span>
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                    {task.subject}
                  </span>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <StudyTimer subjects={SUBJECTS} onSaveTime={saveStudyTime} />
        
        {/* Quick Syllabus Stats */}
        <Card>
          <h3 className="font-bold mb-4">Syllabus Overview</h3>
          <div className="space-y-4">
            {SUBJECTS.map(sub => {
              const chapters = data.subjects[sub].chapters;
              const totalChaps = chapters.length;
              if (totalChaps === 0) return null;
              const completedChaps = chapters.filter(c => {
                 const mainDone = c.lectures.every(l => l);
                 return mainDone && c.totalLectures > 0;
              }).length;
              
              return (
                <div key={sub}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">{sub}</span>
                    <span className="font-bold">{completedChaps}/{totalChaps} Ch</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(completedChaps/totalChaps)*100}%` }}></div>
                  </div>
                </div>
              );
            })}
             {Object.values(data.subjects).every(s => s.chapters.length === 0) && (
               <p className="text-sm text-gray-400 text-center">Add chapters in Syllabus tab to see stats.</p>
             )}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSyllabus = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Syllabus Tracker</h2>
          <p className="text-gray-500">Manage your chapters and lectures.</p>
        </div>
        <Button onClick={() => addChapter(selectedSubject)}>
          <Plus size={18} /> Add New Chapter
        </Button>
      </div>

      {/* Subject Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
        {SUBJECTS.map(sub => (
          <button
            key={sub}
            onClick={() => setSelectedSubject(sub)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              selectedSubject === sub 
                ? 'bg-amber-500 text-white shadow-md' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Chapters List */}
      <div className="min-h-[400px]">
        {data.subjects[selectedSubject].chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <BookOpen size={48} className="mb-4 opacity-50" />
            <p>No chapters added yet for {selectedSubject}.</p>
            <button onClick={() => addChapter(selectedSubject)} className="mt-2 text-amber-500 font-medium hover:underline">Add your first chapter</button>
          </div>
        ) : (
          data.subjects[selectedSubject].chapters.map(chapter => (
            <ChapterCard 
              key={chapter.id}
              subject={selectedSubject}
              chapter={chapter}
              onUpdate={(updated) => updateChapter(selectedSubject, updated)}
              onDelete={() => deleteChapter(selectedSubject, chapter.id)}
            />
          ))
        )}
      </div>

      {/* Physics KPP Special Section */}
      {selectedSubject === 'Physics' && (
        <div className="mt-12 pt-8 border-t dark:border-gray-700">
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">KPP Tracker (Physics Exclusive)</h2>
           <KPPSection 
             kppData={data.subjects['Physics'].kpp} 
             chapters={data.subjects['Physics'].chapters}
             onUpdate={(newKPPList) => {
               const newData = { ...data };
               newData.subjects['Physics'].kpp = newKPPList;
               setData(newData);
             }}
           />
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans ${data.darkMode ? 'dark' : ''}`}>
      
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full hidden md:block z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold">J</div>
          <span className="font-bold text-xl text-gray-800 dark:text-white">JEE Tracker</span>
        </div>
        
        <nav className="mt-6 px-4 space-y-2">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Syllabus', icon: BookOpen },
          ].map(item => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.name 
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon size={20} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-0 w-full px-6">
          <button 
            onClick={toggleDarkMode}
            className="flex items-center gap-3 text-gray-500 hover:text-amber-500 transition-colors"
          >
            {data.darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{data.darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
           <span className="font-bold text-lg dark:text-white">JEE Tracker</span>
           <div className="flex gap-4">
             <button onClick={() => setActiveTab('Dashboard')}><LayoutDashboard /></button>
             <button onClick={() => setActiveTab('Syllabus')}><BookOpen /></button>
           </div>
        </div>

        {activeTab === 'Dashboard' ? renderDashboard() : renderSyllabus()}
      </main>
    </div>
  );
}