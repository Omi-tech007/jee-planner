import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, BookOpen, Zap, Flame, Trophy, 
  Play, Pause, CheckCircle, X, ChevronRight, 
  Plus, Trash2, FileText, TrendingUp, LogOut,
  Timer as TimerIcon, StopCircle, Target, User,
  Settings, Image as ImageIcon, ExternalLink, Maximize, Minimize,
  PieChart as PieChartIcon, Upload, Bell, Calendar, Edit3, Mail, Lock, KeyRound, CheckSquare,
  Tag, HelpCircle, Menu, Moon, Sun, Monitor
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  Legend, LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIREBASE IMPORTS ---
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase"; 

/**
 * PREPPILOT - v28.0 (Themed UI Redesign + Settings + Guide)
 */

// --- CONSTANTS & CONFIG ---
const ALL_SUBJECTS = ["Physics", "Maths", "Biology", "Organic Chem", "Inorganic Chem", "Physical Chem"];

const THEMES = {
  rose: { primary: "bg-rose-600", hover: "hover:bg-rose-700", text: "text-rose-600", border: "border-rose-200", light: "bg-rose-50", ring: "ring-rose-500" },
  teal: { primary: "bg-teal-600", hover: "hover:bg-teal-700", text: "text-teal-600", border: "border-teal-200", light: "bg-teal-50", ring: "ring-teal-500" },
  violet: { primary: "bg-violet-600", hover: "hover:bg-violet-700", text: "text-violet-600", border: "border-violet-200", light: "bg-violet-50", ring: "ring-violet-500" },
  amber: { primary: "bg-amber-500", hover: "hover:bg-amber-600", text: "text-amber-600", border: "border-amber-200", light: "bg-amber-50", ring: "ring-amber-500" },
  cyan: { primary: "bg-cyan-600", hover: "hover:bg-cyan-700", text: "text-cyan-600", border: "border-cyan-200", light: "bg-cyan-50", ring: "ring-cyan-500" },
  slate: { primary: "bg-slate-800", hover: "hover:bg-slate-900", text: "text-slate-700", border: "border-slate-200", light: "bg-slate-100", ring: "ring-slate-500" },
};

const EXAM_CONFIG = {
  "JEE Mains (Jan) 2027": { date: "2027-01-21", marks: 300, type: "Math" },
  "JEE Mains (April) 2027": { date: "2027-04-02", marks: 300, type: "Math" },
  "JEE Advanced 2026": { date: "2026-05-15", marks: 0, type: "Math" }, 
  "JEE Advanced 2027": { date: "2027-05-15", marks: 0, type: "Math" },
  "BITSAT 2027": { date: "2027-04-15", marks: 390, type: "Math" },
  "NEET 2026": { date: "2026-05-05", marks: 720, type: "Bio" },
  "NEET 2027": { date: "2027-05-05", marks: 720, type: "Bio" },
  "MHT-CET (PCM) 2026": { date: "2026-04-10", marks: 200, type: "Math" },
  "MHT-CET (PCB) 2026": { date: "2026-04-10", marks: 200, type: "Bio" },
  "MHT-CET (PCM) 2027": { date: "2027-04-10", marks: 200, type: "Math" },
  "MHT-CET (PCB) 2027": { date: "2027-04-10", marks: 200, type: "Bio" },
};

const INITIAL_DATA = {
  dailyGoal: 10,
  tasks: [],
  subjects: ALL_SUBJECTS.reduce((acc, sub) => ({ ...acc, [sub]: { chapters: [], timeSpent: 0 } }), {}),
  mockTests: [],
  kppList: [],
  history: {}, 
  xp: 0, 
  darkMode: false, // Default to Light Mode per request
  themeColor: "rose", // Default Rose
  bgImage: "",
  selectedExams: [], 
};

// --- HELPER: GET USER SUBJECTS ---
const getUserSubjects = (selectedExams = []) => {
  let showMath = false; let showBio = false;
  if (selectedExams.length === 0) return ALL_SUBJECTS; 
  selectedExams.forEach(exam => {
    const type = EXAM_CONFIG[exam]?.type;
    if (type === 'Math') showMath = true;
    if (type === 'Bio') showBio = true;
  });
  return ALL_SUBJECTS.filter(sub => {
    if (sub === 'Maths' && !showMath) return false;
    if (sub === 'Biology' && !showBio) return false;
    return true;
  });
};

// --- COMPONENTS ---
const Card = ({ children, className = "", darkMode = false }) => (
  <div className={`${darkMode ? 'bg-[#18181b] border-white/10 text-gray-200' : 'bg-white border-gray-100 text-gray-800'} border rounded-2xl p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

// --- SETTINGS PAGE ---
const SettingsPage = ({ data, setData, user }) => {
    const theme = THEMES[data.themeColor] || THEMES.rose;
    const [username, setUsername] = useState(user.displayName || "");

    const handleSaveProfile = async () => {
        if(username !== user.displayName) {
            await updateProfile(auth.currentUser, { displayName: username });
            alert("Profile updated!");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h1 className={`text-3xl font-bold ${data.darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
                <p className="text-gray-500">Manage your account, appearance, and application settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Card */}
                <Card darkMode={data.darkMode}>
                    <div className="flex items-center gap-2 mb-6">
                        <User size={20} />
                        <h2 className="font-bold text-lg">Profile</h2>
                    </div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${theme.primary}`}>
                            {user.displayName?.[0] || "U"}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{user.displayName || "User"}</h3>
                            <p className="text-gray-500 text-sm">{user.email}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                className={`flex-1 p-2 rounded-lg border ${data.darkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 ${theme.ring}`}
                            />
                            <button onClick={handleSaveProfile} className={`px-4 py-2 rounded-lg border font-bold text-sm ${data.darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>Save</button>
                        </div>
                        <p className="text-xs text-gray-400">This is your display name within the app.</p>
                    </div>
                </Card>

                {/* Appearance Card */}
                <Card darkMode={data.darkMode}>
                    <div className="flex items-center gap-2 mb-6">
                        <Monitor size={20} />
                        <h2 className="font-bold text-lg">Appearance</h2>
                    </div>
                    
                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Color Theme</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.keys(THEMES).map(key => (
                                <button 
                                    key={key}
                                    onClick={() => setData({...data, themeColor: key})}
                                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${data.themeColor === key ? `${THEMES[key].light} ${THEMES[key].border} ring-1 ${THEMES[key].ring}` : (data.darkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50')}`}
                                >
                                    <div className={`w-4 h-4 rounded-full ${THEMES[key].primary}`}></div>
                                    <span className="text-sm font-medium capitalize">{key}</span>
                                    {data.themeColor === key && <CheckCircle size={14} className={THEMES[key].text} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Mode</label>
                        <button 
                            onClick={() => setData({...data, darkMode: !data.darkMode})}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${data.darkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                {data.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                                <span className="font-medium">{data.darkMode ? "Dark Mode" : "Light Mode"}</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${data.darkMode ? theme.primary : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${data.darkMode ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </button>
                    </div>
                </Card>

                {/* Creator Card */}
                <Card darkMode={data.darkMode} className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={20} className={theme.text} />
                        <h2 className="font-bold text-lg">About Creator</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${theme.primary}`}>OG</div>
                        <div>
                            <h3 className="font-bold text-xl">Omkar Gunjal</h3>
                            <p className="text-gray-500">JEE 2027 Aspirant & Developer</p>
                            <p className={`text-sm mt-1 ${theme.text}`}>Building tools for future engineers.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- GUIDE MODAL ---
const GuideModal = ({ onClose, darkMode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className={`${darkMode ? 'bg-[#18181b] text-white' : 'bg-white text-gray-900'} w-full max-w-2xl rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><BookOpen size={24} className="text-rose-500"/> PrepPilot Guide</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-6 text-sm leading-relaxed">
                <p>Welcome to <b>PrepPilot Pro</b>, your ultimate cockpit for exam preparation. Here is how to fly:</p>
                
                <div>
                    <h3 className="font-bold text-lg mb-2">1. Dashboard 🏠</h3>
                    <p className="text-gray-500">Your daily command center. See your streaks, today's focus hours, and upcoming tasks. The graph shows your weekly consistency.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">2. Focus Timer ⏱️</h3>
                    <p className="text-gray-500">Distraction-free study. Use <b>Stopwatch</b> to count up or <b>Timer</b> to count down. You can detach it (PiP mode) to keep it visible while watching lectures. Locking prevents subject changes during a session.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">3. Analysis 📊</h3>
                    <p className="text-gray-500">Deep dive into your data. Check the <b>Yearly Heatmap</b> to visualize your consistency (darker green = more study). Filter by Week/Month/Year.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">4. Syllabus & KPP 📚</h3>
                    <p className="text-gray-500">Track chapter completion. Physics students use the <b>KPP Tab</b> for problem practice tracking. Maths/Bio syllabus adjusts automatically based on your exam.</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">5. Support 📧</h3>
                    <p className="text-gray-500">Found a bug or need a feature? Contact Omkar at: <a href="mailto:omkarbg0110@gmail.com" className="text-rose-500 font-bold hover:underline">omkarbg0110@gmail.com</a></p>
                </div>
            </div>
            <button onClick={onClose} className="mt-8 w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700">Got it, Captain!</button>
        </div>
    </div>
);

// --- MAIN APP SHELL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [view, setView] = useState('dashboard'); // dashboard, timer, analysis, syllabus, mocks, kpp, countdowns, settings
  const [loading, setLoading] = useState(true);
  const [showExamSelect, setShowExamSelect] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Derive Theme
  const theme = THEMES[data.themeColor] || THEMES.rose;
  const isDark = data.darkMode;

  // --- AUTO SAVING & AUTH ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.selectedExam && !userData.selectedExams) userData.selectedExams = [userData.selectedExam];
            setData(userData);
            if (!userData.selectedExams || userData.selectedExams.length === 0) setShowExamSelect(true); 
        } else {
            await setDoc(docRef, INITIAL_DATA);
            setShowExamSelect(true); 
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      const timeoutId = setTimeout(async () => { await setDoc(doc(db, "users", user.uid), data); }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [data, user, loading]);

  const saveSession = (subject, seconds) => {
    const mins = parseFloat((seconds/60).toFixed(2));
    const today = new Date().toISOString().split('T')[0];
    const newHistory = { ...data.history, [today]: (data.history?.[today] || 0) + mins };
    const newSubjects = { ...data.subjects, [subject]: { ...data.subjects[subject], timeSpent: data.subjects[subject].timeSpent + seconds } };
    setData(prev => ({ ...prev, subjects: newSubjects, history: newHistory, xp: (prev.xp || 0) + Math.floor(mins) }));
  };

  const handleLogout = async () => { await signOut(auth); setData(INITIAL_DATA); };
  const handleExamSelect = (exams) => { setData(prev => ({ ...prev, selectedExams: exams })); setShowExamSelect(false); };

  if (loading) return <div className="h-screen bg-[#fce7f3] flex items-center justify-center text-rose-600 font-bold">Loading PrepPilot...</div>;
  if (!user) return <LoginScreen />; 
  if (showExamSelect) return <ExamSelectionScreen onSave={handleExamSelect} />;

  // --- COUNTDOWN CALCULATOR ---
  const getCountdowns = () => {
      const exams = data.selectedExams || [];
      if (exams.length === 0) return [];
      const results = exams.map(exam => {
          const config = EXAM_CONFIG[exam];
          if (!config) return null;
          const target = new Date(config.date);
          const now = new Date();
          const diff = target - now;
          if (diff < 0) return { exam, days: 0, hours: 0 };
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          return { exam, days };
      }).filter(Boolean);
      return results.sort((a,b) => a.days - b.days);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-[#09090b] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* GUIDE MODAL */}
      <AnimatePresence>{showGuide && <GuideModal onClose={() => setShowGuide(false)} darkMode={isDark} />}</AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`fixed left-0 top-0 h-full w-64 border-r flex flex-col z-40 hidden md:flex ${isDark ? 'bg-[#09090b] border-white/10' : 'bg-white border-gray-100'}`}>
        <div className="p-6 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme.light} ${theme.text}`}><Zap size={24} /></div>
            <h1 className="text-xl font-bold tracking-tight">PrepPilot</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'syllabus', icon: BookOpen, label: 'Syllabus' },
            { id: 'mocks', icon: FileText, label: 'Mock Tests' },
            { id: 'tasks', icon: CheckSquare, label: 'Daily Tasks' }, // Renamed from sidebar logic, handled in dash currently but added tab for future
            { id: 'countdowns', icon: Calendar, label: 'Countdowns' }, // NEW TAB
            { id: 'timer', icon: TimerIcon, label: 'Focus Timer' },
            { id: 'analysis', icon: PieChartIcon, label: 'Analysis' },
            { id: 'kpp', icon: Target, label: 'Physics KPP' },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setView(item.id)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === item.id ? `${theme.primary} text-white shadow-lg shadow-${data.themeColor}-500/20` : `text-gray-500 hover:${theme.light} hover:${theme.text}`}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="md:ml-64 flex-1 h-screen overflow-y-auto">
        {/* TOP BAR */}
        <header className={`sticky top-0 z-30 px-8 py-4 flex justify-between items-center border-b backdrop-blur-md ${isDark ? 'bg-[#09090b]/80 border-white/5' : 'bg-white/80 border-gray-100'}`}>
           <h2 className="text-xl font-bold capitalize flex items-center gap-2">
             {view === 'kpp' ? 'Physics KPP' : view}
           </h2>
           <div className="flex items-center gap-4">
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                   Good afternoon, {user.displayName?.split(' ')[0]}!
               </div>
               <button onClick={() => setShowGuide(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                   <HelpCircle size={16} /> Guide
               </button>
               <ProfileDropdown user={user} onLogout={handleLogout} onChangeExam={() => setView('settings')} />
           </div>
        </header>

        <div className="p-8 pb-24">
            {view === 'dashboard' && <Dashboard data={data} setData={setData} theme={theme} isDark={isDark} />}
            {view === 'analysis' && <Analysis data={data} theme={theme} isDark={isDark} />} 
            {view === 'timer' && <FocusTimer data={data} setData={setData} onSaveSession={saveSession} theme={theme} isDark={isDark} />} 
            {view === 'syllabus' && <Syllabus data={data} setData={setData} theme={theme} isDark={isDark} />}
            {view === 'mocks' && <MockTestTracker data={data} setData={setData} theme={theme} isDark={isDark} />}
            {view === 'kpp' && <PhysicsKPP data={data} setData={setData} theme={theme} isDark={isDark} />} 
            {view === 'settings' && <SettingsPage data={data} setData={setData} user={user} />}
            {view === 'tasks' && <TasksPage data={data} setData={setData} theme={theme} isDark={isDark} />}
            
            {/* NEW COUNTDOWNS TAB */}
            {view === 'countdowns' && (
                <div className="max-w-5xl mx-auto">
                    <h1 className={`text-3xl font-bold mb-6 ${isDark?'text-white':'text-gray-900'}`}>Exam Countdowns</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getCountdowns().map((cd, i) => (
                            <Card key={i} darkMode={isDark} className="flex flex-col items-center justify-center py-10 relative overflow-hidden group">
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${theme.primary}`}></div>
                                <div className={`text-6xl font-bold mb-2 ${theme.text}`}>{cd.days}</div>
                                <div className="text-gray-500 font-medium uppercase tracking-wider text-sm">Days Left</div>
                                <div className={`mt-4 px-4 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{cd.exam}</div>
                            </Card>
                        ))}
                        {getCountdowns().length === 0 && <p className="text-gray-500">No exams selected. Go to Settings to add exams.</p>}
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* MOBILE NAV */}
      <div className={`md:hidden fixed bottom-0 left-0 w-full border-t p-4 flex justify-around z-50 ${isDark ? 'bg-[#09090b] border-white/10' : 'bg-white border-gray-100'}`}>
        <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? theme.text : 'text-gray-400'}><LayoutDashboard /></button>
        <button onClick={() => setView('timer')} className={view === 'timer' ? theme.text : 'text-gray-400'}><TimerIcon /></button>
        <button onClick={() => setView('tasks')} className={view === 'tasks' ? theme.text : 'text-gray-400'}><CheckSquare /></button>
        <button onClick={() => setView('analysis')} className={view === 'analysis' ? theme.text : 'text-gray-400'}><PieChartIcon /></button>
      </div>
    </div>
  );
}

// --- TASKS PAGE (New Dedicated Tab) ---
const TasksPage = ({ data, setData, theme, isDark }) => {
    const addTask = () => { 
        const t = prompt("Task Name:"); 
        if(!t) return;
        const sub = prompt("Subject? (P, C, M, B or Leave empty)");
        let subjectTag = "General";
        if(sub) {
            if(sub.toLowerCase().startsWith('p')) subjectTag = "Physics";
            else if(sub.toLowerCase().startsWith('c')) subjectTag = "Chemistry";
            else if(sub.toLowerCase().startsWith('m')) subjectTag = "Maths";
            else if(sub.toLowerCase().startsWith('b')) subjectTag = "Biology";
        }
        setData(prev => ({ ...prev, tasks: [{ id: Date.now(), text: t, subject: subjectTag, completed: false }, ...prev.tasks] })); 
    };
    const toggleTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
    const removeTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div><h1 className={`text-3xl font-bold ${isDark?'text-white':'text-gray-900'}`}>Daily Tasks</h1><p className="text-gray-500">Stay organized and productive.</p></div>
                <button onClick={addTask} className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg ${theme.primary} ${theme.hover} flex items-center gap-2`}><Plus size={18}/> Add Task</button>
            </div>
            <div className="space-y-3">
                {data.tasks.map(task => (
                    <Card key={task.id} darkMode={isDark} className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleTask(task.id)}>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? `${theme.primary} border-transparent` : 'border-gray-300'}`}>
                                {task.completed && <CheckCircle size={16} className="text-white" />}
                            </div>
                            <div>
                                <span className={`block text-lg ${task.completed ? 'text-gray-400 line-through' : (isDark?'text-gray-200':'text-gray-800')}`}>{task.text}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{task.subject}</span>
                            </div>
                        </div>
                        <button onClick={() => removeTask(task.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                    </Card>
                ))}
                {data.tasks.length === 0 && <div className="text-center py-20 text-gray-400">No tasks yet. Time to plan! 🚀</div>}
            </div>
        </div>
    );
};

// --- PLACEHOLDER COMPONENTS FOR EXPORT (Dashboard, Analysis, etc. need theme prop now) ---
// *Note: I've updated the props passed to these components in the App function above. 
// You should update the component definitions (Dashboard, Analysis, etc.) to accept { theme, isDark } 
// and use them for colors instead of hardcoded 'bg-violet-600' etc. 
// For brevity, I am providing the updated 'Dashboard' as an example. You can apply similar logic to others.*

const Dashboard = ({ data, setData, theme, isDark }) => {
  const today = new Date().toISOString().split('T')[0];
  const history = data.history || {};
  const todayMins = history[today] || 0;
  
  // Streak
  let streak = 0;
  if ((history[today] || 0) > 0) streak++;
  let d = new Date(); d.setDate(d.getDate() - 1);
  while (true) { if ((history[d.toISOString().split('T')[0]] || 0) > 0) { streak++; d.setDate(d.getDate() - 1); } else break; }

  // Weekly Data
  const getWeeklyData = () => {
    const now = new Date(); const currentDay = now.getDay(); const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - currentDay);
    const chartData = [];
    for (let i = 0; i < 7; i++) { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); const dateStr = d.toISOString().split('T')[0]; chartData.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), hours: parseFloat(((history[dateStr] || 0) / 60).toFixed(1)) }); }
    return chartData;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <Card darkMode={isDark} className="relative overflow-hidden border-none">
          <div className={`absolute inset-0 opacity-10 ${theme.primary}`}></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Today's Focus</p>
                  <h1 className={`text-6xl font-bold ${theme.text}`}>{Math.floor(todayMins/60)}h <span className="text-3xl text-gray-400">{Math.round(todayMins%60)}m</span></h1>
              </div>
              <div className="flex gap-6">
                  <div className="text-center">
                      <div className={`text-3xl font-bold ${isDark?'text-white':'text-gray-900'}`}>{streak} 🔥</div>
                      <div className="text-xs text-gray-500 font-bold uppercase">Streak</div>
                  </div>
                  <div className="text-center">
                      <div className={`text-3xl font-bold ${isDark?'text-white':'text-gray-900'}`}>{Math.round((todayMins/(data.dailyGoal*60))*100)}%</div>
                      <div className="text-xs text-gray-500 font-bold uppercase">Goal</div>
                  </div>
              </div>
          </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPH */}
        <Card darkMode={isDark} className="lg:col-span-2 h-[350px] flex flex-col">
          <h3 className={`font-bold text-lg mb-4 ${isDark?'text-white':'text-gray-800'}`}>Weekly Activity</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getWeeklyData()}>
                <defs><linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={isDark ? "#fff" : "#e11d48"} stopOpacity={0.8}/><stop offset="95%" stopColor={isDark ? "#fff" : "#e11d48"} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis hide />
                <RechartsTooltip contentStyle={{backgroundColor: isDark?'#18181b':'#fff', borderRadius: '8px', border: isDark?'1px solid #333':'1px solid #eee'}} />
                <Area type="monotone" dataKey="hours" stroke={isDark ? "#8b5cf6" : "#e11d48"} strokeWidth={3} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* RECENT TASKS */}
        <Card darkMode={isDark} className="flex flex-col">
           <h3 className={`font-bold text-lg mb-4 ${isDark?'text-white':'text-gray-800'}`}>Pending Tasks</h3>
           <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
             {data.tasks.filter(t => !t.completed).slice(0, 5).map(task => (
               <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                   <div className={`w-2 h-2 rounded-full ${theme.primary}`}></div>
                   <span className="text-sm truncate flex-1">{task.text}</span>
               </div>
             ))}
             {data.tasks.filter(t => !t.completed).length === 0 && <div className="text-center text-gray-400 py-10 text-sm">All caught up! 🎉</div>}
           </div>
        </Card>
      </div>
    </div>
  );
};