import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, BookOpen, Zap, Flame, Trophy, 
  Play, Pause, CheckCircle, X, ChevronRight, 
  Plus, Trash2, FileText, TrendingUp, LogOut,
  Timer as TimerIcon, StopCircle, Target, User,
  Settings, Image as ImageIcon, ExternalLink, Maximize, Minimize,
  PieChart as PieChartIcon, Upload, Bell
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
 * JEEPLANET PRO - v21.0 (Upcoming Test Notifications)
 */

// --- CONSTANTS ---
const SUBJECTS = ["Physics", "Maths", "Organic Chem", "Inorganic Chem", "Physical Chem"];
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']; 

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
  bgImage: ""
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
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
        <div className="hidden md:block text-right mr-1">
          <p className="text-xs font-bold text-white leading-none">{user.displayName?.split(' ')[0]}</p>
        </div>
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border-2 border-violet-500/50" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold border-2 border-violet-400 text-xs">{user.displayName?.[0] || "U"}</div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-60 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-white/5 bg-white/5">
               <p className="text-white font-bold text-sm">{user.displayName}</p>
               <p className="text-[10px] text-gray-400 mt-0.5 truncate">{user.email}</p>
            </div>
            <div className="p-1">
               <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs font-bold">
                 <LogOut size={14} /> Log Out
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

// --- 2. FOCUS TIMER ---
const FocusTimer = ({ data, setData, onSaveSession }) => {
  const [mode, setMode] = useState('stopwatch'); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [initialTimerTime, setInitialTimerTime] = useState(60); 
  const [isActive, setIsActive] = useState(false);
  const [selectedSub, setSelectedSub] = useState(SUBJECTS[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if(file) {
          const reader = new FileReader();
          reader.onloadend = () => setData({...data, bgImage: reader.result});
          reader.readAsDataURL(file);
      }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => alert("Fullscreen blocked"));
    else document.exitFullscreen().then(() => setIsFullscreen(false));
  };
  useEffect(() => {
      const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handleFsChange);
      return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const handlePause = () => setIsActive(false);
      const handlePlay = () => setIsActive(true);
      video.addEventListener('pause', handlePause);
      video.addEventListener('play', handlePlay);
      return () => {
          video.removeEventListener('pause', handlePause);
          video.removeEventListener('play', handlePlay);
      };
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
           let newVal = mode === 'timer' ? prev - 1 : prev + 1;
           if (mode === 'timer' && newVal <= 0) { setIsActive(false); alert("Timer Finished!"); return 0; }
           if (document.pictureInPictureElement && canvasRef.current) updatePiPCanvas(newVal);
           document.title = `(${formatTime(newVal)}) JEEPlanet`;
           return newVal;
        });
      }, 1000);
    } else { document.title = "JEEPlanet Pro"; }
    return () => clearInterval(interval);
  }, [isActive, mode]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const updatePiPCanvas = (time) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 80px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(formatTime(time), canvas.width / 2, canvas.height / 2);
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else {
        const canvas = canvasRef.current; const video = videoRef.current;
        if (canvas && video) { updatePiPCanvas(timeLeft); const stream = canvas.captureStream(); video.srcObject = stream; await video.play(); await video.requestPictureInPicture(); }
      }
    } catch (err) { console.error(err); alert("Floating mode failed. Try Chrome Desktop."); }
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
        ref={containerRef}
        className="h-full flex flex-col relative overflow-hidden rounded-3xl transition-all duration-500 bg-cover bg-center"
        style={{ backgroundImage: data.bgImage ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${data.bgImage})` : 'none' }}
    >
      <canvas ref={canvasRef} width={400} height={200} className="hidden" />
      <video ref={videoRef} className="hidden" muted />

      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
          <div className="bg-[#18181b]/90 backdrop-blur border border-white/10 rounded-full py-2 px-4 flex items-center gap-3 w-64 shadow-lg">
             <div className="flex flex-col flex-1">
                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 mb-1">
                    <span>Daily Goal</span>
                    <span>{Math.floor(todayMins/60)}h {Math.round(todayMins%60)}m / {data.dailyGoal}h 0m</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-violet-500 transition-all duration-500" style={{width: `${percent}%`}}></div></div>
             </div>
          </div>
          <div className="flex gap-2">
             <button onClick={togglePiP} className="p-2 bg-[#18181b]/90 border border-white/10 rounded-full text-gray-400 hover:text-white transition"><ExternalLink size={18}/></button>
             <button onClick={toggleFullscreen} className="p-2 bg-[#18181b]/90 border border-white/10 rounded-full text-gray-400 hover:text-white transition">{isFullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}</button>
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-[#18181b]/90 border border-white/10 rounded-full text-gray-400 hover:text-white transition"><Settings size={18}/></button>
          </div>
      </div>

      <AnimatePresence>
          {showSettings && (
              <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="absolute top-20 right-4 z-30 bg-[#18181b] border border-white/10 p-4 rounded-xl shadow-2xl w-72">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2"><ImageIcon size={16}/> Custom Background</h4>
                  <div className="mb-3">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Image URL</span>
                      <input type="text" placeholder="Paste URL..." className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-violet-500" value={data.bgImage?.startsWith('data') ? '' : data.bgImage} onChange={(e) => setData({...data, bgImage: e.target.value})} />
                  </div>
                  <div className="mb-4">
                      <span className="text-[10px] text-gray-500 uppercase font-bold">Or Upload from Device</span>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      <button onClick={() => fileInputRef.current.click()} className="mt-1 w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-bold transition">
                          <Upload size={14} /> Choose File
                      </button>
                  </div>
                  <div className="flex justify-end"><button onClick={() => setData({...data, bgImage: ''})} className="text-xs text-red-400 hover:text-red-300">Remove Image</button></div>
              </motion.div>
          )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 z-10">
         {!isActive && (
             <div className="flex bg-white/5 backdrop-blur p-1 rounded-lg animate-in fade-in zoom-in duration-300">
                 <button onClick={() => { setMode('stopwatch'); setTimeLeft(0); }} className={`px-4 py-2 rounded-md text-sm font-bold transition ${mode === 'stopwatch' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>Stopwatch</button>
                 <button onClick={() => { setMode('timer'); setTimeLeft(initialTimerTime*60); }} className={`px-4 py-2 rounded-md text-sm font-bold transition ${mode === 'timer' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>Timer</button>
             </div>
         )}

         <div className="text-center">
             <div className="text-[8rem] md:text-[12rem] font-bold font-mono tracking-tighter leading-none text-white tabular-nums drop-shadow-2xl transition-all">{formatTime(timeLeft)}</div>
             {mode === 'timer' && !isActive && (<div className="mt-4 flex items-center justify-center gap-2"><span className="text-gray-400">Set Minutes:</span><input type="number" value={initialTimerTime} onChange={(e) => { const val = parseInt(e.target.value) || 0; setInitialTimerTime(val); setTimeLeft(val * 60); }} className="bg-white/10 border border-white/10 rounded px-2 py-1 w-20 text-center text-white font-bold backdrop-blur" /></div>)}
         </div>

         <div className="bg-[#18181b]/90 backdrop-blur border border-white/10 p-2 rounded-2xl flex items-center gap-4 shadow-2xl transition-all duration-500">
            {isActive ? (
                <div className="px-6 py-3 font-bold text-violet-400 flex items-center gap-2 bg-white/5 rounded-xl border border-white/5"><div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>Studying: {selectedSub}</div>
            ) : (
                <select className="appearance-none bg-[#27272a] hover:bg-[#3f3f46] text-white py-3 pl-4 pr-8 rounded-xl font-bold outline-none cursor-pointer transition-colors" value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            )}
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
    const addKPP = () => { if (!newKPP.name || !newKPP.chapter) { alert("Name and Chapter required"); return; } const entry = { id: Date.now(), ...newKPP }; setData(prev => ({ ...prev, kppList: [...(prev.kppList || []), entry] })); setNewKPP({ name: '', chapter: '', attempted: false, corrected: false, myScore: 0, totalScore: 0 }); };
    const deleteKPP = (id) => { if(window.confirm("Delete KPP?")) setData(prev => ({ ...prev, kppList: prev.kppList.filter(k => k.id !== id) })); };
    const updateKPP = (id, field, value) => { setData(prev => ({ ...prev, kppList: prev.kppList.map(k => k.id === id ? { ...k, [field]: value } : k) })); };
    const graphData = (data.kppList || []).slice(-7).map(k => ({ name: k.name, percentage: k.totalScore > 0 ? Math.round((k.myScore / k.totalScore) * 100) : 0 }));
    return (<div className="space-y-6 max-w-5xl mx-auto"><h1 className="text-3xl font-bold text-white mb-2">Physics KPP Tracker</h1><GlassCard className="border-t-4 border-t-purple-500"><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><input type="text" placeholder="KPP Name (e.g. Rotational-01)" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newKPP.name} onChange={e => setNewKPP({...newKPP, name: e.target.value})} /><select className="bg-[#18181b] border border-white/10 rounded-lg p-3 text-white outline-none" value={newKPP.chapter} onChange={e => setNewKPP({...newKPP, chapter: e.target.value})}><option value="">Select Physics Chapter</option>{physicsChapters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div><div className="flex flex-wrap gap-4 items-center"><div className="flex items-center gap-2 text-gray-400"><input type="checkbox" className="w-5 h-5 accent-purple-500" checked={newKPP.attempted} onChange={e => setNewKPP({...newKPP, attempted: e.target.checked})} /> Attempted</div><div className="flex items-center gap-2 text-gray-400"><input type="checkbox" className="w-5 h-5 accent-green-500" checked={newKPP.corrected} onChange={e => setNewKPP({...newKPP, corrected: e.target.checked})} /> Corrected</div><div className="flex items-center gap-2"><input type="number" placeholder="My Score" className="w-24 bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={newKPP.myScore} onChange={e => setNewKPP({...newKPP, myScore: parseFloat(e.target.value)})} /><span className="text-gray-500">/</span><input type="number" placeholder="Total" className="w-24 bg-white/5 border border-white/10 rounded-lg p-2 text-white" value={newKPP.totalScore} onChange={e => setNewKPP({...newKPP, totalScore: parseFloat(e.target.value)})} /></div><button onClick={addKPP} className="ml-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">Add KPP</button></div></GlassCard>{graphData.length > 0 && (<GlassCard className="h-[300px]"><ResponsiveContainer width="100%" height="90%"><BarChart data={graphData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} /><RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff'}} /><Bar dataKey="percentage" fill="#8b5cf6" radius={[4,4,0,0]} name="Score %" /></BarChart></ResponsiveContainer></GlassCard>)}<div className="grid gap-3">{(data.kppList || []).slice().reverse().map(kpp => (<div key={kpp.id} className="bg-[#121212] border border-white/10 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-3"><span className="font-bold text-white text-lg">{kpp.name}</span><span className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded">{kpp.chapter}</span></div><div className="flex gap-4 mt-2 text-sm"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={kpp.attempted} onChange={(e) => updateKPP(kpp.id, 'attempted', e.target.checked)} className="accent-purple-500"/> <span className={kpp.attempted ? "text-purple-400" : "text-gray-500"}>Attempted</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={kpp.corrected} onChange={(e) => updateKPP(kpp.id, 'corrected', e.target.checked)} className="accent-green-500"/> <span className={kpp.corrected ? "text-green-400" : "text-gray-500"}>Corrected</span></label></div></div><div className="flex items-center gap-4"><div className="text-right"><div className="text-white font-bold text-xl">{kpp.myScore} <span className="text-gray-500 text-sm">/ {kpp.totalScore}</span></div><div className="text-xs text-gray-500">{kpp.totalScore > 0 ? Math.round((kpp.myScore/kpp.totalScore)*100) : 0}%</div></div><button onClick={() => deleteKPP(kpp.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={18} /></button></div></div>))}</div></div>);
};

// --- 4. SYLLABUS & MOCKS (Updated with Notifications) ---
const Syllabus = ({ data, setData }) => {
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [gradeView, setGradeView] = useState('11');
  const addChapter = () => { const name = prompt(`Enter Class ${gradeView} Chapter Name:`); const lectures = prompt("Total Main Lectures:"); if (name && lectures) { const newChapter = { id: Date.now().toString(), name, totalLectures: parseInt(lectures), lectures: new Array(parseInt(lectures)).fill(false), grade: gradeView, miscLectures: [], diby: { solved: 0, total: 0 } }; const newData = { ...data }; newData.subjects[selectedSubject].chapters.push(newChapter); setData(newData); } };
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
      {expanded && (<div className="mt-6 space-y-6"><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Main Lectures</h4><div className="grid grid-cols-6 md:grid-cols-10 gap-2">{chapter.lectures.map((done, i) => <button key={i} onClick={() => toggleLec(i)} className={`p-2 rounded text-xs font-bold border transition ${done ? 'bg-violet-600 border-violet-600 text-white' : 'border-white/10 text-gray-500'}`}>{i+1}</button>)}</div></div>{subjectName === 'Maths' && (<div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl"><h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2"><Target size={14}/> DIBY Questions (Do It By Yourself)</h4><div className="flex items-center gap-4"><div className="flex items-center gap-2"><span className="text-sm text-gray-400">Solved:</span><input type="number" className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm" value={chapter.diby?.solved || 0} onChange={e => updateDiby('solved', e.target.value)} /></div><span className="text-gray-500">/</span><div className="flex items-center gap-2"><span className="text-sm text-gray-400">Total:</span><input type="number" className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm" value={chapter.diby?.total || 0} onChange={e => updateDiby('total', e.target.value)} /></div><div className="ml-auto text-blue-400 font-bold">{(chapter.diby?.total > 0 ? Math.round((chapter.diby.solved / chapter.diby.total) * 100) : 0)}% Done</div></div></div>)}<div className="border-t border-white/10 pt-4"><div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold text-gray-500 uppercase">Misc Topics (Extra)</h4><button onClick={addMisc} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">+ Add Topic</button></div>{(chapter.miscLectures || []).map(misc => (<div key={misc.id} className="mb-3"><div className="flex justify-between items-center mb-1"><span className="text-sm text-gray-300">{misc.name}</span><button onClick={() => deleteMisc(misc.id)} className="text-red-500 hover:text-red-400"><X size={12}/></button></div><div className="flex flex-wrap gap-2">{misc.checked.map((done, i) => (<button key={i} onClick={() => toggleMisc(misc.id, i)} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition ${done ? 'bg-gray-600 border-gray-600 text-white' : 'border-white/10 text-gray-600'}`}>{i+1}</button>))}</div></div>))}</div></div>)}
    </GlassCard>
  );
};

const MockTestTracker = ({ data, setData }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState('All'); 
  const [testType, setTestType] = useState('Mains');
  const [newTest, setNewTest] = useState({ name: '', date: '', p: '', c: '', m: '', maxMarks: 300, reminder: false });

  // NOTIFICATION PERMISSION REQUEST
  const requestNotificationPermission = async () => {
      if (!("Notification" in window)) {
          alert("This browser does not support desktop notification");
          return;
      }
      if (Notification.permission !== "granted") {
          await Notification.requestPermission();
      }
  };

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
        maxMarks: max,
        reminder: newTest.reminder // SAVE REMINDER PREFERENCE
    };

    if(newTest.reminder) requestNotificationPermission();

    setData(prev => ({ ...prev, mockTests: [...(prev.mockTests || []), testEntry] }));
    setIsAdding(false);
    setNewTest({ name: '', date: '', p: '', c: '', m: '', maxMarks: 300, reminder: false });
  };

  const deleteTest = (id) => { if(window.confirm("Delete record?")) setData(prev => ({ ...prev, mockTests: prev.mockTests.filter(t => t.id !== id) })); };
  const filteredTests = (data.mockTests || []).filter(t => { if (filterType === 'All') return true; return t.type === filterType || (!t.type && filterType === 'Mains'); });
  const sortedTests = [...filteredTests].sort((a,b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center gap-4"><div><h1 className="text-3xl font-bold text-white mb-2">Mock Test Analysis</h1><p className="text-gray-400">Scores by Subject (Stacked)</p></div><div className="flex gap-2">{['All', 'Mains', 'Advanced'].map(t => (<button key={t} onClick={() => setFilterType(t)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${filterType===t ? 'bg-violet-600 text-white border-violet-600' : 'border-white/10 text-gray-400'}`}>{t}</button>))}</div><button onClick={() => setIsAdding(!isAdding)} className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold flex items-center gap-2">{isAdding ? <X size={18}/> : <Plus size={18}/>} {isAdding ? 'Cancel' : 'Log Test'}</button></div>
      
      {isAdding && (
          <GlassCard className="border-t-4 border-t-violet-500">
              {/* Type Selection */}
              <div className="flex gap-4 mb-6">{['Mains', 'Advanced'].map(t => (<label key={t} className="flex items-center gap-2 cursor-pointer"><input type="radio" className="accent-violet-500" checked={testType === t} onChange={() => setTestType(t)} /><span className={testType === t ? 'text-white font-bold' : 'text-gray-400'}>JEE {t}</span></label>))}</div>
              
              {/* Inputs */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                  <div className="col-span-2 space-y-2"><label className="text-xs text-gray-400 font-bold uppercase">Name</label><input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.name} onChange={e => setNewTest({...newTest, name: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-xs text-gray-400 font-bold uppercase">Date</label><input type="date" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.date} onChange={e => setNewTest({...newTest, date: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-xs text-violet-400 font-bold uppercase">Physics</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.p} onChange={e => setNewTest({...newTest, p: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-xs text-green-400 font-bold uppercase">Chem</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.c} onChange={e => setNewTest({...newTest, c: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-xs text-blue-400 font-bold uppercase">Maths</label><input type="number" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.m} onChange={e => setNewTest({...newTest, m: e.target.value})} /></div>
              </div>

              {testType === 'Advanced' && <div className="mt-4"><input type="number" placeholder="Total Max Marks (e.g. 360)" className="bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none" value={newTest.maxMarks} onChange={e => setNewTest({...newTest, maxMarks: e.target.value})} /></div>}
              
              {/* REMINDER TOGGLE */}
              <div className="mt-4 flex items-center gap-2">
                  <input type="checkbox" id="remindMe" className="accent-violet-500 w-5 h-5" checked={newTest.reminder} onChange={e => setNewTest({...newTest, reminder: e.target.checked})} />
                  <label htmlFor="remindMe" className="text-gray-300 text-sm font-bold flex items-center gap-2"><Bell size={16} /> Remind me 1 day before & on the day</label>
              </div>

              <button onClick={addTest} className="mt-6 w-full py-3 font-bold rounded-lg bg-violet-600 text-white hover:bg-violet-700">Save Score & Set Reminder</button>
          </GlassCard>
      )}

      {sortedTests.length > 0 ? (<GlassCard className="h-[400px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={sortedTests} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} /><RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff'}} /><Legend iconType="circle" /><Bar dataKey="p" name="Physics" stackId="a" fill="#8b5cf6" barSize={40} radius={[0,0,4,4]} /><Bar dataKey="c" name="Chemistry" stackId="a" fill="#10b981" barSize={40} /><Bar dataKey="m" name="Maths" stackId="a" fill="#3b82f6" barSize={40} radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></GlassCard>) : <div className="text-center py-10 text-gray-500">No tests logged.</div>}
      <div className="grid gap-3">{sortedTests.slice().reverse().map(test => (<div key={test.id} className="group bg-[#121212] border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-white/20 transition"><div className="flex gap-4 items-center"><div className={`w-1 h-12 rounded-full ${test.type === 'Advanced' ? 'bg-orange-500' : 'bg-violet-500'}`}></div><div><div className="flex items-center gap-3"><h3 className="font-bold text-white">{test.name}</h3><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${test.type === 'Advanced' ? 'bg-orange-500/20 text-orange-400' : 'bg-violet-500/20 text-violet-400'}`}>{test.type || 'Mains'}</span>{test.reminder && <Bell size={12} className="text-violet-400" />}</div><div className="text-xs text-gray-500 mt-1">{test.date}</div><div className="flex gap-4 mt-2 text-sm"><span className="text-violet-400">P: {test.p}</span><span className="text-green-400">C: {test.c}</span><span className="text-blue-400">M: {test.m}</span></div></div></div><div className="flex items-center gap-6"><div className="text-right"><div className="text-2xl font-bold text-white">{test.total} <span className="text-sm text-gray-500 font-normal">/ {test.maxMarks || 300}</span></div><div className="text-xs text-gray-500 uppercase">{Math.round((test.total / (test.maxMarks || 300)) * 100)}%</div></div><button onClick={() => deleteTest(test.id)} className="p-2 text-gray-600 hover:text-red-500 transition" title="Delete Test Record"><Trash2 size={20} /></button></div></div>))}</div>
    </div>
  );
};

// --- 5. ANALYSIS COMPONENT (Fixed Axis & Zero Filling) ---
const Analysis = ({ data }) => {
    const [range, setRange] = useState('Week'); // Week, Month, Year, All

    // -- Helper to Generate Fixed Timeline --
    const generateTimeline = () => {
        const history = data.history || {};
        const now = new Date();
        const timeline = [];

        if (range === 'Week') {
            // Sunday to Saturday (Fixed 7 days)
            const currentDay = now.getDay(); // 0 = Sun, 6 = Sat
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - currentDay); // Go back to Sunday

            for (let i = 0; i < 7; i++) {
                const d = new Date(startOfWeek);
                d.setDate(startOfWeek.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                timeline.push({
                    name: d.toLocaleDateString('en-US', { weekday: 'short' }), // Sun, Mon...
                    minutes: history[dateStr] || 0, // Fill 0 if no data
                    date: dateStr // Keep for reference
                });
            }
        } 
        else if (range === 'Month') {
            // 1st to End of Month (Fixed days)
            const year = now.getFullYear();
            const month = now.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get exact days

            for (let i = 1; i <= daysInMonth; i++) {
                // Create date string manually to avoid timezone shifts
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                timeline.push({
                    name: String(i), // 1, 2, 3...
                    minutes: history[dateStr] || 0
                });
            }
        } 
        else if (range === 'Year') {
            // Jan to Dec (Fixed 12 months)
            const year = now.getFullYear();
            
            for (let i = 0; i < 12; i++) {
                // Sum all minutes for this month
                let monthlyTotal = 0;
                // Filter history keys that match "YYYY-MM"
                const monthPrefix = `${year}-${String(i + 1).padStart(2, '0')}`;
                Object.keys(history).forEach(dateStr => {
                    if (dateStr.startsWith(monthPrefix)) monthlyTotal += history[dateStr];
                });

                timeline.push({
                    name: new Date(year, i).toLocaleDateString('en-US', { month: 'short' }), // Jan, Feb...
                    minutes: monthlyTotal
                });
            }
        }
        else {
            // All Time (Just show sorted history or defaults)
            Object.keys(history).sort().forEach(dateStr => {
                timeline.push({ name: dateStr.slice(5), minutes: history[dateStr] });
            });
        }
        return timeline;
    };

    const trendData = generateTimeline();
    const totalMinutes = trendData.reduce((acc, curr) => acc + curr.minutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Subject data (Global Fallback)
    const subjectData = [
        { name: 'Physics', value: data.subjects["Physics"]?.timeSpent || 0 },
        { name: 'Maths', value: data.subjects["Maths"]?.timeSpent || 0 },
        { name: 'Chemistry', value: (data.subjects["Organic Chem"]?.timeSpent || 0) + (data.subjects["Inorganic Chem"]?.timeSpent || 0) + (data.subjects["Physical Chem"]?.timeSpent || 0) }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-white mb-1">Deep Dive Analysis</h1><p className="text-gray-400">Detailed performance metrics</p></div>
                <div className="flex bg-white/5 rounded-lg p-1">
                    {['Week', 'Month', 'Year'].map(r => (<button key={r} onClick={() => setRange(r)} className={`px-4 py-2 rounded-md text-sm font-bold transition ${range === r ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>{r}</button>))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="flex flex-col justify-center items-center h-40"><span className="text-gray-400 text-xs font-bold uppercase mb-2">Total Time ({range})</span><div className="text-5xl font-bold text-white">{totalHours}<span className="text-2xl text-gray-500">h</span></div></GlassCard>
                <GlassCard className="flex flex-col justify-center items-center h-40"><span className="text-gray-400 text-xs font-bold uppercase mb-2">Avg / Day</span><div className="text-5xl font-bold text-white">{(totalHours / (trendData.length || 1)).toFixed(1)}<span className="text-2xl text-gray-500">h</span></div></GlassCard>
                <GlassCard className="flex flex-col justify-center items-center h-40"><span className="text-gray-400 text-xs font-bold uppercase mb-2">Most Studied</span><div className="text-3xl font-bold text-violet-400">{subjectData.sort((a,b) => b.value - a.value)[0]?.name || '-'}</div></GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="h-[350px]">
                    <h3 className="text-lg font-bold text-white mb-4">Study Trend ({range})</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs><linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                            <YAxis hide />
                            <RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff'}} formatter={(val) => [`${Math.round(val)}m`, 'Study Time']} />
                            <Area type="monotone" dataKey="minutes" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorTrend)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="h-[350px]">
                    <h3 className="text-lg font-bold text-white mb-4">Subject Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={subjectData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {subjectData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none"/>)}
                            </Pie>
                            <RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderRadius: '8px', border:'none'}} formatter={(val) => `${Math.round(val/60)}m`} />
                            <Legend verticalAlign="bottom" iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>
        </div>
    );
};

// --- 6. DASHBOARD (Fixed Week Graph + Streak Only) ---
const Dashboard = ({ data, setData, goToTimer, user }) => {
  const today = new Date().toISOString().split('T')[0];
  const history = data.history || {};
  const todayMins = history[today] || 0;
  
  // Streak Calculation
  let streak = 0;
  if ((history[today] || 0) > 0) streak++;
  let d = new Date(); d.setDate(d.getDate() - 1);
  while (true) {
    const dateStr = d.toISOString().split('T')[0];
    if ((history[dateStr] || 0) > 0) { streak++; d.setDate(d.getDate() - 1); } else break;
  }

  // Fixed Weekly Graph (Sun - Sat)
  const getWeeklyData = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0-6
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay); // Go back to Sunday

    const chartData = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        chartData.push({ 
            name: d.toLocaleDateString('en-US', { weekday: 'short' }), // Sun, Mon
            hours: parseFloat(((history[dateStr] || 0) / 60).toFixed(1)) 
        });
    }
    return chartData;
  };

  const addTask = () => { const t = prompt("Task?"); if(t) setData(prev => ({ ...prev, tasks: [{ id: Date.now(), text: t, completed: false }, ...prev.tasks] })); };
  const toggleTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  const removeTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-8 py-4">
          <div><p className="text-gray-500 text-xs font-bold tracking-widest mb-2 uppercase">TODAY'S FOCUS</p><h1 className="text-8xl font-bold text-white tracking-tighter drop-shadow-2xl">{Math.floor(todayMins/60)}h <span className="text-4xl text-gray-500">{Math.round(todayMins%60)}m</span></h1></div>
          <div className="flex justify-center">
              <div className="bg-[#18181b] border border-white/10 p-4 rounded-2xl flex flex-col items-center min-w-[150px]">
                  <div className="text-3xl font-bold text-white mb-1">{streak} <span className="text-sm text-orange-500">🔥</span></div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Day Streak</span>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="min-h-[300px] flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">This Week's Progress (Sun - Sat)</h3>
          <div className="flex-1 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getWeeklyData()}>
                <defs><linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis hide domain={[0, 'auto']} />
                <RechartsTooltip contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff'}} itemStyle={{color: '#a78bfa'}} formatter={(value) => [`${value} hrs`, "Study Time"]} />
                <Area type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

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
    </div>
  );
};

// --- MAIN APP SHELL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // --- CHECK FOR NOTIFICATIONS ON APP LOAD ---
  useEffect(() => {
      const checkReminders = () => {
          if (!data.mockTests || data.mockTests.length === 0) return;
          
          const todayStr = new Date().toISOString().split('T')[0];
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];

          data.mockTests.forEach(test => {
              if (test.reminder) {
                  if (test.date === tomorrowStr) {
                      new Notification("Upcoming Test Reminder", { body: `Tomorrow: ${test.name} (${test.type})` });
                  } else if (test.date === todayStr) {
                      new Notification("Test Day!", { body: `Good luck for ${test.name} today!` });
                  }
              }
          });
      };

      if (Notification.permission === 'granted') {
          checkReminders();
      }
  }, [data.mockTests]);

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
    const newHistory = { ...data.history, [today]: (data.history?.[today] || 0) + mins };
    const newSubjects = { ...data.subjects, [subject]: { ...data.subjects[subject], timeSpent: data.subjects[subject].timeSpent + seconds } };
    setData(prev => ({
      ...prev,
      subjects: newSubjects,
      history: newHistory,
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
            { id: 'analysis', icon: PieChartIcon, label: 'Data' }, 
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
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-[#09090b]/90 backdrop-blur-md z-30 py-2 -mt-4 border-b border-white/5">
           <h2 className="text-xl font-bold text-gray-200 capitalize flex items-center gap-2">
             {view === 'kpp' ? 'Physics KPP' : view}
           </h2>
           <ProfileDropdown user={user} onLogout={handleLogout} />
        </div>

        {view === 'dashboard' && <Dashboard data={data} setData={setData} goToTimer={() => setView('timer')} user={user} />}
        {view === 'analysis' && <Analysis data={data} />} 
        {view === 'timer' && <FocusTimer data={data} setData={setData} onSaveSession={saveSession} />} 
        {view === 'syllabus' && <Syllabus data={data} setData={setData} />}
        {view === 'mocks' && <MockTestTracker data={data} setData={setData} />}
        {view === 'kpp' && <PhysicsKPP data={data} setData={setData} />} 
      </main>

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#09090b]/95 backdrop-blur-md border-t border-white/10 p-4 flex justify-around z-50">
        <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'text-violet-500' : 'text-gray-500'}><LayoutDashboard /></button>
        <button onClick={() => setView('timer')} className={view === 'timer' ? 'text-violet-500' : 'text-gray-500'}><TimerIcon /></button>
        <button onClick={() => setView('analysis')} className={view === 'analysis' ? 'text-violet-500' : 'text-gray-500'}><PieChartIcon /></button>
        <button onClick={() => setView('syllabus')} className={view === 'syllabus' ? 'text-violet-500' : 'text-gray-500'}><BookOpen /></button>
      </div>
    </div>
  );
}