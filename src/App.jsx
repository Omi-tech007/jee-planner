import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, Clock, BarChart2, CheckCircle, 
  Plus, Trash2, Moon, Sun, ChevronRight, Play, Pause, RotateCcw,
  Music, Image as ImageIcon, Settings, List, Target, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

/**
 * JEE STUDY PLANNER - v2.0 (With Zen Focus Mode)
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
  notepad: "",
  dailyGoal: 8, // Hours per day goal
  tasks: [],
  subjects: SUBJECTS.reduce((acc, sub) => ({
    ...acc,
    [sub]: { chapters: [], timeSpent: 0, kpp: [] }
  }), {}),
  studyLog: [],
  darkMode: false
};

// --- COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "" }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20",
    secondary: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600",
    danger: "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
    ghost: "text-gray-500 hover:text-amber-500",
    zen: "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/30 px-8 py-3 rounded-xl text-lg"
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// --- NEW FEATURE: ZEN FOCUS MODE ---
const FocusMode = ({ subjects, data, onSaveTime, tasks }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('stopwatch'); // stopwatch | timer
  const [selectedSub, setSelectedSub] = useState(SUBJECTS[0]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskSelector, setShowTaskSelector] = useState(false);

  // Calculate Daily Progress
  const today = new Date().toISOString().split('T')[0];
  const todayLog = data.studyLog.find(e => e.date === today);
  const minutesStudiedToday = todayLog ? todayLog.minutes : 0;
  const hoursStudied = Math.floor(minutesStudiedToday / 60);
  const minsStudied = minutesStudiedToday % 60;
  const goalMinutes = (data.dailyGoal || 8) * 60;
  const progressPercent = Math.min((minutesStudiedToday / goalMinutes) * 100, 100);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if (mode === 'stopwatch') {
          setTimeLeft(t => t + 1);
        } else {
          setTimeLeft(t => {
            if (t <= 0) { setIsActive(false); onSaveTime(selectedSub, selectedTask?.id, 0); return 0; }
            return t - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, mode]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setIsActive(false);
    onSaveTime(selectedSub, timeLeft);
    setTimeLeft(0);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-[#111111] text-white rounded-3xl overflow-hidden relative p-8">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        {/* Daily Goal Widget */}
        <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-white/5 w-64">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
              <Zap size={14} className="text-violet-500" /> Daily Goal
            </span>
            <span className="text-xs text-gray-500">
              {hoursStudied}h {minsStudied}m / {data.dailyGoal}h 0m
            </span>
          </div>
          <div className="h-2 bg-[#2c2c2e] rounded-full overflow-hidden">
            <div className="h-full bg-violet-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Top Right Tools */}
        <div className="bg-[#1c1c1e] p-2 rounded-xl border border-white/5 flex gap-1">
          <button className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"><ImageIcon size={20} /></button>
          <button className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"><Music size={20} /></button>
          <button className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"><Settings size={20} /></button>
        </div>
      </div>

      {/* Center Timer */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-[8rem] md:text-[10rem] font-bold font-mono tracking-tighter leading-none select-none">
          {formatTime(timeLeft)}
        </div>
        
        {/* Input Bar */}
        <div className="mt-12 bg-[#1c1c1e] p-2 pr-4 rounded-2xl border border-white/5 flex items-center gap-4 shadow-2xl">
          <div className="flex items-center gap-3 px-4 py-2 border-r border-white/10">
            <span className="text-gray-500 text-sm">Studying:</span>
            <select 
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              value={selectedSub}
              onChange={(e) => setSelectedSub(e.target.value)}
            >
              {SUBJECTS.map(s => <option key={s} value={s} className="bg-[#1c1c1e]">{s}</option>)}
            </select>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowTaskSelector(!showTaskSelector)}
              className="flex items-center gap-2 text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition text-sm"
            >
              <List size={16} />
              {selectedTask ? selectedTask.text.substring(0, 20) + '...' : 'Select Task (Optional)'}
            </button>
            
            {/* Task Dropdown */}
            {showTaskSelector && (
              <div className="absolute bottom-12 left-0 w-64 bg-[#2c2c2e] rounded-xl border border-white/10 shadow-xl overflow-hidden z-20">
                <div className="p-2 max-h-48 overflow-y-auto">
                   <div 
                     className="p-2 hover:bg-white/10 rounded cursor-pointer text-sm text-gray-300"
                     onClick={() => { setSelectedTask(null); setShowTaskSelector(false); }}
                   >
                     -- No specific task --
                   </div>
                   {tasks.filter(t => !t.completed).map(t => (
                     <div 
                       key={t.id} 
                       className="p-2 hover:bg-white/10 rounded cursor-pointer text-sm text-white truncate"
                       onClick={() => { setSelectedTask(t); setShowTaskSelector(false); }}
                     >
                       {t.text}
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Controls */}
        <div className="mt-12 flex items-center gap-6">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition">
            <List size={18} /> Todo
          </button>

          {!isActive ? (
            <button 
              onClick={() => setIsActive(true)}
              className="flex items-center gap-3 bg-violet-600 hover:bg-violet-700 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 transition-all hover:scale-105 active:scale-95"
            >
              <Play fill="currentColor" size={24} /> Start
            </button>
          ) : (
             <button 
              onClick={handleStop}
              className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Pause fill="currentColor" size={24} /> Stop
            </button>
          )}

          <button 
            onClick={() => { setIsActive(false); setTimeLeft(0); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white transition"
          >
            <RotateCcw size={18} /> Reset
          </button>
        </div>
      </div>
    </div>
  );
};


// 3. CHAPTER CARD 
const ChapterCard = ({ subject, chapter, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const completedMain = chapter.lectures.filter(l => l).length;
  const progressPercent = chapter.totalLectures > 0 
    ? Math.round((completedMain / chapter.totalLectures) * 100) 
    : 0;

  const toggleLecture = (index) => {
    const newLectures = [...chapter.lectures];
    newLectures[index] = !newLectures[index];
    onUpdate({ ...chapter, lectures: newLectures });
  };

  const addMiscLecture = () => {
    const name = prompt("Enter Misc Lecture Name:");
    if (name) {
      onUpdate({ 
        ...chapter, 
        miscLectures: [...(chapter.miscLectures || []), { name, completed: false }] 
      });
    }
  };

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${progressPercent === 100 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {progressPercent === 100 ? <CheckCircle size={20} /> : <BookOpen size={20} />}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">{chapter.name}</h3>
            <p className="text-sm text-gray-500">{completedMain}/{chapter.totalLectures} Lectures • {progressPercent}% Done</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="!p-2"><Trash2 size={16} /></Button>
          <ChevronRight size={20} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">MAIN LECTURES</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {Array.from({ length: parseInt(chapter.totalLectures) }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => toggleLecture(i)}
                  className={`p-2 rounded-md text-sm border transition-colors ${
                    chapter.lectures[i] ? 'bg-amber-500 border-amber-500 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-500'
                  }`}
                >
                  Lec {i + 1}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-600">MISCELLANEOUS</h4>
              <button onClick={addMiscLecture} className="text-xs text-amber-600 font-medium hover:underline">+ Add Extra</button>
            </div>
            <div className="space-y-2">
              {chapter.miscLectures?.map((misc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="checkbox" checked={misc.completed} 
                    onChange={() => {
                       const newMisc = [...chapter.miscLectures];
                       newMisc[idx].completed = !newMisc[idx].completed;
                       onUpdate({ ...chapter, miscLectures: newMisc });
                    }}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span className={`text-sm ${misc.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{misc.name}</span>
                </div>
              ))}
            </div>
          </div>

          {subject === 'Maths' && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">DIBY Questions</h4>
              <div className="flex gap-4">
                <input type="number" placeholder="Total" value={chapter.dibyTotal || 0} onChange={(e) => onUpdate({ ...chapter, dibyTotal: parseInt(e.target.value) || 0 })} className="w-full p-1 text-sm rounded border dark:bg-gray-800" />
                <input type="number" placeholder="Solved" value={chapter.dibySolved || 0} onChange={(e) => onUpdate({ ...chapter, dibySolved: parseInt(e.target.value) || 0 })} className="w-full p-1 text-sm rounded border dark:bg-gray-800" />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('jeePlannerData');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedSubject, setSelectedSubject] = useState('Physics');

  useEffect(() => {
    localStorage.setItem('jeePlannerData', JSON.stringify(data));
    if (data.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [data]);

  const toggleDarkMode = () => setData(prev => ({ ...prev, darkMode: !prev.darkMode }));

  // ACTIONS
  const addChapter = (sub) => {
    const name = prompt("Enter Chapter Name:");
    const lectures = prompt("Total Main Lectures:");
    if (name && lectures) {
      const newChapter = {
        id: Date.now().toString(),
        name,
        totalLectures: parseInt(lectures),
        lectures: new Array(parseInt(lectures)).fill(false),
        miscLectures: [],
        dibyTotal: 0, dibySolved: 0
      };
      const newData = { ...data };
      newData.subjects[sub].chapters.push(newChapter);
      setData(newData);
    }
  };

  const updateChapter = (sub, updated) => {
    const newData = { ...data };
    const idx = newData.subjects[sub].chapters.findIndex(c => c.id === updated.id);
    newData.subjects[sub].chapters[idx] = updated;
    setData(newData);
  };

  const deleteChapter = (sub, id) => {
    if(window.confirm("Delete chapter?")) {
      const newData = { ...data };
      newData.subjects[sub].chapters = newData.subjects[sub].chapters.filter(c => c.id !== id);
      setData(newData);
    }
  };

  const saveStudyTime = (subject, seconds) => {
    const newData = { ...data };
    newData.subjects[subject].timeSpent += seconds;
    const today = new Date().toISOString().split('T')[0];
    const existingEntry = newData.studyLog.find(e => e.date === today);
    if (existingEntry) existingEntry.minutes += Math.round(seconds / 60);
    else {
      newData.studyLog.push({ date: today, minutes: Math.round(seconds / 60) });
      if (newData.studyLog.length > 7) newData.studyLog.shift();
    }
    setData(newData);
  };

  // RENDERING
  const renderDashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
            <p className="text-gray-500">Welcome back, Aspirant.</p>
          </div>
          <Button onClick={() => {
            const t = prompt("New Task:");
            if(t) setData(prev => ({ ...prev, tasks: [{id: Date.now(), text: t, completed: false, subject: 'General'}, ...prev.tasks] }));
          }}><Plus size={18} /> Add Task</Button>
        </div>

        {/* Notepad */}
        <Card>
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">Rough Notes</h3>
          <textarea 
            className="w-full h-24 p-2 rounded border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-amber-500"
            value={data.notepad}
            onChange={e => setData({...data, notepad: e.target.value})}
            placeholder="Quick notes..."
          />
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Card className="h-64">
             <h4 className="font-bold mb-2 dark:text-gray-300">Study Trend</h4>
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
              <h4 className="font-bold mb-2 dark:text-gray-300">Subject Distribution (Hrs)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SUBJECTS.map(s => ({ name: s.slice(0,3), hours: Math.round(data.subjects[s].timeSpent/3600) }))}>
                  <XAxis dataKey="name" />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
           </Card>
        </div>

        {/* Tasks */}
        <Card>
          <h3 className="font-bold mb-4 dark:text-white">Today's Tasks</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={task.completed} 
                    onChange={() => setData(prev => ({...prev, tasks: prev.tasks.map(t => t.id === task.id ? {...t, completed: !t.completed} : t)}))}
                    className="w-5 h-5 text-amber-500 rounded"
                  />
                  <span className={task.completed ? 'line-through text-gray-400' : 'dark:text-gray-200'}>{task.text}</span>
                </div>
                <button onClick={() => setData(prev => ({...prev, tasks: prev.tasks.filter(t => t.id !== task.id)}))} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
            {data.tasks.length === 0 && <p className="text-center text-gray-400">No tasks yet.</p>}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Quick Syllabus */}
        <Card>
          <h3 className="font-bold mb-4 dark:text-white">Syllabus Progress</h3>
          <div className="space-y-4">
            {SUBJECTS.map(sub => {
              const chaps = data.subjects[sub].chapters;
              const total = chaps.length;
              const done = chaps.filter(c => c.lectures.length > 0 && c.lectures.every(l => l)).length;
              return total > 0 ? (
                <div key={sub}>
                   <div className="flex justify-between text-xs mb-1 dark:text-gray-300"><span>{sub}</span><span>{done}/{total}</span></div>
                   <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{width: `${(done/total)*100}%`}}/></div>
                </div>
              ) : null;
            })}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSyllabus = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Syllabus</h2>
        <Button onClick={() => addChapter(selectedSubject)}><Plus size={18} /> New Chapter</Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => setSelectedSubject(s)} 
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${selectedSubject === s ? 'bg-amber-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-300 border hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>
      <div>
        {data.subjects[selectedSubject].chapters.map(c => (
          <ChapterCard key={c.id} subject={selectedSubject} chapter={c} onUpdate={u => updateChapter(selectedSubject, u)} onDelete={() => deleteChapter(selectedSubject, c.id)} />
        ))}
        {data.subjects[selectedSubject].chapters.length === 0 && <div className="text-center py-20 text-gray-400">No chapters added.</div>}
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-screen bg-gray-50 dark:bg-gray-900 font-sans ${data.darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed h-full z-10 hidden md:flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3 text-amber-500 font-bold text-xl"><div className="w-8 h-8 bg-amber-500 text-white flex items-center justify-center rounded-lg">J</div><span className="hidden lg:block">JEE Tracker</span></div>
          <nav className="mt-6 px-4 space-y-2">
            {[
              { id: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'Syllabus', icon: BookOpen, label: 'Syllabus' },
              { id: 'Focus', icon: Clock, label: 'Focus Mode' }, // <--- NEW TAB
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === item.id ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                <item.icon size={20} /> <span className="hidden lg:block">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4">
          <button onClick={toggleDarkMode} className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 text-gray-500 hover:text-amber-500 transition">
            {data.darkMode ? <Sun size={20} /> : <Moon size={20} />} <span className="hidden lg:block">{data.darkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-20 lg:ml-64 p-4 md:p-8 overflow-x-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
           <span className="font-bold text-lg dark:text-white">JEE Tracker</span>
           <div className="flex gap-4">
             <button onClick={() => setActiveTab('Dashboard')}><LayoutDashboard /></button>
             <button onClick={() => setActiveTab('Focus')}><Clock /></button>
           </div>
        </div>

        {activeTab === 'Dashboard' && renderDashboard()}
        {activeTab === 'Syllabus' && renderSyllabus()}
        {activeTab === 'Focus' && (
          <FocusMode 
            subjects={SUBJECTS} 
            data={data} 
            tasks={data.tasks}
            onSaveTime={saveStudyTime} 
          />
        )}
      </main>
    </div>
  );
}