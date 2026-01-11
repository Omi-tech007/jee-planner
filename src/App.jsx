import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, BookOpen, Zap, Flame, Trophy, 
  Play, Pause, CheckCircle, X, ChevronRight, 
  Plus, Trash2, FileText, TrendingUp, LogOut,
  Timer as TimerIcon, StopCircle, Target, User,
  Settings, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- FIREBASE IMPORTS ---
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase"; 

/**
 * JEEPLANET PRO - v16.0 (Floating Timer + Custom BG + Subject Lock)
 */

// --- CONSTANTS ---
const SUBJECTS = ["Physics", "Maths", "Organic Chem", "Inorganic Chem", "Physical Chem"];
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981']; 

const INITIAL_DATA = {
  dailyGoal: 10,
  tasks: [],
  subjects: SUBJECTS.reduce((acc, sub) => ({
    ...acc,
    [sub]: { chapters: [], timeSpent: 0 }
  }), {}),
  mockTests: [],
  kppList: [],
  history: {}, 
  xp: 0, 
  darkMode: true,
  bgImage: "" // New: For custom timer background
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

// --- PROFILE DROPDOWN ---
const ProfileDropdown = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 p-1 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
        <div className="hidden md:block text-right mr-1">
          <p className="text-sm font-bold text-white leading-none">{user.displayName?.split(' ')[0]}</p>
          <p className="text-[10px] text-gray-400 leading-none mt-1">JEE Aspirant</p>
        </div>
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-violet-500/50" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold border-2 border-violet-400">{user.displayName?.[0] || "U"}</div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-72 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 bg-white/5">
               <p className="text-white font-bold">{user.displayName}</p>
               <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
            </div>
            <div className="p-2">
               <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold">
                 <LogOut size={16} /> Log Out
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- 1. LOGIN SCREEN ---
const LoginScreen = () => {
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (error) { alert("Login failed: " + error.message); }
  };
  return (
    <div className="h-screen w-full bg-[#09090b] flex flex-col items-center justify-center text-center p-6">
      <div className="mb-8 p-6 bg-violet-600/20 rounded-full animate-pulse"><Zap size={64} className="text-violet-500" /></div>
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">JEEPlanet <span className="text-violet-500">Pro</span></h1>
      <button onClick={handleLogin} className="px-8 py-4 bg-white text-black font-bold rounded-xl flex items-center gap-3 hover:bg-gray-200 transition-transform active:scale-95 shadow-xl shadow-white/10">
        <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" /> Continue with Google
      </button>
    </div>
  );
};

// --- 2. FOCUS TIMER (Floating + Custom BG) ---
const FocusTimer = ({ data, setData, onSaveSession }) => {
  const [mode, setMode] = useState('stopwatch'); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [initialTimerTime, setInitialTimerTime] = useState(60); 
  const [isActive, setIsActive] = useState(false);
  const [selectedSub, setSelectedSub] = useState(SUBJECTS[0]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Floating Window Refs
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  // Timer Logic & Floating Window Update
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
           let newVal = mode === 'timer' ? prev - 1 : prev + 1;
           if (mode === 'timer' && newVal <= 0) { setIsActive(false); alert("Timer Finished!"); return 0; }
           
           // Update Floating Window (PiP)
           if (document.pictureInPictureElement && canvasRef.current) {
               updatePiPCanvas(newVal);
           }
           
           // Update Tab Title
           document.title = `(${formatTime(newVal)}) JEEPlanet`;
           return newVal;
        });
      }, 1000);
    } else {
        document.title = "JEEPlanet Pro";
    }
    return () => clearInterval(interval);
  }, [isActive, mode]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // --- FLOATING WINDOW (PiP) LOGIC ---
  const updatePiPCanvas = (time) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#8b5cf6'; // Violet color
      ctx.font = 'bold 80px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatTime(time), canvas.width / 2, canvas.height / 2);
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (canvas && video) {
            // Initial draw
            updatePiPCanvas(timeLeft);
            // Stream canvas to video
            const stream = canvas.captureStream();
            video.srcObject = stream;
            // Play video (required for PiP)
            await video.play();
            await video.requestPictureInPicture();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Floating mode failed. Try using Chrome/Edge on Desktop.");
    }
  };

  const handleStart = () => { if (mode === 'timer' && timeLeft === 0) setTimeLeft(initialTimerTime * 60); setIsActive(true); };
  const handleStop = () => {
    setIsActive(false);
    let timeSpentSeconds = mode === 'stopwatch' ? timeLeft : (initialTimerTime * 60) - timeLeft;
    if (timeSpentSeconds > 60) {
        if(window.confirm(`Save ${Math.floor(timeSpentSeconds/60)} minutes of study?`)) { onSaveSession(selectedSub, timeSpentSeconds); setTimeLeft(0); }
    } else { setTimeLeft(0); }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayMins = data.history?.[today] || 0;
  const goalMins = data.dailyGoal * 60;
  const percent = Math.min((todayMins / goalMins) * 100, 100);

  return (
    <div 
        className="h-full flex flex-col relative overflow-hidden rounded-3xl transition-all duration-500 bg-cover bg-center"
        style={{ backgroundImage: data.bgImage ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(${data.bgImage})` : 'none' }}
    >
      {/* Hidden Elements for PiP */}
      <canvas ref={canvasRef} width={400} height={200} className="hidden" />
      <video ref={videoRef} className="hidden" muted />

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
          <div className="bg-[#18181b]/90 backdrop-blur border border-white/10 rounded-full py-2 px-4 flex items-center gap-3 w-64 shadow-lg">
             <div className="flex flex-col flex-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1"><span>Daily Goal</span><span>{Math.round(todayMins/60)}h / {data.dailyGoal}h</span></div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-violet-500 transition-all duration-500" style={{width: `${percent}%`}}></div></div>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={togglePiP} className="p-2 bg-[#18181b]/90 border border-white/10 rounded-full text-gray-400 hover:text-white transition" title="Floating Timer"><ExternalLink size={20}/></button>
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-[#18181b]/90 border border-white/10 rounded-full text-gray-400 hover:text-white transition"><Settings size={20}/></button>
          </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
          {showSettings && (
              <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="absolute top-20 right-4 z-30 bg-[#18181b] border border-white/10 p-4 rounded-xl shadow-2xl w-72">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2"><ImageIcon size={16}/> Custom Background</h4>
                  <input 
                    type="text" 
                    placeholder="Paste Image URL here..." 
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white mb-2 outline-none focus:border-violet-500"
                    value={data.bgImage || ''}
                    onChange={(e) => setData({...data, bgImage: e.target.value})}
                  />
                  <div className="flex justify-end"><button onClick={() => setData({...data, bgImage: ''})} className="text-xs text-red-400 hover:text-red-300">Remove Image</button></div>
              </motion.div>
          )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 z-10">
         <div className="flex bg-white/5 backdrop-blur p-1 rounded-lg">
             <button onClick={() => { setMode('stopwatch'); setTimeLeft(0); setIsActive(false); }} className={`px-4 py-2 rounded-md text-sm font-bold transition ${mode === 'stopwatch' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>Stopwatch</button>
             <button onClick={() => { setMode('timer'); setTimeLeft(initialTimerTime*60); setIsActive(false); }} className={`px-4 py-2 rounded-md text-sm font-bold transition ${mode === 'timer' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>Timer</button>
         </div>

         <div className="text-center">
             <div className="text-[8rem] md:text-[10rem] font-bold font-mono tracking-tighter leading-none text-white tabular-nums drop-shadow-2xl">{formatTime(timeLeft)}</div>
             {mode === 'timer' && !isActive && (<div className="mt-4 flex items-center justify-center gap-2"><span className="text-gray-400">Set Minutes:</span><input type="number" value={initialTimerTime} onChange={(e) => { const val = parseInt(e.target.value) || 0; setInitialTimerTime(val); setTimeLeft(val * 60); }} className="bg-white/10 border border-white/10 rounded px-2 py-1 w-20 text-center text-white font-bold backdrop-blur" /></div>)}
         </div>

         <div className="bg-[#18181b]/90 backdrop-blur border border-white/10 p-2 rounded-2xl flex items-center gap-4 shadow-2xl">
            <select 
                className={`appearance-none bg-[#27272a] hover:bg-[#3f3f46] text-white py-3 pl-4 pr-8 rounded-xl font-bold outline-none cursor-pointer transition-colors ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`} 
                value={selectedSub} 
                onChange={(e) => setSelectedSub(e.target.value)} 
                disabled={isActive} // LOCK SUBJECT WHEN ACTIVE
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {!isActive ? (
                <button onClick={handleStart} className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-transform active:scale-95"><Play size={20} fill="currentColor" /> {timeLeft > 0 && mode === 'timer' && timeLeft < initialTimerTime*60 ? "Resume" : "Start"}</button>
            ) : (
                <button onClick={() => setIsActive(false)} className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl flex items-center gap-2 transition-transform active:scale-95"><Pause size={20} fill="currentColor" /> Pause</button>
            )}
            {(timeLeft > 0 || isActive) && <button onClick={handleStop} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/20"><StopCircle size={20} /></button>}
         </div>
      </div>
    </div>
  );
};

// --- 3. PHYSICS KPP ---
const PhysicsKPP = ({ data, setData }) => {
    const [newKPP, setNewKPP] = useState({ name: '', chapter: '', attempted: false, corrected: false, myScore: 0, totalScore: 0 });
    const physicsChapters = data.subjects['Physics']?.chapters || [];

    const addKPP = () => {
        if (!newKPP.name || !newKPP.chapter) { alert("Name and Chapter required"); return; }
        const entry = { id: Date.now(), ...newKPP };
        setData(prev => ({ ...prev, kppList: [...(prev.kppList || []), entry] }));
        setNewKPP({ name: '', chapter: '', attempted: false, corrected: false, myScore: 0, totalScore: 0 });
    };

    const deleteKPP = (id) => { if(window.confirm("Delete KPP?")) setData(prev => ({ ...prev, kppList: prev.kppList.filter(k => k.id !== id) })); };
    const updateKPP = (id, field, value) => { setData(prev => ({ ...prev, kppList: prev.kppList.map(k => k.id === id ? { ...k, [field]: value } : k) })); };
    const graphData = (data.kppList || []).slice(-7).map(k => ({ name: k.name, percentage: k.totalScore > 0 ? Math.round((k.myScore / k.totalScore) * 100) : 0 }));

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Physics KPP Tracker</h1>
            <GlassCard className="border-t-4 border-t-purple-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input type="text" placeholder="KPP Name (e.g. Rotational-01)" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newKPP.name} onChange={e => setNewKPP({...newKPP, name: e.target.value})} />
                    <select className="bg-[#18181b] border border-white/10 rounded-lg p-3 text-white outline-none" value={newKPP.chapter} onChange={e => setNewKPP({...newKPP, chapter: e.target.value})}>
                        <option value="">Select Physics Chapter</option>
                        {physicsChapters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                     <div className="flex items-center gap-2 text-gray-400"><input type="checkbox" className="w-5 h-5 accent-purple-500" checked={newKPP.attempted} onChange={e => setNewKPP({...newKPP, attempted: e.target.checked})} /> Attempted</div>
                     <div className="flex items-center gap-2 text-gray-400"><input type="checkbox" className="w-5 h-5 accent-green-500" checked={newKPP.corrected} onChange={e => setNewKPP({...newKPP, corrected: e.target.checked})} /> Corrected</div>
                     <div className="flex items-center gap-2"><input type="number" placeholder="My Score" className="w-24 bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={newKPP.myScore} onChange={e => setNewKPP({...newKPP, myScore: parseFloat(e.target.value)})} /><span className="text-gray-500">/</span><input type="number" placeholder="Total" className="w-24 bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={newKPP.totalScore} onChange={e => setNewKPP({...newKPP, totalScore: parseFloat(e.target.value)})} /></div>
                     <button onClick={addKPP} className="ml-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">Add KPP</button>
                </div>
            </GlassCard>
            {graphData.length > 0 && (<GlassCard className="h-[300px]"><ResponsiveContainer width="100%" height="90%"><BarChart data={graphData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} /><RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff'}} /><Bar dataKey="percentage" fill="#8b5cf6" radius={[4,4,0,0]} name="Score %" /></BarChart></ResponsiveContainer></GlassCard>)}
            <div className="grid gap-3">{(data.kppList || []).slice().reverse().map(kpp => (<div key={kpp.id} className="bg-[#121212] border border-white/10 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-3"><span className="font-bold text-white text-lg">{kpp.name}</span><span className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded">{kpp.chapter}</span></div><div className="flex gap-4 mt-2 text-sm"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={kpp.attempted} onChange={(e) => updateKPP(kpp.id, 'attempted', e.target.checked)} className="accent-purple-500"/> <span className={kpp.attempted ? "text-purple-400" : "text-gray-500"}>Attempted</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={kpp.corrected} onChange={(e) => updateKPP(kpp.id, 'corrected', e.target.checked)} className="accent-green-500"/> <span className={kpp.corrected ? "text-green-400" : "text-gray-500"}>Corrected</span></label></div></div><div className="flex items-center gap-4"><div className="text-right"><div className="text-white font-bold text-xl">{kpp.myScore} <span className="text-gray-500 text-sm">/ {kpp.totalScore}</span></div><div className="text-xs text-gray-500">{kpp.totalScore > 0 ? Math.round((kpp.myScore/kpp.totalScore)*100) : 0}%</div></div><button onClick={() => deleteKPP(kpp.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={18} /></button></div></div>))}</div>
        </div>
    );
};

// --- 4. SYLLABUS ---
const Syllabus = ({ data, setData }) => {
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [gradeView, setGradeView] = useState('11');

  const addChapter = () => {
    const name = prompt(`Enter Class ${gradeView} Chapter Name:`);
    const lectures = prompt("Total Main Lectures:");
    if (name && lectures) {
      const newChapter = { id: Date.now().toString(), name, totalLectures: parseInt(lectures), lectures: new Array(parseInt(lectures)).fill(false), grade: gradeView, miscLectures: [], diby: { solved: 0, total: 0 } };
      const newData = { ...data }; newData.subjects[selectedSubject].chapters.push(newChapter); setData(newData);
    }
  };

  const updateChapter = (updated) => { const newData = { ...data }; const idx = newData.subjects[selectedSubject].chapters.findIndex(c => c.id === updated.id); newData.subjects[selectedSubject].chapters[idx] = updated; setData(newData); };
  const deleteChapter = (id) => { const newData = { ...data }; newData.subjects[selectedSubject].chapters = newData.subjects[selectedSubject].chapters.filter(c => c.id !== id); setData(newData); };
  const filteredChapters = data.subjects[selectedSubject].chapters.filter(c => c.grade === gradeView || (!c.grade && gradeView === '11'));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-white">Syllabus Tracker</h1><button onClick={addChapter} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold flex items-center gap-2"><Plus size={18} /> Add Chapter</button></div>
      <div className="flex gap-4 p-1 bg-white/5 w-fit rounded-xl">{['11', '12'].map(g => <button key={g} onClick={() => setGradeView(g)} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${gradeView === g ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>Class {g}th</button>)}</div>
      <div className="flex gap-2 overflow-x-auto pb-2">{SUBJECTS.map(s => <button key={s} onClick={() => setSelectedSubject(s)} className={`px-6 py-3 rounded-xl font-bold transition ${selectedSubject === s ? 'bg-white text-black' : 'bg-[#121212] border border-white/10 text-gray-400'}`}>{s}</button>)}</div>
      <div className="grid gap-4">{filteredChapters.map(chapter => <ChapterItem key={chapter.id} subjectName={selectedSubject} chapter={chapter} onUpdate={updateChapter} onDelete={deleteChapter} />)}</div>
    </div>
  );
};

const ChapterItem = ({ subjectName, chapter, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const completed = chapter.lectures.filter(l => l).length;
  const progress = chapter.totalLectures > 0 ? Math.round((completed/chapter.totalLectures)*100) : 0;
  const toggleLec = (i) => { const newLecs = [...chapter.lectures]; newLecs[i] = !newLecs[i]; onUpdate({ ...chapter, lectures: newLecs }); };
  const addMisc = () => { const name = prompt("Misc Lecture Name:"); const count = prompt("Number of videos:"); if(name && count) { const newMisc = { id: Date.now(), name, total: parseInt(count), checked: new Array(parseInt(count)).fill(false) }; onUpdate({ ...chapter, miscLectures: [...(chapter.miscLectures || []), newMisc] }); }};
  const toggleMisc = (miscId, index) => { const updatedMisc = chapter.miscLectures.map(m => { if(m.id === miscId) { const newChecked = [...m.checked]; newChecked[index] = !newChecked[index]; return { ...m, checked: newChecked }; } return m; }); onUpdate({ ...chapter, miscLectures: updatedMisc }); };
  const deleteMisc = (miscId) => { onUpdate({ ...chapter, miscLectures: chapter.miscLectures.filter(m => m.id !== miscId) }); };
  const updateDiby = (field, val) => { onUpdate({ ...chapter, diby: { ...(chapter.diby || {solved:0, total:0}), [field]: parseInt(val) || 0 } }); };

  return (
    <GlassCard>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4"><div className={`p-3 rounded-full ${progress===100 ? 'bg-green-500/20 text-green-500' : 'bg-violet-500/20 text-violet-500'}`}>{progress===100 ? <CheckCircle size={24} /> : <BookOpen size={24} />}</div><div><h3 className="text-xl font-bold text-white">{chapter.name}</h3><p className="text-sm text-gray-400">{completed}/{chapter.totalLectures} Main Lecs • {progress}%</p></div></div>
        <div className="flex gap-2"><button onClick={(e) => {e.stopPropagation(); onDelete(chapter.id);}} className="text-gray-600 hover:text-red-500"><Trash2 size={18}/></button><ChevronRight className={`transition ${expanded?'rotate-90':''}`} /></div>
      </div>
      {expanded && (
          <div className="mt-6 space-y-6">
              <div><h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Main Lectures</h4><div className="grid grid-cols-6 md:grid-cols-10 gap-2">{chapter.lectures.map((done, i) => <button key={i} onClick={() => toggleLec(i)} className={`p-2 rounded text-xs font-bold border transition ${done ? 'bg-violet-600 border-violet-600 text-white' : 'border-white/10 text-gray-500'}`}>{i+1}</button>)}</div></div>
              {subjectName === 'Maths' && (<div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl"><h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2"><Target size={14}/> DIBY Questions (Do It By Yourself)</h4><div className="flex items-center gap-4"><div className="flex items-center gap-2"><span className="text-sm text-gray-400">Solved:</span><input type="number" className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm" value={chapter.diby?.solved || 0} onChange={e => updateDiby('solved', e.target.value)} /></div><span className="text-gray-500">/</span><div className="flex items-center gap-2"><span className="text-sm text-gray-400">Total:</span><input type="number" className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm" value={chapter.diby?.total || 0} onChange={e => updateDiby('total', e.target.value)} /></div><div className="ml-auto text-blue-400 font-bold">{(chapter.diby?.total > 0 ? Math.round((chapter.diby.solved / chapter.diby.total) * 100) : 0)}% Done</div></div></div>)}
              <div className="border-t border-white/10 pt-4"><div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold text-gray-500 uppercase">Misc Topics (Extra)</h4><button onClick={addMisc} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">+ Add Topic</button></div>{(chapter.miscLectures || []).map(misc => (<div key={misc.id} className="mb-3"><div className="flex justify-between items-center mb-1"><span className="text-sm text-gray-300">{misc.name}</span><button onClick={() => deleteMisc(misc.id)} className="text-red-500 hover:text-red-400"><X size={12}/></button></div><div className="flex flex-wrap gap-2">{misc.checked.map((done, i) => (<button key={i} onClick={() => toggleMisc(misc.id, i)} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition ${done ? 'bg-gray-600 border-gray-600 text-white' : 'border-white/10 text-gray-600'}`}>{i+1}</button>))}</div></div>))}</div>
          </div>
      )}
    </GlassCard>
  );
};

// --- 5. DASHBOARD ---
const Dashboard = ({ data, setData, goToTimer, user }) => {
  const today = new Date().toISOString().split('T')[0];
  const history = data.history || {};
  const todayMins = history[today] || 0;
  
  const totalMinutes = Object.values(history).reduce((acc, curr) => acc + curr, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemMins = Math.round(totalMinutes % 60);
  const activeDays = Object.keys(history).filter(k => history[k] > 0).length;
  
  let streak = 0;
  if ((history[today] || 0) > 0) streak++;
  let d = new Date(); d.setDate(d.getDate() - 1);
  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if ((history[dateStr] || 0) > 0) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  const avgHours = activeDays > 0 ? (totalHours / activeDays).toFixed(1) : 0;

  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const mins = history[dateStr] || 0;
        chartData.push({ name: days[d.getDay()], hours: parseFloat((mins / 60).toFixed(1)) });
    }
    return chartData;
  };

  const getSubjectDistribution = () => {
    const pTime = data.subjects["Physics"]?.timeSpent || 0;
    const mTime = data.subjects["Maths"]?.timeSpent || 0;
    const cTime = (data.subjects["Organic Chem"]?.timeSpent || 0) + (data.subjects["Inorganic Chem"]?.timeSpent || 0) + (data.subjects["Physical Chem"]?.timeSpent || 0);
    if (pTime + cTime + mTime === 0) return [{name: 'No Data', value: 1}];
    return [{ name: 'Physics', value: pTime }, { name: 'Maths', value: mTime }, { name: 'Chemistry', value: cTime }];
  };

  const addTask = () => { const t = prompt("Task?"); if(t) setData(prev => ({ ...prev, tasks: [{ id: Date.now(), text: t, completed: false }, ...prev.tasks] })); };
  const toggleTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  const removeTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const pieData = getSubjectDistribution();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-8 py-4">
          <div><p className="text-gray-500 text-sm font-bold tracking-widest mb-2 uppercase">TOTAL STUDY TIME</p><h1 className="text-7xl font-bold text-white tracking-tighter drop-shadow-2xl">{totalHours}h <span className="text-4xl text-gray-500">{totalRemMins}m</span></h1></div>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="flex flex-col items-center"><div className="relative w-24 h-12 overflow-hidden mb-2"><div className="absolute w-24 h-24 rounded-full border-4 border-white/10 top-0 left-0 box-border"></div><div className="absolute w-24 h-24 rounded-full border-4 border-violet-500 top-0 left-0 border-b-transparent border-l-transparent border-r-transparent" style={{transform: 'rotate(-45deg)'}}></div><div className="absolute bottom-0 w-full text-center text-xl font-bold text-white">{activeDays}</div></div><span className="text-xs text-gray-400 font-bold uppercase">Active Days</span></div>
              <div className="flex flex-col items-center"><div className="relative w-24 h-12 overflow-hidden mb-2"><div className="absolute w-24 h-24 rounded-full border-4 border-white/10 top-0 left-0 box-border"></div><div className="absolute w-24 h-24 rounded-full border-4 border-white top-0 left-0 border-b-transparent border-l-transparent border-r-transparent" style={{transform: 'rotate(-45deg)'}}></div><div className="absolute bottom-0 w-full text-center text-xl font-bold text-white">{streak}</div></div><span className="text-xs text-gray-400 font-bold uppercase">Day Streak</span></div>
              <div className="flex flex-col items-center"><div className="relative w-24 h-12 overflow-hidden mb-2"><div className="absolute w-24 h-24 rounded-full border-4 border-white/10 top-0 left-0 box-border"></div><div className="absolute w-24 h-24 rounded-full border-4 border-violet-500 top-0 left-0 border-b-transparent border-l-transparent border-r-transparent" style={{transform: 'rotate(-45deg)'}}></div><div className="absolute bottom-0 w-full text-center text-xl font-bold text-white">{avgHours}</div></div><span className="text-xs text-gray-400 font-bold uppercase">Hrs / Day</span></div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 min-h-[350px] flex flex-col"><h3 className="text-lg font-bold text-white mb-6">This Week's Progress</h3><div className="flex-1 w-full min-h-[250px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={getWeeklyData()}><defs><linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} /><YAxis hide domain={[0, 'auto']} /><RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff'}} itemStyle={{color: '#a78bfa'}} formatter={(value) => [`${value} hrs`, "Study Time"]} /><Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" /></AreaChart></ResponsiveContainer></div></GlassCard>
        <GlassCard className="min-h-[350px] flex flex-col items-center justify-center"><h3 className="text-lg font-bold text-white mb-4 self-start">Subject Balance</h3><div className="relative w-full h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={2} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'No Data' ? '#333' : COLORS[index % COLORS.length]} stroke="none" />)}</Pie><RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderRadius: '8px', border:'none'}} formatter={(val) => `${Math.round(val/60)}m`} /><Legend verticalAlign="bottom" height={36} iconType="circle"/></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8"><span className="text-gray-500 text-xs font-bold uppercase">Today</span><span className="text-white text-2xl font-bold">{Math.round(todayMins/60)}h</span></div></div></GlassCard>
      </div>

      <GlassCard>
           <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-white">Tasks</h3><button onClick={addTask} className="text-xs px-3 py-1 bg-white/10 text-white rounded hover:bg-white/20">+ Add</button></div>
           <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
             {data.tasks.map(task => (
               <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-violet-500/50 transition cursor-pointer">
                 <div onClick={() => toggleTask(task.id)} className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border-2 ${task.completed ? 'bg-violet-500 border-violet-500' : 'border-gray-600'}`}>{task.completed && <CheckCircle size={12} className="text-white mx-auto mt-0.5" />}</div><span className={task.completed ? 'text-gray-500 line-through text-sm' : 'text-gray-200 text-sm'}>{task.text}</span></div>
                 <button onClick={() => removeTask(task.id)} className="text-gray-600 hover:text-red-500"><X size={14}/></button>
               </div>
             ))}
             {data.tasks.length === 0 && <div className="text-center text-gray-600 py-4">No tasks today.</div>}
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setData(docSnap.data());
        else await setDoc(docRef, INITIAL_DATA);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      const timeoutId = setTimeout(async () => {
        await setDoc(doc(db, "users", user.uid), data);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [data, user, loading]);

  const saveSession = (subject, seconds) => {
    const mins = parseFloat((seconds/60).toFixed(2));
    const today = new Date().toISOString().split('T')[0];
    setData(prev => ({
      ...prev,
      subjects: { ...prev.subjects, [subject]: { ...prev.subjects[subject], timeSpent: prev.subjects[subject].timeSpent + seconds } },
      history: { ...prev.history, [today]: (prev.history?.[today] || 0) + mins },
      xp: (prev.xp || 0) + Math.floor(mins),
    }));
  };

  const handleLogout = async () => { await signOut(auth); setData(INITIAL_DATA); };

  if (loading) return <div className="h-screen bg-[#09090b] flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans selection:bg-violet-500/30 flex">
      <aside className="fixed left-0 top-0 h-full w-20 bg-[#09090b] border-r border-white/10 flex flex-col items-center py-8 z-40 hidden md:flex">
        <div className="mb-12 p-3 bg-white/5 rounded-xl border border-white/10"><Zap size={24} className="text-white" /></div>
        <nav className="flex flex-col gap-8 w-full">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
            { id: 'timer', icon: TimerIcon, label: 'Timer' }, 
            { id: 'syllabus', icon: BookOpen, label: 'Syllabus' },
            { id: 'mocks', icon: FileText, label: 'Mocks' },
            { id: 'kpp', icon: Target, label: 'Phy KPP' },
          ].map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`relative group w-full flex justify-center py-3 border-l-2 transition-all duration-300 ${view === item.id ? 'border-violet-500 text-white' : 'border-transparent text-gray-600 hover:text-violet-400'}`}>
              <item.icon size={24} />
              <span className="absolute left-14 bg-white text-black px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="md:ml-20 flex-1 p-6 md:p-10 pb-24 h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#09090b]/90 backdrop-blur-md z-30 py-4 -mt-4 border-b border-white/5">
           <h2 className="text-2xl font-bold text-gray-200 capitalize flex items-center gap-2">
             {view === 'kpp' ? 'Physics KPP' : view}
           </h2>
           <ProfileDropdown user={user} onLogout={handleLogout} />
        </div>

        {view === 'dashboard' && <Dashboard data={data} setData={setData} goToTimer={() => setView('timer')} user={user} />}
        {view === 'timer' && <FocusTimer data={data} setData={setData} onSaveSession={saveSession} />} 
        {view === 'syllabus' && <Syllabus data={data} setData={setData} />}
        {view === 'mocks' && <MockTestTracker data={data} setData={setData} />}
        {view === 'kpp' && <PhysicsKPP data={data} setData={setData} />} 
      </main>

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#09090b]/95 backdrop-blur-md border-t border-white/10 p-4 flex justify-around z-50">
        <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-violet-500' : 'text-gray-500'}><LayoutDashboard /></button>
        <button onClick={() => setView('timer')} className={view === 'timer' ? 'text-violet-500' : 'text-gray-500'}><TimerIcon /></button>
        <button onClick={() => setView('syllabus')} className={view === 'syllabus' ? 'text-violet-500' : 'text-gray-500'}><BookOpen /></button>
        <button onClick={() => setView('kpp')} className={view === 'kpp' ? 'text-violet-500' : 'text-gray-500'}><Target /></button>
      </div>
    </div>
  );
}