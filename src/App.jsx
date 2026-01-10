import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, Zap, Flame, Trophy, 
  Play, Pause, CheckCircle, X, ChevronRight, 
  Plus, Trash2, FileText, TrendingUp, LogOut
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIREBASE IMPORTS ---
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase"; 

/**
 * JEEPLANET PRO - v10.0 (Restored & Polished)
 */

// --- CONSTANTS ---
const SUBJECTS = ["Physics", "Maths", "Organic Chem", "Inorganic Chem", "Physical Chem"];
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981']; 

const INITIAL_DATA = {
  notepad: "",
  dailyGoal: 10,
  tasks: [],
  subjects: SUBJECTS.reduce((acc, sub) => ({
    ...acc,
    [sub]: { chapters: [], timeSpent: 0 }
  }), {}),
  mockTests: [],
  history: {}, 
  xp: 0, 
  darkMode: true
};

// --- UTILITY COMPONENTS ---
const GlassCard = ({ children, className = "", hover = false }) => (
  <motion.div 
    whileHover={hover ? { scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" } : {}}
    className={`bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl ${className}`}
  >
    {children}
  </motion.div>
);

// --- 1. LOGIN SCREEN ---
const LoginScreen = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error logging in", error);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="h-screen w-full bg-[#09090b] flex flex-col items-center justify-center text-center p-6">
      
      {/* --- CUSTOM LOGO HERE --- */}
      <div className="mb-8">
        <img 
          src="/logo.png" 
          alt="JEEPlanet Logo" 
          className="h-32 w-32 object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
        />
      </div>

      <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
        JEEPlanet <span className="text-violet-500">Pro</span>
      </h1>
      <p className="text-gray-400 mb-8 max-w-md">
        Sync your syllabus, track your streak, and analyze mock tests across all your devices.
      </p>
      <button 
        onClick={handleLogin}
        className="px-8 py-4 bg-white text-black font-bold rounded-xl flex items-center gap-3 hover:bg-gray-200 transition-transform active:scale-95 shadow-xl shadow-white/10"
      >
        <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
        Continue with Google
      </button>
    </div>
  );
};

// --- 2. ZEN FOCUS MODE ---
const ZenTimer = ({ data, onSaveSession, onExit }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSub, setSelectedSub] = useState(SUBJECTS[0]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => setTimeLeft(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    setIsActive(false);
    onSaveSession(selectedSub, timeLeft);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center text-white"
    >
      <div className="z-10 flex flex-col items-center gap-8 w-full max-w-md px-6">
        <div className="flex items-center gap-2 text-violet-400 font-medium tracking-widest uppercase text-sm">
          <Zap size={16} className="animate-pulse" /> Focus Mode
        </div>

        <div className="text-[6rem] md:text-[9rem] font-bold font-mono tracking-tighter leading-none tabular-nums bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          {formatTime(timeLeft)}
        </div>

        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10 w-full">
            <span className="text-gray-400 text-sm pl-2">Subject:</span>
            <select 
              className="bg-transparent text-white font-bold flex-1 outline-none"
              value={selectedSub}
              onChange={(e) => setSelectedSub(e.target.value)}
            >
              {SUBJECTS.map(s => <option key={s} value={s} className="bg-gray-900">{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-4">
            {!isActive ? (
              <button onClick={() => setIsActive(true)} className="h-16 w-16 bg-violet-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition shadow-lg shadow-violet-600/30">
                <Play fill="white" size={28} />
              </button>
            ) : (
              <button onClick={() => setIsActive(false)} className="h-16 w-16 bg-orange-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition">
                <Pause fill="white" size={28} />
              </button>
            )}
            
            {timeLeft > 0 && !isActive && (
              <button onClick={handleFinish} className="px-6 py-3 bg-white/10 text-white border border-white/10 rounded-xl font-bold hover:bg-white/20 transition">
                Save
              </button>
            )}
          </div>
        </div>

        <button onClick={onExit} className="absolute top-8 right-8 text-gray-500 hover:text-white transition">
          <X size={24} />
        </button>
      </div>
    </motion.div>
  );
};

// --- 3. MOCK TEST TRACKER ---
const MockTestTracker = ({ data, setData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState('All'); 
  const [testType, setTestType] = useState('Mains');
  const [newTest, setNewTest] = useState({ 
    name: '', date: '', p: '', c: '', m: '', maxMarks: 300 
  });

  const addTest = () => {
    if (!newTest.name || !newTest.date) return;
    const p = parseFloat(newTest.p) || 0;
    const c = parseFloat(newTest.c) || 0;
    const m = parseFloat(newTest.m) || 0;
    const total = p + c + m;
    
    const max = testType === 'Mains' ? 300 : (parseInt(newTest.maxMarks) || 360);

    const testEntry = { 
      id: Date.now(), 
      type: testType,
      name: newTest.name, 
      date: newTest.date, 
      p, c, m, 
      total,
      maxMarks: max
    };

    setData(prev => ({ ...prev, mockTests: [...(prev.mockTests || []), testEntry] }));
    setIsAdding(false);
    setNewTest({ name: '', date: '', p: '', c: '', m: '', maxMarks: 300 });
  };

  const deleteTest = (id) => {
    if(window.confirm("Delete this test record?")) {
      setData(prev => ({ ...prev, mockTests: prev.mockTests.filter(t => t.id !== id) }));
    }
  };

  const filteredTests = (data.mockTests || []).filter(t => {
    if (filterType === 'All') return true;
    return t.type === filterType || (!t.type && filterType === 'Mains'); 
  });
  
  const sortedTests = [...filteredTests].sort((a,b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white mb-2">Mock Test Analysis</h1>
           <p className="text-gray-400">Track scores for JEE Mains & Advanced separately.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setFilterType('All')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${filterType==='All' ? 'bg-white text-black border-white' : 'border-white/10 text-gray-400'}`}>All</button>
            <button onClick={() => setFilterType('Mains')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${filterType==='Mains' ? 'bg-violet-600 text-white border-violet-600' : 'border-white/10 text-gray-400'}`}>Mains</button>
            <button onClick={() => setFilterType('Advanced')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${filterType==='Advanced' ? 'bg-orange-500 text-white border-orange-500' : 'border-white/10 text-gray-400'}`}>Adv</button>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-600/20 flex items-center gap-2">
          {isAdding ? <X size={18}/> : <Plus size={18}/>} {isAdding ? 'Cancel' : 'Log New Test'}
        </button>
      </div>

      {isAdding && (
        <GlassCard className="animate-in fade-in slide-in-from-top-4 border-t-4 border-t-violet-500">
          <div className="flex gap-4 mb-6">
             <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="testType" className="accent-violet-500 w-5 h-5" checked={testType === 'Mains'} onChange={() => setTestType('Mains')} />
                <span className={testType === 'Mains' ? 'text-white font-bold' : 'text-gray-400'}>JEE Mains (300)</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="testType" className="accent-orange-500 w-5 h-5" checked={testType === 'Advanced'} onChange={() => setTestType('Advanced')} />
                <span className={testType === 'Advanced' ? 'text-white font-bold' : 'text-gray-400'}>JEE Advanced (Custom)</span>
             </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">Test Name</label>
              <input type="text" placeholder={testType === 'Mains' ? "e.g., Full Syllabus Test 1" : "e.g., Paper 1 + Paper 2"} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-violet-500 outline-none" 
                value={newTest.name} onChange={e => setNewTest({...newTest, name: e.target.value})} />
            </div>
            <div className="md:col-span-1 space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase">Date</label>
              <input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-violet-500 outline-none" 
                value={newTest.date} onChange={e => setNewTest({...newTest, date: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-violet-400 font-bold uppercase">Physics</label>
              <input type="number" placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-violet-500 outline-none" 
                value={newTest.p} onChange={e => setNewTest({...newTest, p: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-green-400 font-bold uppercase">Chem</label>
              <input type="number" placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-violet-500 outline-none" 
                value={newTest.c} onChange={e => setNewTest({...newTest, c: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-blue-400 font-bold uppercase">Maths</label>
              <input type="number" placeholder="0" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-violet-500 outline-none" 
                value={newTest.m} onChange={e => setNewTest({...newTest, m: e.target.value})} />
            </div>
          </div>

          {testType === 'Advanced' && (
              <div className="mt-4 pt-4 border-t border-white/5">
                  <label className="text-xs text-orange-400 font-bold uppercase">Total Max Marks (Custom)</label>
                  <div className="flex items-center gap-4">
                      <input type="number" placeholder="e.g. 360, 180, 400" className="w-40 bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                      value={newTest.maxMarks} onChange={e => setNewTest({...newTest, maxMarks: e.target.value})} />
                      <span className="text-xs text-gray-500">Since Advanced pattern changes every year, enter the total marks for this specific test.</span>
                  </div>
              </div>
          )}

          <button onClick={addTest} className={`mt-6 w-full py-3 font-bold rounded-lg transition text-white ${testType === 'Mains' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
              Save {testType} Score
          </button>
        </GlassCard>
      )}

      {sortedTests.length > 0 ? (
        <GlassCard className="h-[350px]">
           <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp size={20}/> {filterType} Performance Trend</h3>
           </div>
           <ResponsiveContainer width="100%" height="85%">
             <LineChart data={sortedTests}>
               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
               <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
               <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'auto']} />
               <RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff'}} />
               <Legend />
               <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} dot={{r:4}} name="Total Score" />
               <Line type="monotone" dataKey="p" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Physics" />
               <Line type="monotone" dataKey="c" stroke="#10b981" strokeWidth={2} dot={false} name="Chemistry" />
               <Line type="monotone" dataKey="m" stroke="#3b82f6" strokeWidth={2} dot={false} name="Maths" />
             </LineChart>
           </ResponsiveContainer>
        </GlassCard>
      ) : (
        <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl text-gray-500">
           No {filterType !== 'All' ? filterType : ''} mock tests logged yet.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {sortedTests.slice().reverse().map(test => (
          <div key={test.id} className="group bg-[#121212] border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-white/20 transition">
             <div className="flex gap-4 items-center">
                <div className={`w-1 h-12 rounded-full ${test.type === 'Advanced' ? 'bg-orange-500' : 'bg-violet-500'}`}></div>
                <div>
                    <div className="flex items-center gap-3">
                    <h3 className="font-bold text-white">{test.name}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${test.type === 'Advanced' ? 'bg-orange-500/20 text-orange-400' : 'bg-violet-500/20 text-violet-400'}`}>
                        {test.type || 'Mains'}
                    </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{test.date}</div>
                    <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-violet-400">P: {test.p}</span>
                    <span className="text-green-400">C: {test.c}</span>
                    <span className="text-blue-400">M: {test.m}</span>
                    </div>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <div className="text-right">
                   <div className="text-2xl font-bold text-white">
                       {test.total} <span className="text-sm text-gray-500 font-normal">/ {test.maxMarks || 300}</span>
                   </div>
                   <div className="text-xs text-gray-500 uppercase">
                       {Math.round((test.total / (test.maxMarks || 300)) * 100)}%
                   </div>
                </div>
                <button onClick={() => deleteTest(test.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                   <Trash2 size={18} />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 4. SYLLABUS COMPONENT ---
const Syllabus = ({ data, setData }) => {
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [gradeView, setGradeView] = useState('11');

  const addChapter = () => {
    const name = prompt(`Enter Class ${gradeView} Chapter Name:`);
    if (!name) return;
    const lectures = prompt("Total Main Lectures:");
    
    if (name && lectures) {
      const newChapter = {
        id: Date.now().toString(),
        name,
        totalLectures: parseInt(lectures),
        lectures: new Array(parseInt(lectures)).fill(false),
        grade: gradeView
      };
      const newData = { ...data };
      newData.subjects[selectedSubject].chapters.push(newChapter);
      setData(newData);
    }
  };

  const updateChapter = (updated) => {
    const newData = { ...data };
    const idx = newData.subjects[selectedSubject].chapters.findIndex(c => c.id === updated.id);
    newData.subjects[selectedSubject].chapters[idx] = updated;
    setData(newData);
  };

  const deleteChapter = (id) => {
    if(window.confirm("Delete chapter?")) {
      const newData = { ...data };
      newData.subjects[selectedSubject].chapters = newData.subjects[selectedSubject].chapters.filter(c => c.id !== id);
      setData(newData);
    }
  };

  const filteredChapters = data.subjects[selectedSubject].chapters.filter(
    c => c.grade === gradeView || (!c.grade && gradeView === '11')
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Syllabus Tracker</h1>
          <p className="text-gray-400">Organized by Class 11 & 12</p>
        </div>
        <button onClick={addChapter} className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-600/20 flex items-center gap-2">
          <Plus size={18} /> Add {selectedSubject} Ch ({gradeView}th)
        </button>
      </div>

      <div className="flex gap-4 p-1 bg-white/5 w-fit rounded-xl">
        {['11', '12'].map(g => (
          <button
            key={g}
            onClick={() => setGradeView(g)}
            className={`px-8 py-2 rounded-lg text-sm font-bold transition-all ${gradeView === g ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Class {g}th
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {SUBJECTS.map(s => (
          <button key={s} onClick={() => setSelectedSubject(s)} 
            className={`px-6 py-3 rounded-xl whitespace-nowrap text-sm font-bold transition ${selectedSubject === s ? 'bg-white text-black' : 'bg-[#121212] border border-white/10 text-gray-400 hover:bg-white/5'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredChapters.map(chapter => (
           <ChapterItem key={chapter.id} chapter={chapter} onUpdate={updateChapter} onDelete={deleteChapter} />
        ))}
        {filteredChapters.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl text-gray-600">
            No Class {gradeView} chapters added for {selectedSubject} yet.
          </div>
        )}
      </div>
    </div>
  );
};

const ChapterItem = ({ chapter, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const completed = chapter.lectures.filter(l => l).length;
  const progress = chapter.totalLectures > 0 ? Math.round((completed/chapter.totalLectures)*100) : 0;

  const toggleLec = (i) => {
    const newLecs = [...chapter.lectures];
    newLecs[i] = !newLecs[i];
    onUpdate({ ...chapter, lectures: newLecs });
  };

  return (
    <GlassCard className="transition-all">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${progress===100 ? 'bg-green-500/20 text-green-500' : 'bg-violet-500/20 text-violet-500'}`}>
            {progress===100 ? <CheckCircle size={24} /> : <BookOpen size={24} />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{chapter.name}</h3>
            <p className="text-sm text-gray-400">{completed}/{chapter.totalLectures} Lectures • {progress}% Complete</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onDelete(chapter.id); }} className="p-2 text-gray-600 hover:text-red-500 transition"><Trash2 size={18}/></button>
          <ChevronRight className={`text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {expanded && (
        <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="mt-6 pt-6 border-t border-white/5">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {chapter.lectures.map((done, i) => (
              <button key={i} onClick={() => toggleLec(i)} className={`p-2 rounded-lg text-sm font-bold border transition ${done ? 'bg-violet-600 border-violet-600 text-white' : 'bg-transparent border-white/10 text-gray-500 hover:border-violet-500'}`}>
                Lec {i+1}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
};

// --- 5. DASHBOARD ---
const Dashboard = ({ data, setData, startFocus, user }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayMins = data.history?.[today] || 0;
  const xp = data.xp || 0;
  const level = Math.floor(xp / 1000);
  const nextLevelXP = (level + 1) * 1000;
  const levelProgress = Math.round((xp / nextLevelXP) * 100);

  const getStreak = () => {
    let streak = 0;
    const history = data.history || {};
    const threshold = 120; // 2 Hours
    if ((history[today] || 0) >= threshold) streak++;
    let d = new Date();
    d.setDate(d.getDate() - 1);
    while (true) {
      const dateStr = d.toISOString().split('T')[0];
      if ((history[dateStr] || 0) >= threshold) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const mins = data.history?.[dateStr] || 0;
        chartData.push({ name: days[d.getDay()], hours: parseFloat((mins / 60).toFixed(1)) });
    }
    return chartData;
  };

  const getSubjectDistribution = () => {
    const pTime = data.subjects["Physics"]?.timeSpent || 0;
    const mTime = data.subjects["Maths"]?.timeSpent || 0;
    const cTime = (data.subjects["Organic Chem"]?.timeSpent || 0) + 
                  (data.subjects["Inorganic Chem"]?.timeSpent || 0) + 
                  (data.subjects["Physical Chem"]?.timeSpent || 0);
    if (pTime + cTime + mTime === 0) return [{name: 'No Data', value: 1}];
    return [
      { name: 'Physics', value: pTime },
      { name: 'Maths', value: mTime },
      { name: 'Chemistry', value: cTime },
    ];
  };

  const addTask = () => {
    const t = prompt("What is your main task?");
    if(t) {
      const newTask = { id: Date.now(), text: t, completed: false };
      setData(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    }
  };

  const toggleTask = (id) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const removeTask = (id) => {
    setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  const pieData = getSubjectDistribution();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="bg-[#121212] border border-white/10 p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              Hello, {user?.displayName?.split(' ')[0] || 'Aspirant'}! <span className="animate-pulse">👋</span>
            </h1>
            <p className="text-gray-400">Your data is syncing with the cloud.</p>
            <div className={`mt-4 flex items-center gap-2 text-sm font-bold ${getStreak() > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
               <Flame size={16} fill="currentColor" /> {getStreak()} day streak!
            </div>
          </div>
          <button onClick={startFocus} className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-transform active:scale-95">
            <Play size={18} fill="currentColor" /> Start Studying
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Level</span>
            <Trophy size={16} className="text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-white">Lv {level}</div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 transition-all" style={{ width: `${levelProgress}%` }} />
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total XP</span>
            <Zap size={16} className="text-violet-500" />
          </div>
          <div className="text-3xl font-bold text-white">{xp.toLocaleString()}</div>
          <div className="text-xs text-gray-500">1 min = 1 XP</div>
        </GlassCard>

        <GlassCard className="col-span-1 md:col-span-2 flex flex-col justify-between h-32">
           <div className="flex justify-between items-start">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Daily Goal</span>
            <BookOpen size={16} className="text-green-500" />
          </div>
          <div className="w-full">
            <div className="flex justify-between text-white font-bold mb-2">
               <span>{Math.round((todayMins / (data.dailyGoal*60)) * 100)}%</span>
               <span className="text-gray-500 text-sm">{data.dailyGoal}h Target</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 transition-all duration-1000" style={{ width: `${Math.min((todayMins / (data.dailyGoal*60)) * 100, 100)}%` }} />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* GRAPHS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 min-h-[350px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Study Trends (Last 7 Days)</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getWeeklyData()}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis hide domain={[0, 'auto']} />
                <RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff'}} itemStyle={{color: '#a78bfa'}} formatter={(value) => [`${value} hrs`, "Study Time"]} />
                <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* PIE CHART SECTION */}
        <GlassCard className="min-h-[350px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-4">Subject Balance</h3>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'No Data' ? '#333' : COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px'}} formatter={(val, name) => [name === 'No Data' ? '0' : `${Math.round(val/60)}m`, name]} />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
             {/* Center Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
               <span className="text-gray-500 text-xs font-bold uppercase">Total Time</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* TASKS */}
      <GlassCard>
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold text-white">To Do</h3>
           <button onClick={addTask} className="text-xs px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20 transition">+ Add</button>
         </div>
         <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
           {data.tasks.map(task => (
             <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-violet-500/50 transition group">
               <div className="flex items-center gap-3">
                 <div onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded-full border-2 border-gray-600 group-hover:border-violet-500 cursor-pointer flex items-center justify-center ${task.completed ? 'bg-violet-500 border-violet-500' : ''}`}>
                   {task.completed && <CheckCircle size={12} className="text-white" />}
                 </div>
                 <span className={task.completed ? 'text-gray-500 line-through text-sm' : 'text-gray-200 text-sm'}>{task.text}</span>
               </div>
               <button onClick={() => removeTask(task.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={14}/></button>
             </div>
           ))}
           {data.tasks.length === 0 && <div className="text-center text-gray-600 text-sm py-8">No active tasks</div>}
         </div>
      </GlassCard>
    </div>
  );
};

// --- MAIN APP SHELL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch data from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          // Initialize new user in DB
          await setDoc(docRef, INITIAL_DATA);
          setData(INITIAL_DATA);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Auto-Save to Firestore when 'data' changes
  useEffect(() => {
    if (user && !loading) {
      const saveData = async () => {
        try {
          await setDoc(doc(db, "users", user.uid), data);
        } catch (err) {
          console.error("Error saving data:", err);
        }
      };
      // Simple debounce to prevent too many writes
      const timeoutId = setTimeout(saveData, 1000); 
      return () => clearTimeout(timeoutId);
    }
  }, [data, user, loading]);

  const saveSession = (subject, seconds) => {
    const mins = parseFloat((seconds/60).toFixed(2));
    const today = new Date().toISOString().split('T')[0];
    const gainedXp = Math.floor(mins); 

    setData(prev => {
      const prevMins = prev.history?.[today] || 0;
      const prevHistory = prev.history || {};
      return {
        ...prev,
        subjects: {
          ...prev.subjects,
          [subject]: { ...prev.subjects[subject], timeSpent: prev.subjects[subject].timeSpent + seconds }
        },
        history: { ...prevHistory, [today]: prevMins + mins },
        xp: (prev.xp || 0) + gainedXp,
      };
    });
    setView('dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setData(INITIAL_DATA);
  };

  if (loading) return (
    <div className="h-screen w-full bg-[#09090b] flex items-center justify-center text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
    </div>
  );

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans selection:bg-violet-500/30">
      <AnimatePresence>
        {view === 'zen' && <ZenTimer data={data} onSaveSession={saveSession} onExit={() => setView('dashboard')} />}
      </AnimatePresence>

      <aside className="fixed left-0 top-0 h-full w-20 bg-[#09090b] border-r border-white/10 flex flex-col items-center py-8 z-40 hidden md:flex">
        
        {/* --- SIDEBAR LOGO --- */}
        <div className="mb-12 p-2 bg-white/5 rounded-2xl border border-white/10 shadow-lg">
           <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
        </div>

        <nav className="flex flex-col gap-8 w-full">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
            { id: 'syllabus', icon: BookOpen, label: 'Syllabus' },
            { id: 'mocks', icon: FileText, label: 'Mocks' },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`relative group w-full flex justify-center py-3 border-l-2 transition-all duration-300 ${view === item.id ? 'border-violet-500 text-white' : 'border-transparent text-gray-600 hover:text-violet-400'}`}>
              <item.icon size={24} />
              <span className="absolute left-14 bg-white text-black px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition pointer-events-none">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <button onClick={handleLogout} className="p-3 text-gray-600 hover:text-red-500 transition" title="Logout">
            <LogOut size={24} />
          </button>
        </div>
      </aside>

      <main className="md:ml-20 p-6 md:p-10 pb-24">
        {view === 'dashboard' && <Dashboard data={data} setData={setData} startFocus={() => setView('zen')} user={user} />}
        {view === 'syllabus' && <Syllabus data={data} setData={setData} />}
        {view === 'mocks' && <MockTestTracker data={data} setData={setData} />}
      </main>

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#09090b]/90 backdrop-blur-md border-t border-white/10 p-4 flex justify-around z-40">
        <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-violet-500' : 'text-gray-500'}><LayoutDashboard /></button>
        <button onClick={() => setView('zen')} className="bg-white text-black p-4 rounded-full -mt-8 shadow-lg shadow-white/20"><Play fill="black" /></button>
        <button onClick={() => setView('syllabus')} className={view === 'syllabus' ? 'text-violet-500' : 'text-gray-500'}><BookOpen /></button>
        <button onClick={() => setView('mocks')} className={view === 'mocks' ? 'text-violet-500' : 'text-gray-500'}><FileText /></button>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-500"><LogOut /></button>
      </div>
    </div>
  );
}