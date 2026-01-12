// FILE: src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, BookOpen, Zap, Flame, Trophy, 
  Play, Pause, CheckCircle, X, ChevronRight, ChevronLeft,
  Plus, Trash2, FileText, TrendingUp, LogOut,
  Timer as TimerIcon, StopCircle, Target, User,
  Settings, Image as ImageIcon, ExternalLink, Maximize, Minimize,
  PieChart as PieChartIcon, Upload, Bell, Calendar, Edit3, Mail, Lock, KeyRound, CheckSquare,
  Tag, Menu, HelpCircle, MessageSquare, Send, Bot, Sparkles, ArrowRight, Paperclip, Image as ImgIcon
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  Legend, LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- FIREBASE IMPORTS ---
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
// MAKE SURE YOU CREATED firebase.js IN THE SAME FOLDER
import { auth, googleProvider, db } from "./firebase"; 

/**
 * PREPPILOT - v43.0 (FULL FEATURE SET + SAVED CHAT + IMAGE AI)
 */

// --- CONSTANTS ---
const ALL_SUBJECTS = ["Physics", "Maths", "Biology", "Organic Chem", "Inorganic Chem", "Physical Chem"];
const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ec4899']; 

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

// --- THEME ENGINE ---
const THEME_COLORS = [
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Slate', hex: '#64748b' },
];

const getThemeStyles = (themeName) => {
  const safeName = themeName || 'Violet';
  const map = {
    'Teal': { bg: 'bg-teal-600', hover: 'hover:bg-teal-700', text: 'text-teal-500', border: 'border-teal-500', light: 'bg-teal-500/20', stroke: '#14b8a6', ring: 'ring-teal-500', msgUser: 'bg-teal-600', msgAi: 'bg-teal-900/40' },
    'Rose': { bg: 'bg-rose-600', hover: 'hover:bg-rose-700', text: 'text-rose-500', border: 'border-rose-500', light: 'bg-rose-500/20', stroke: '#f43f5e', ring: 'ring-rose-500', msgUser: 'bg-rose-600', msgAi: 'bg-rose-900/40' },
    'Violet': { bg: 'bg-violet-600', hover: 'hover:bg-violet-700', text: 'text-violet-500', border: 'border-violet-500', light: 'bg-violet-500/20', stroke: '#8b5cf6', ring: 'ring-violet-500', msgUser: 'bg-violet-600', msgAi: 'bg-violet-900/40' },
    'Amber': { bg: 'bg-amber-600', hover: 'hover:bg-amber-700', text: 'text-amber-500', border: 'border-amber-500', light: 'bg-amber-500/20', stroke: '#f59e0b', ring: 'ring-amber-500', msgUser: 'bg-amber-600', msgAi: 'bg-amber-900/40' },
    'Cyan': { bg: 'bg-cyan-600', hover: 'hover:bg-cyan-700', text: 'text-cyan-500', border: 'border-cyan-500', light: 'bg-cyan-500/20', stroke: '#06b6d4', ring: 'ring-cyan-500', msgUser: 'bg-cyan-600', msgAi: 'bg-cyan-900/40' },
    'Slate': { bg: 'bg-slate-600', hover: 'hover:bg-slate-700', text: 'text-slate-500', border: 'border-slate-500', light: 'bg-slate-500/20', stroke: '#64748b', ring: 'ring-slate-500', msgUser: 'bg-slate-600', msgAi: 'bg-slate-900/40' },
  };
  return map[safeName] || map['Violet'];
};

const INITIAL_DATA = {
  dailyGoal: 10,
  tasks: [],
  subjects: ALL_SUBJECTS.reduce((acc, sub) => ({ ...acc, [sub]: { chapters: [], timeSpent: 0 } }), {}),
  mockTests: [],
  kppList: [],
  history: {}, 
  xp: 0, 
  settings: { theme: 'Violet', mode: 'Dark', username: '' },
  bgImage: "",
  selectedExams: [], 
};

const getUserSubjects = (selectedExams) => {
  let showMath = false, showBio = false;
  const exams = selectedExams || [];
  if (exams.length === 0) return ALL_SUBJECTS;
  
  exams.forEach(exam => {
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

// --- UTILITY: SMART TEXT FORMATTER (MATH & BOLD) ---
const formatMathSymbols = (text) => {
  if (!text) return "";
  return text
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\\int/g, "∫")
    .replace(/\\theta/g, "θ")
    .replace(/\\pi/g, "π")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\lambda/g, "λ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\infty/g, "∞")
    .replace(/\\approx/g, "≈")
    .replace(/\\neq/g, "≠")
    .replace(/sqrt/g, "√")
    .replace(/->/g, "→");
};

const FormatInline = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return <>{parts.map((part, j) => part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="font-bold text-inherit">{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>)}</>;
};

const SmartText = ({ text }) => {
  if (!text) return null;
  const cleanedText = formatMathSymbols(text);
  const lines = cleanedText.split('\n');
  
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return <div key={i} className="flex gap-2 ml-2"><span className="text-gray-400 mt-1.5">•</span><p className="flex-1"><FormatInline text={line.trim().substring(2)} /></p></div>;
        }
        if (line.trim().endsWith(':')) return <h4 key={i} className="font-bold mt-3 mb-1 text-base"><FormatInline text={line} /></h4>;
        if (!line.trim()) return <div key={i} className="h-2"></div>;
        return <p key={i}><FormatInline text={line} /></p>;
      })}
    </div>
  );
};

// --- UTILITY COMPONENTS ---
const GlassCard = ({ children, className = "", hover = false, isDark = true }) => (
  <motion.div 
    whileHover={hover ? { scale: 1.01, backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" } : {}}
    className={`${isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-black/10 shadow-lg'} border rounded-2xl p-6 shadow-xl ${className}`}
  >
    {children}
  </motion.div>
);

const ProfileDropdown = ({ user, onLogout, onChangeExam, data, setView, theme, isDark }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${theme.bg} text-white`}>{user.email[0].toUpperCase()}</div>
            </button>
            {isOpen && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-gray-200'}`}>
                     <div className="px-4 py-2 border-b border-gray-700/50 mb-2">
                        <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>{user.email}</p>
                        <p className="text-[10px] text-gray-500">Level {Math.floor((data.xp || 0)/60)}</p>
                     </div>
                     <button onClick={() => {onChangeExam(); setIsOpen(false)}} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-500/10 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Change Exams</button>
                     <button onClick={() => {setView('settings'); setIsOpen(false)}} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-500/10 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Settings</button>
                     <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">Log Out</button>
                </div>
            )}
        </div>
    );
};

// --- HEATMAP ---
const StudyHeatmap = ({ history, theme, isDark }) => {
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);
  const getCellColor = (minutes) => {
      if (!minutes) return isDark ? 'bg-white/5' : 'bg-gray-100'; 
      if (minutes > 0 && minutes <= 60) return `${theme.light} opacity-60`;
      if (minutes > 60 && minutes <= 180) return `${theme.light} opacity-100`;
      if (minutes > 180 && minutes <= 360) return theme.bg;
      return `${theme.bg} brightness-110 shadow-[0_0_8px_rgba(255,255,255,0.3)]`;
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {months.map(monthIndex => {
        const date = new Date(year, monthIndex, 1);
        const monthName = date.toLocaleString('default', { month: 'long' });
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const startDay = date.getDay();
        const slots = [];
        for(let i=0; i<startDay; i++) slots.push(null);
        for(let i=1; i<=daysInMonth; i++) {
            const dayStr = `${year}-${String(monthIndex+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const safeHistory = history || {};
            slots.push({ date: dayStr, day: i, mins: safeHistory[dayStr] || 0 });
        }
        return (
          <div key={monthIndex} className={`p-4 rounded-2xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
            <h4 className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{monthName}</h4>
            <div className="grid grid-cols-7 gap-1 mb-2">{['S','M','T','W','T','F','S'].map(d => (<div key={d} className="text-[10px] text-center text-gray-500 font-bold">{d}</div>))}</div>
            <div className="grid grid-cols-7 gap-1.5">{slots.map((slot, k) => !slot ? <div key={k} className="w-full h-full" /> : (<div key={k} title={`${slot.date}: ${Math.round(slot.mins/60)}h`} className={`aspect-square rounded-md transition-all hover:scale-110 cursor-pointer ${getCellColor(slot.mins)}`}></div>))}</div>
          </div>
        );
      })}
    </div>
  );
};

// --- PREPAI VIEW (FULL SCREEN + SAVED + IMAGE) ---
const PrepAIView = ({ data, theme, isDark }) => {
  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('prepai_history');
      return saved ? JSON.parse(saved) : [{ role: 'model', text: 'Hello! I am PrepAI. Ask me to solve a doubt, explain a topic, or analyze your study data. You can upload question images too!' }];
    } catch (e) { return []; }
  };

  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const textCol = isDark ? 'text-white' : 'text-gray-900';
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { localStorage.setItem('prepai_history', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const clearChat = () => {
    if(window.confirm("Delete chat history?")) {
      const reset = [{ role: 'model', text: 'Chat cleared. Ready for new doubts!' }];
      setMessages(reset);
      localStorage.setItem('prepai_history', JSON.stringify(reset));
    }
  };

  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  const handleSend = async () => {
    if (!input.trim() && !image) return;
    const userMsg = { role: 'user', text: input, image: image ? URL.createObjectURL(image) : null };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImage = image; 
    setImage(null);
    setLoading(true);

    try {
      // --- PASTE YOUR GEMINI API KEY HERE ---
      const genAI = new GoogleGenerativeAI("YOUR_API_KEY_HERE");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // 1.5 Flash for Images

      const context = `SYSTEM: You are PrepAI, an expert JEE/NEET tutor. User Data: Exams: ${data.selectedExams?.join(", ")}. Tasks: ${data.tasks.filter(t=>!t.completed).map(t=>t.text).join(", ")}. Goal: Answer doubts clearly. If an image is provided, solve the question in it step-by-step. Use **bold** for key terms.`;
      
      let promptParts = [context + "\n\nUser: " + userMsg.text];
      if (currentImage) {
        const imagePart = await fileToGenerativePart(currentImage);
        promptParts.push(imagePart);
      }

      const result = await model.generateContent(promptParts);
      const response = await result.response;
      setMessages(prev => [...prev, { role: 'model', text: response.text() }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to AI. Please check your API key and Internet." }]);
    }
    setLoading(false);
  };

  return (
    <div className="h-screen flex flex-col w-full relative -mt-4 -ml-4 md:-ml-0 p-0">
      {/* Top Bar (Fixed) */}
      <div className={`p-4 border-b flex justify-between items-center z-20 ${isDark ? 'border-white/10 bg-[#09090b]' : 'border-gray-200 bg-white'}`}>
        <h1 className={`text-xl font-bold flex items-center gap-2 ${textCol}`}><Sparkles className={theme.text} /> PrepAI</h1>
        <button onClick={clearChat} className="p-2 text-gray-500 hover:text-red-500 transition rounded-lg hover:bg-red-500/10"><Trash2 size={20}/></button>
      </div>
      
      {/* Chat Area */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32 ${isDark ? 'bg-[#09090b]' : 'bg-gray-50'}`}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 ${theme.bg} text-white`}><Bot size={16} /></div>}
            <div className={`max-w-[90%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? `${theme.msgUser} text-white rounded-br-none` : `${isDark ? 'bg-white/10 text-gray-200' : 'bg-white text-gray-800'} rounded-bl-none`}`}>
              {msg.image && <img src={msg.image} alt="User upload" className="mb-3 rounded-lg max-h-60 object-contain bg-black/50" />}
              <SmartText text={msg.text} />
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start items-center gap-2 text-xs text-gray-500 ml-11"><span className="animate-pulse">Thinking & Solving...</span></div>}
        <div ref={bottomRef} />
      </div>

      {/* Input Area (Fixed Bottom) */}
      <div className={`absolute bottom-0 left-0 w-full p-4 border-t ${isDark ? 'border-white/10 bg-[#09090b]' : 'border-gray-200 bg-white'}`}>
        {image && (
          <div className="flex items-center gap-2 mb-2 p-2 rounded bg-gray-100 dark:bg-white/10 w-fit">
            <ImgIcon size={14} className={textCol}/> 
            <span className={`text-xs ${textCol}`}>Image selected</span>
            <button onClick={()=>setImage(null)}><X size={14} className="text-gray-500"/></button>
          </div>
        )}
        <div className={`flex items-center gap-3 p-2 rounded-xl border ${isDark ? 'bg-black/20 border-white/10' : 'bg-gray-100 border-transparent'}`}>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
          <button onClick={() => fileInputRef.current.click()} className={`p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 ${image ? theme.text : ''}`}>
            <Paperclip size={20} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a math problem, or upload a photo..." 
            className={`flex-1 bg-transparent outline-none text-sm ${textCol} placeholder-gray-500`}
          />
          <button onClick={handleSend} disabled={loading} className={`p-2 rounded-lg ${theme.bg} text-white hover:scale-105 transition disabled:opacity-50`}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD ---
const Dashboard = ({ data, setData, goToTimer, setView, user, theme, isDark }) => {
  const today = new Date().toISOString().split('T')[0];
  const history = data.history || {}; const todayMins = history[today] || 0;
  let streak = 0; if ((history[today] || 0) > 0) streak++; let d = new Date(); d.setDate(d.getDate() - 1); while (true) { const dateStr = d.toISOString().split('T')[0]; if ((history[dateStr] || 0) > 0) { streak++; d.setDate(d.getDate() - 1); } else break; }
  const getCountdowns = () => { const exams = data.selectedExams || []; return exams.map(exam => { const config = EXAM_CONFIG[exam]; if (!config) return null; const diff = new Date(config.date) - new Date(); if (diff < 0) return null; return { exam, days: Math.floor(diff / (1000 * 60 * 60 * 24)) }; }).filter(Boolean).sort((a,b) => a.days - b.days); };
  const countdowns = getCountdowns();
  const getWeeklyData = () => { const now = new Date(); const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); const chart = []; for(let i=0; i<7; i++){ const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); chart.push({ name: d.toLocaleDateString('en-US',{weekday:'short'}), hours: parseFloat(((history[d.toISOString().split('T')[0]]||0)/60).toFixed(1)) }); } return chart; };
  const addTask = () => { const t = prompt("Task Name:"); if(!t) return; const sub = prompt("Subject? (P, C, M, B or Leave empty)"); let subjectTag = "General"; if(sub) { if(sub.toLowerCase().startsWith('p')) subjectTag = "Physics"; if(sub.toLowerCase().startsWith('c')) subjectTag = "Chemistry"; if(sub.toLowerCase().startsWith('m')) subjectTag = "Maths"; if(sub.toLowerCase().startsWith('b')) subjectTag = "Biology"; } setData(prev => ({ ...prev, tasks: [{ id: Date.now(), text: t, subject: subjectTag, completed: false }, ...prev.tasks] })); };
  const toggleTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  const removeTask = (id) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  const textCol = isDark ? 'text-white' : 'text-gray-900';

  const [briefing, setBriefing] = useState("");
  const [loadingBrief, setLoadingBrief] = useState(false);

  const generateBriefing = async () => {
    setLoadingBrief(true);
    try {
      // --- PASTE YOUR GEMINI API KEY HERE AS WELL ---
      const genAI = new GoogleGenerativeAI("YOUR_API_KEY_HERE");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Give me a 2-sentence summary of my day. Data: Studied ${Math.floor(todayMins/60)}h ${Math.round(todayMins%60)}m. Streak: ${streak}. Pending Tasks: ${data.tasks.filter(t=>!t.completed).length}.`;
      const result = await model.generateContent(prompt);
      setBriefing(result.response.text());
    } catch (e) { setBriefing("Unable to generate briefing. Check API Key."); }
    setLoadingBrief(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-8 py-4">
          <div><p className="text-gray-500 text-xs font-bold tracking-widest mb-2 uppercase">TODAY'S FOCUS</p><h1 className={`text-8xl font-bold ${textCol} tracking-tighter`}>{Math.floor(todayMins/60)}h <span className="text-4xl text-gray-500">{Math.round(todayMins%60)}m</span></h1></div>
          <div className="flex flex-wrap justify-center gap-4">
              <div className={`border p-4 rounded-2xl flex flex-col items-center min-w-[140px] ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-gray-200'}`}><div className={`text-3xl font-bold ${textCol} mb-1`}>{streak} <span className="text-sm text-orange-500">🔥</span></div><span className="text-[10px] text-gray-500 uppercase font-bold">Streak</span></div>
              {countdowns.map((cd, i) => (
                  <div key={i} className={`border p-4 rounded-2xl flex flex-col items-center min-w-[140px] ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-gray-200'}`}>
                      <div className={`text-3xl font-bold ${textCol} mb-1`}>{cd.days} <span className={`text-sm ${theme.text}`}>d</span></div>
                      <span className="text-[10px] text-gray-500 uppercase font-bold truncate max-w-[120px]">{cd.exam}</span>
                  </div>
              ))}
          </div>
      </div>

      <GlassCard className={`relative overflow-hidden ${isDark ? `border-${theme.border} bg-white/5` : 'bg-white border-gray-200'}`} isDark={isDark}>
        <div className="flex justify-between items-start gap-4">
            <div>
                <h3 className={`font-bold flex items-center gap-2 ${textCol} mb-2`}><Sparkles size={18} className="text-yellow-400" /> AI Daily Briefing</h3>
                {briefing ? (
                    <div className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}><SmartText text={briefing} /></div>
                ) : (
                    <p className="text-xs text-gray-500 italic">Get a quick summary of your progress and tasks.</p>
                )}
            </div>
            <div className="flex flex-col gap-2">
                {!briefing && <button onClick={generateBriefing} disabled={loadingBrief} className={`px-4 py-2 rounded-lg text-xs font-bold ${theme.bg} text-white`}>{loadingBrief ? '...' : 'Generate'}</button>}
                <button onClick={() => setView('prepai')} className={`px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-2 ${isDark ? 'border-white/10 hover:bg-white/10 text-white' : 'border-gray-200 hover:bg-gray-100 text-black'}`}>Ask PrepAI <ArrowRight size={12} /></button>
            </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="min-h-[300px] flex flex-col" isDark={isDark}>
          <h3 className={`text-lg font-bold ${textCol} mb-6`}>This Week</h3>
          <div className="flex-1 w-full min-h-[200px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={getWeeklyData()}><defs><linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.stroke} stopOpacity={0.8}/><stop offset="95%" stopColor={theme.stroke} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} /><YAxis hide /><RechartsTooltip contentStyle={{backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#27272a' : '#ddd', color: isDark?'#fff':'#000'}} /><Area type="monotone" dataKey="hours" stroke={theme.stroke} strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" /></AreaChart></ResponsiveContainer></div>
        </GlassCard>
        <GlassCard isDark={isDark}>
            <div className="flex justify-between items-center mb-6"><h3 className={`text-lg font-bold ${textCol}`}>Tasks</h3><button onClick={addTask} className={`text-xs px-3 py-1 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>+ Add</button></div>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {data.tasks.map(task => (
                <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${isDark ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-gray-50 border-black/5 hover:border-black/20'}`}>
                  <div onClick={() => toggleTask(task.id)} className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border-2 ${task.completed ? `${theme.bg} ${theme.border}` : 'border-gray-500'}`}>{task.completed && <CheckCircle size={12} className="text-white mx-auto mt-0.5" />}</div><div><span className={`block text-sm ${task.completed ? 'text-gray-500 line-through' : textCol}`}>{task.text}</span>{task.subject && <span className="text-[10px] text-gray-400">{task.subject}</span>}</div></div>
                  <button onClick={() => removeTask(task.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                </div>
              ))}
            </div>
        </GlassCard>
      </div>
    </div>
  );
};

// --- RESTORED: SETTINGS, SYLLABUS, KPP, TIMER, MOCKS (STANDARD) ---
const Analysis = ({ data, theme, isDark }) => {
    const textCol = isDark ? 'text-white' : 'text-gray-900';
    const [range, setRange] = useState('Week');
    const generateTimeline = () => { const history = data.history || {}; const now = new Date(); const timeline = []; if (range === 'Week') { const currentDay = now.getDay(); const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - currentDay); for (let i = 0; i < 7; i++) { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); const dateStr = d.toISOString().split('T')[0]; timeline.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), minutes: history[dateStr] || 0 }); } } else if (range === 'Month') { const year = now.getFullYear(); const month = now.getMonth(); const daysInMonth = new Date(year, month + 1, 0).getDate(); for (let i = 1; i <= daysInMonth; i++) { const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; timeline.push({ name: String(i), minutes: history[dateStr] || 0 }); } } else if (range === 'Year') { const year = now.getFullYear(); for (let i = 0; i < 12; i++) { let monthlyTotal = 0; const monthPrefix = `${year}-${String(i + 1).padStart(2, '0')}`; Object.keys(history).forEach(dateStr => { if (dateStr.startsWith(monthPrefix)) monthlyTotal += history[dateStr]; }); timeline.push({ name: new Date(year, i).toLocaleDateString('en-US', { month: 'short' }), minutes: monthlyTotal }); } } return timeline; };
    const trendData = generateTimeline(); 
    const totalHours = (trendData.reduce((acc, curr) => acc + curr.minutes, 0) / 60).toFixed(1);
    const subjectData = [{ name: 'Physics', value: data.subjects["Physics"]?.timeSpent || 0 }, { name: 'Maths', value: data.subjects["Maths"]?.timeSpent || 0 }, { name: 'Chemistry', value: (data.subjects["Organic Chem"]?.timeSpent || 0) + (data.subjects["Inorganic Chem"]?.timeSpent || 0) + (data.subjects["Physical Chem"]?.timeSpent || 0) }, { name: 'Biology', value: data.subjects["Biology"]?.timeSpent || 0 }];
    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center"><div><h1 className={`text-3xl font-bold ${textCol} mb-1`}>Analysis</h1></div><div className={`flex rounded-lg p-1 ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>{['Week', 'Month', 'Year'].map(r => (<button key={r} onClick={() => setRange(r)} className={`px-4 py-2 rounded-md text-sm font-bold transition ${range === r ? `${theme.bg} text-white` : 'text-gray-500'}`}>{r}</button>))}</div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><GlassCard isDark={isDark} className="flex flex-col justify-center items-center h-40"><span className="text-gray-500 text-xs font-bold uppercase mb-2">Total Time</span><div className={`text-5xl font-bold ${textCol}`}>{totalHours}<span className="text-2xl text-gray-500">h</span></div></GlassCard><GlassCard isDark={isDark} className="flex flex-col justify-center items-center h-40"><span className="text-gray-500 text-xs font-bold uppercase mb-2">Most Studied</span><div className={`text-3xl font-bold ${theme.text}`}>{subjectData.sort((a,b) => b.value - a.value)[0]?.name || '-'}</div></GlassCard></div>
            <GlassCard isDark={isDark}><h3 className={`text-lg font-bold ${textCol} mb-4`}>Yearly Activity</h3><StudyHeatmap history={data.history} theme={theme} isDark={isDark} /></GlassCard>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><GlassCard isDark={isDark} className="h-[400px]"><h3 className={`text-lg font-bold ${textCol} mb-4`}>{range}ly Trend</h3><ResponsiveContainer width="100%" height="90%"><AreaChart data={trendData}><defs><linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.stroke} stopOpacity={0.8}/><stop offset="95%" stopColor={theme.stroke} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark?"rgba(255,255,255,0.05)":"#eee"} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} /><YAxis hide /><RechartsTooltip contentStyle={{backgroundColor: isDark?'#18181b':'#fff', borderColor: isDark?'#27272a':'#ddd', color: isDark?'#fff':'#000'}} /><Area type="monotone" dataKey="minutes" stroke={theme.stroke} strokeWidth={3} fill="url(#colorTrend)" /></AreaChart></ResponsiveContainer></GlassCard><GlassCard isDark={isDark} className="h-[400px]"><h3 className={`text-lg font-bold ${textCol} mb-4`}>Subject Mix</h3><ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={subjectData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{subjectData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none"/>)}</Pie><RechartsTooltip contentStyle={{backgroundColor: isDark?'#18181b':'#fff', borderRadius:'8px', border:'none', color: isDark ? '#fff' : '#000'}} /><Legend verticalAlign="bottom"/></PieChart></ResponsiveContainer></GlassCard></div>
        </div>
    );
};

const Syllabus = ({ data, setData, theme, isDark }) => {
  const mySubjects = getUserSubjects(data.selectedExams);
  const [selectedSubject, setSelectedSubject] = useState(mySubjects[0]);
  const [gradeView, setGradeView] = useState('11');
  useEffect(() => { if (!mySubjects.includes(selectedSubject)) setSelectedSubject(mySubjects[0]); }, [data.selectedExams]);
  const addChapter = () => { const name = prompt(`Enter Class ${gradeView} Chapter Name:`); const lectures = prompt("Total Main Lectures:"); if (name && lectures) { const newChapter = { id: Date.now().toString(), name, totalLectures: parseInt(lectures), lectures: new Array(parseInt(lectures)).fill(false), grade: gradeView, miscLectures: [], diby: { solved: 0, total: 0 } }; const newData = { ...data }; newData.subjects[selectedSubject].chapters.push(newChapter); setData(newData); } };
  const updateChapter = (updated) => { const newData = { ...data }; const idx = newData.subjects[selectedSubject].chapters.findIndex(c => c.id === updated.id); newData.subjects[selectedSubject].chapters[idx] = updated; setData(newData); };
  const deleteChapter = (id) => { const newData = { ...data }; newData.subjects[selectedSubject].chapters = newData.subjects[selectedSubject].chapters.filter(c => c.id !== id); setData(newData); };
  const filteredChapters = data.subjects[selectedSubject]?.chapters.filter(c => c.grade === gradeView || (!c.grade && gradeView === '11')) || [];
  const textCol = isDark ? 'text-white' : 'text-gray-900';
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center"><h1 className={`text-3xl font-bold ${textCol}`}>Syllabus Tracker</h1><button onClick={addChapter} className={`px-6 py-3 ${theme.bg} text-white rounded-xl font-bold flex items-center gap-2`}><Plus size={18} /> Add Chapter</button></div>
      <div className={`flex gap-4 p-1 w-fit rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}>{['11', '12'].map(g => <button key={g} onClick={() => setGradeView(g)} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${gradeView === g ? `${theme.bg} text-white` : 'text-gray-500'}`}>Class {g}th</button>)}</div>
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">{mySubjects.map(s => <button key={s} onClick={() => setSelectedSubject(s)} className={`px-6 py-3 rounded-xl font-bold transition whitespace-nowrap ${selectedSubject === s ? `${isDark ? 'bg-white text-black' : 'bg-gray-800 text-white'}` : `${isDark ? 'bg-[#121212] border border-white/10 text-gray-400' : 'bg-white border border-gray-200 text-gray-500'}`}`}>{s}</button>)}</div>
      <div className="grid gap-4">{filteredChapters.map(chapter => <ChapterItem key={chapter.id} subjectName={selectedSubject} chapter={chapter} onUpdate={updateChapter} onDelete={deleteChapter} theme={theme} isDark={isDark} />)}</div>
    </div>
  );
};

const ChapterItem = ({ subjectName, chapter, onUpdate, onDelete, theme, isDark }) => {
  const [expanded, setExpanded] = useState(false);
  const completed = chapter.lectures.filter(l => l).length;
  const progress = chapter.totalLectures > 0 ? Math.round((completed/chapter.totalLectures)*100) : 0;
  const toggleLec = (i) => { const newLecs = [...chapter.lectures]; newLecs[i] = !newLecs[i]; onUpdate({ ...chapter, lectures: newLecs }); };
  const addMisc = () => { const name = prompt("Misc Lecture Name:"); const count = prompt("Number of videos:"); if(name && count) { const newMisc = { id: Date.now(), name, total: parseInt(count), checked: new Array(parseInt(count)).fill(false) }; onUpdate({ ...chapter, miscLectures: [...(chapter.miscLectures || []), newMisc] }); }};
  const toggleMisc = (miscId, index) => { const updatedMisc = chapter.miscLectures.map(m => { if(m.id === miscId) { const newChecked = [...m.checked]; newChecked[index] = !newChecked[index]; return { ...m, checked: newChecked }; } return m; }); onUpdate({ ...chapter, miscLectures: updatedMisc }); };
  const deleteMisc = (miscId) => { onUpdate({ ...chapter, miscLectures: chapter.miscLectures.filter(m => m.id !== miscId) }); };
  const updateDiby = (field, val) => { onUpdate({ ...chapter, diby: { ...(chapter.diby || {solved:0, total:0}), [field]: parseInt(val) || 0 } }); };
  const textCol = isDark ? 'text-white' : 'text-gray-900';
  const iconClass = progress === 100 ? 'bg-green-500/20 text-green-500' : `${theme.light} ${theme.text}`;
  return (
    <GlassCard isDark={isDark}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4"><div className={`p-3 rounded-full ${iconClass}`}>{progress===100 ? <CheckCircle size={24} /> : <BookOpen size={24} />}</div><div><h3 className={`text-xl font-bold ${textCol}`}>{chapter.name}</h3><p className="text-sm text-gray-400">{completed}/{chapter.totalLectures} Main Lecs • {progress}%</p></div></div>
        <div className="flex gap-2"><button onClick={(e) => {e.stopPropagation(); onDelete(chapter.id);}} className="text-gray-600 hover:text-red-500"><Trash2 size={18}/></button><ChevronRight className={`transition ${expanded?'rotate-90':''}`} /></div>
      </div>
      {expanded && (<div className="mt-6 space-y-6"><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Main Lectures</h4><div className="grid grid-cols-6 md:grid-cols-10 gap-2">{chapter.lectures.map((done, i) => <button key={i} onClick={() => toggleLec(i)} className={`p-2 rounded text-xs font-bold border transition ${done ? `${theme.bg} ${theme.border} text-white` : `border-transparent ${isDark ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-600'}`}`}>{i+1}</button>)}</div></div>{subjectName === 'Maths' && (<div className={`border p-4 rounded-xl ${isDark ? 'bg-blue-900/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}><h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2"><Target size={14}/> DIBY Questions</h4><div className="flex items-center gap-4"><div className="flex items-center gap-2"><span className="text-sm text-gray-400">Solved:</span><input type="number" className={`w-16 border rounded px-2 py-1 text-sm ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={chapter.diby?.solved || 0} onChange={e => updateDiby('solved', e.target.value)} /></div><span className="text-gray-500">/</span><div className="flex items-center gap-2"><span className="text-sm text-gray-400">Total:</span><input type="number" className={`w-16 border rounded px-2 py-1 text-sm ${isDark ? 'bg-black/30 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={chapter.diby?.total || 0} onChange={e => updateDiby('total', e.target.value)} /></div><div className="ml-auto text-blue-400 font-bold">{(chapter.diby?.total > 0 ? Math.round((chapter.diby.solved / chapter.diby.total) * 100) : 0)}% Done</div></div></div>)}<div className={`border-t pt-4 ${isDark ? 'border-white/10' : 'border-black/10'}`}><div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold text-gray-500 uppercase">Misc Topics (Extra)</h4><button onClick={addMisc} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}>+ Add Topic</button></div>{(chapter.miscLectures || []).map(misc => (<div key={misc.id} className="mb-3"><div className="flex justify-between items-center mb-1"><span className={`text-sm ${textCol}`}>{misc.name}</span><button onClick={() => deleteMisc(misc.id)} className="text-red-500 hover:text-red-400"><X size={12}/></button></div><div className="flex flex-wrap gap-2">{misc.checked.map((done, i) => (<button key={i} onClick={() => toggleMisc(misc.id, i)} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition ${done ? 'bg-gray-600 border-gray-600 text-white' : `border-transparent ${isDark ? 'bg-white/10' : 'bg-gray-200'} text-gray-600`}`}>{i+1}</button>))}</div></div>))}</div></div>)}
    </GlassCard>
  );
};

const PhysicsKPP = ({ data, setData, theme, isDark }) => {
    const [newKPP, setNewKPP] = useState({ name: '', chapter: '', attempted: false, corrected: false, myScore: 0, totalScore: 0 });
    const physicsChapters = data.subjects['Physics']?.chapters || [];
    const addKPP = () => { if (!newKPP.name || !newKPP.chapter) { alert("Name and Chapter required"); return; } const entry = { id: Date.now(), ...newKPP }; setData(prev => ({ ...prev, kppList: [...(prev.kppList || []), entry] })); setNewKPP({ name: '', chapter: '', attempted: false, corrected: false, myScore: 0, totalScore: 0 }); };
    const deleteKPP = (id) => { if(window.confirm("Delete KPP?")) setData(prev => ({ ...prev, kppList: prev.kppList.filter(k => k.id !== id) })); };
    const updateKPP = (id, field, value) => { setData(prev => ({ ...prev, kppList: prev.kppList.map(k => k.id === id ? { ...k, [field]: value } : k) })); };
    const graphData = (data.kppList || []).slice(-7).map(k => ({ name: k.name, percentage: k.totalScore > 0 ? Math.round((k.myScore / k.totalScore) * 100) : 0 }));
    const textCol = isDark ? 'text-white' : 'text-gray-900';
    return (<div className="space-y-6 max-w-5xl mx-auto"><h1 className={`text-3xl font-bold ${textCol} mb-2`}>Physics KPP Tracker</h1><GlassCard className={`border-t-4 ${theme.border}`} isDark={isDark}><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><input type="text" placeholder="KPP Name" className={`border rounded-lg p-3 outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-black'}`} value={newKPP.name} onChange={e => setNewKPP({...newKPP, name: e.target.value})} /><select className={`border rounded-lg p-3 outline-none ${isDark ? 'bg-[#18181b] border-white/10 text-white' : 'bg-white border-gray-300 text-black'}`} value={newKPP.chapter} onChange={e => setNewKPP({...newKPP, chapter: e.target.value})}><option value="">Select Physics Chapter</option>{physicsChapters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div><div className="flex flex-wrap gap-4 items-center"><label className="flex items-center gap-2 text-gray-500"><input type="checkbox" className={`w-5 h-5 ${theme.ring}`} checked={newKPP.attempted} onChange={e => setNewKPP({...newKPP, attempted: e.target.checked})} /> Attempted</label><label className="flex items-center gap-2 text-gray-500"><input type="checkbox" className="w-5 h-5" checked={newKPP.corrected} onChange={e => setNewKPP({...newKPP, corrected: e.target.checked})} /> Corrected</label><div className="flex items-center gap-2"><input type="number" placeholder="My Score" className={`w-24 border rounded-lg p-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={newKPP.myScore} onChange={e => setNewKPP({...newKPP, myScore: parseFloat(e.target.value)})} /><span className="text-gray-500">/</span><input type="number" placeholder="Total" className={`w-24 border rounded-lg p-2 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={newKPP.totalScore} onChange={e => setNewKPP({...newKPP, totalScore: parseFloat(e.target.value)})} /></div><button onClick={addKPP} className={`ml-auto px-6 py-2 ${theme.bg} text-white rounded-lg font-bold`}>Add KPP</button></div></GlassCard>{graphData.length > 0 && (<GlassCard className="h-[300px]" isDark={isDark}><ResponsiveContainer width="100%" height="90%"><BarChart data={graphData}><CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "#eee"} vertical={false} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} /><RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#27272a' : '#ddd', color: isDark ? '#fff' : '#000'}} /><Bar dataKey="percentage" fill={theme.stroke} radius={[4,4,0,0]} name="Score %" /></BarChart></ResponsiveContainer></GlassCard>)}<div className="grid gap-3">{(data.kppList || []).slice().reverse().map(kpp => (<div key={kpp.id} className={`border p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 ${isDark ? 'bg-[#121212] border-white/10' : 'bg-white border-gray-200'}`}><div className="flex-1"><div className="flex items-center gap-3"><span className={`font-bold text-lg ${textCol}`}>{kpp.name}</span><span className={`text-xs text-gray-500 px-2 py-1 rounded ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>{kpp.chapter}</span></div><div className="flex gap-4 mt-2 text-sm"><span className={kpp.attempted ? theme.text : "text-gray-500"}>Attempted</span><span className={kpp.corrected ? "text-green-500" : "text-gray-500"}>Corrected</span></div></div><div className="flex items-center gap-4"><div className="text-right"><div className={`font-bold text-xl ${textCol}`}>{kpp.myScore} <span className="text-gray-500 text-sm">/ {kpp.totalScore}</span></div><div className="text-xs text-gray-500">{kpp.totalScore > 0 ? Math.round((kpp.myScore/kpp.totalScore)*100) : 0}%</div></div><button onClick={() => deleteKPP(kpp.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={18} /></button></div></div>))}</div></div>);
};

const FocusTimer = ({ data, setData, onSaveSession, theme, isDark }) => {
  const [mode, setMode] = useState('stopwatch'); const [timeLeft, setTimeLeft] = useState(0); const [initialTimerTime, setInitialTimerTime] = useState(60); const [isActive, setIsActive] = useState(false); const [showSettings, setShowSettings] = useState(false); const [isFullscreen, setIsFullscreen] = useState(false);
  const mySubjects = getUserSubjects(data.selectedExams); const [selectedSub, setSelectedSub] = useState(mySubjects[0] || "Physics");
  const containerRef = useRef(null); const canvasRef = useRef(null); const videoRef = useRef(null); const fileInputRef = useRef(null);
  const handleFileUpload = (e) => { const file = e.target.files[0]; if(file) { const reader = new FileReader(); reader.onloadend = () => setData({...data, bgImage: reader.result}); reader.readAsDataURL(file); }};
  const toggleFullscreen = () => { if (!document.fullscreenElement) containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => alert("Fullscreen blocked")); else document.exitFullscreen().then(() => setIsFullscreen(false)); };
  useEffect(() => { const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement); document.addEventListener("fullscreenchange", handleFsChange); return () => document.removeEventListener("fullscreenchange", handleFsChange); }, []);
  useEffect(() => { const video = videoRef.current; if (!video) return; const handlePause = () => setIsActive(false); const handlePlay = () => setIsActive(true); video.addEventListener('pause', handlePause); video.addEventListener('play', handlePlay); return () => { video.removeEventListener('pause', handlePause); video.removeEventListener('play', handlePlay); }; }, []);
  useEffect(() => { let interval = null; if (isActive) { interval = setInterval(() => { setTimeLeft(prev => { let newVal = mode === 'timer' ? prev - 1 : prev + 1; if (mode === 'timer' && newVal <= 0) { setIsActive(false); alert("Timer Finished!"); return 0; } if (document.pictureInPictureElement && canvasRef.current) updatePiPCanvas(newVal); document.title = `(${formatTime(newVal)}) PrepPilot`; return newVal; }); }, 1000); } else { document.title = "PrepPilot Pro"; } return () => clearInterval(interval); }, [isActive, mode]);
  const formatTime = (s) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`; };
  const updatePiPCanvas = (time) => { const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#8b5cf6'; ctx.font = 'bold 80px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(formatTime(time), canvas.width / 2, canvas.height / 2); };
  const togglePiP = async () => { try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else { const canvas = canvasRef.current; const video = videoRef.current; if (canvas && video) { updatePiPCanvas(timeLeft); const stream = canvas.captureStream(); video.srcObject = stream; await video.play(); await video.requestPictureInPicture(); } } } catch (err) { console.error(err); alert("Floating mode failed. Try Chrome Desktop."); } };
  const handleStart = () => { if (mode === 'timer' && timeLeft === 0) setTimeLeft(initialTimerTime * 60); setIsActive(true); };
  const handleStop = () => { setIsActive(false); let timeSpentSeconds = mode === 'stopwatch' ? timeLeft : (initialTimerTime * 60) - timeLeft; if (timeSpentSeconds > 60) { if(window.confirm(`Save ${Math.floor(timeSpentSeconds/60)} minutes of study?`)) { onSaveSession(selectedSub, timeSpentSeconds); setTimeLeft(0); } } else { setTimeLeft(0); } };
  const today = new Date().toISOString().split('T')[0]; const todayMins = data.history?.[today] || 0; const percent = Math.min((todayMins / (data.dailyGoal * 60)) * 100, 100);

  return (
    <div ref={containerRef} className={`h-full flex flex-col relative overflow-hidden rounded-3xl transition-all duration-500 bg-cover bg-center ${isDark ? 'bg-black' : 'bg-gray-100'}`} style={{ backgroundImage: data.bgImage ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${data.bgImage})` : 'none' }}>
      <canvas ref={canvasRef} width={400} height={200} className="hidden" /><video ref={videoRef} className="hidden" muted />
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20"><div className={`backdrop-blur border rounded-full py-2 px-4 flex items-center gap-3 w-64 shadow-lg ${isDark ? 'bg-[#18181b]/90 border-white/10' : 'bg-white/90 border-black/10'}`}><div className="flex flex-col flex-1"><div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-1"><span>Daily Goal</span><span>{Math.floor(todayMins/60)}h / {data.dailyGoal}h</span></div><div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden"><div className={`h-full ${theme.bg} transition-all`} style={{width: `${percent}%`}}></div></div></div></div><div className="flex gap-2"><button onClick={togglePiP} className={`p-2 backdrop-blur border rounded-full transition ${isDark ? 'bg-[#18181b]/90 border-white/10 text-white' : 'bg-white/90 border-black/10 text-black'}`}><ExternalLink size={18}/></button><button onClick={toggleFullscreen} className={`p-2 backdrop-blur border rounded-full transition ${isDark ? 'bg-[#18181b]/90 border-white/10 text-white' : 'bg-white/90 border-black/10 text-black'}`}>{isFullscreen ? <Minimize size={18}/> : <Maximize size={18}/>}</button><button onClick={() => setShowSettings(!showSettings)} className={`p-2 backdrop-blur border rounded-full transition ${isDark ? 'bg-[#18181b]/90 border-white/10 text-white' : 'bg-white/90 border-black/10 text-black'}`}><Settings size={18}/></button></div></div>
      <AnimatePresence>{showSettings && (<motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className={`absolute top-20 right-4 z-30 border p-4 rounded-xl shadow-2xl w-72 ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-black/10'}`}><h4 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}><ImageIcon size={16}/> Custom Background</h4><div className="mb-3"><span className="text-[10px] text-gray-500 uppercase font-bold">Image URL</span><input type="text" placeholder="Paste URL..." className={`w-full border rounded p-2 text-xs outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-black'}`} value={data.bgImage?.startsWith('data') ? '' : data.bgImage} onChange={(e) => setData({...data, bgImage: e.target.value})} /></div><div className="mb-4"><span className="text-[10px] text-gray-500 uppercase font-bold">Or Upload</span><input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} /><button onClick={() => fileInputRef.current.click()} className={`mt-1 w-full flex items-center justify-center gap-2 py-2 border rounded-lg text-xs font-bold transition ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'}`}><Upload size={14} /> Choose File</button></div><div className="flex justify-end"><button onClick={() => setData({...data, bgImage: ''})} className="text-xs text-red-400 hover:text-red-300">Remove Image</button></div></motion.div>)}</AnimatePresence>
      <div className="flex-1 flex flex-col items-center justify-center gap-8 z-10">{!isActive && (<div className={`flex backdrop-blur p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-black/5'}`}><button onClick={() => { setMode('stopwatch'); setTimeLeft(0); }} className={`px-4 py-2 rounded-md text-sm font-bold transition ${mode === 'stopwatch' ? `${theme.bg} text-white` : 'text-gray-500'}`}>Stopwatch</button><button onClick={() => { setMode('timer'); setTimeLeft(initialTimerTime*60); }} className={`px-4 py-2 rounded-md text-sm font-bold transition ${mode === 'timer' ? `${theme.bg} text-white` : 'text-gray-500'}`}>Timer</button></div>)}<div className="text-center"><div className={`text-[6rem] md:text-[10rem] font-bold font-mono tracking-tighter leading-none tabular-nums drop-shadow-2xl ${isDark ? 'text-white' : 'text-black'}`}>{formatTime(timeLeft)}</div>{mode === 'timer' && !isActive && (<div className="mt-4 flex items-center justify-center gap-2"><span className="text-gray-400">Set Minutes:</span><input type="number" value={initialTimerTime} onChange={(e) => { const val = parseInt(e.target.value) || 0; setInitialTimerTime(val); setTimeLeft(val * 60); }} className={`border rounded px-2 py-1 w-20 text-center font-bold backdrop-blur ${isDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white/50 border-black/10 text-black'}`} /></div>)}</div><div className={`backdrop-blur border p-2 rounded-2xl flex items-center gap-4 shadow-2xl transition-all duration-500 ${isDark ? 'bg-[#18181b]/90 border-white/10' : 'bg-white/90 border-black/10'}`}>{isActive ? (<div className={`px-6 py-3 font-bold flex items-center gap-2 rounded-xl ${theme.light} ${theme.text}`}><div className={`w-2 h-2 rounded-full ${theme.bg} animate-pulse`}></div>Studying: {selectedSub}</div>) : (<select className={`appearance-none py-3 pl-4 pr-8 rounded-xl font-bold outline-none cursor-pointer ${isDark ? 'bg-[#27272a] text-white' : 'bg-gray-100 text-black'}`} value={selectedSub} onChange={(e) => setSelectedSub(e.target.value)}>{mySubjects.map(s => <option key={s} value={s}>{s}</option>)}</select>)}{!isActive ? (<button onClick={handleStart} className={`px-8 py-3 ${theme.bg} ${theme.hover} text-white font-bold rounded-xl flex items-center gap-2 active:scale-95`}><Play size={20} fill="currentColor" /> {timeLeft > 0 && mode === 'timer' && timeLeft < initialTimerTime*60 ? "Resume" : "Start"}</button>) : (<button onClick={() => setIsActive(false)} className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl flex items-center gap-2 active:scale-95"><Pause size={20} fill="currentColor" /> Pause</button>)}{(timeLeft > 0 || isActive) && <button onClick={handleStop} className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20"><StopCircle size={20} /></button>}</div></div></div>
  );
};

const MockTestTracker = ({ data, setData, theme, isDark }) => {
  const [isAdding, setIsAdding] = useState(false); const [filterType, setFilterType] = useState('All'); const [testType, setTestType] = useState(data.selectedExams?.[0] || 'Mains'); const [newTest, setNewTest] = useState({ name: '', date: '', p: '', c: '', m: '', maxMarks: 0, reminder: false });
  useEffect(() => { const config = EXAM_CONFIG[testType]; if(config && isAdding) { setNewTest(prev => ({ ...prev, maxMarks: config.marks || 300 })); } }, [testType, isAdding]);
  const requestNotificationPermission = async () => { if (!("Notification" in window)) { alert("This browser does not support desktop notification"); return; } if (Notification.permission !== "granted") await Notification.requestPermission(); };
  const addTest = () => { if (!newTest.name || !newTest.date) return; const p = parseFloat(newTest.p) || 0; const c = parseFloat(newTest.c) || 0; const m = parseFloat(newTest.m) || 0; const total = p + c + m; const max = parseInt(newTest.maxMarks) || 300; const testEntry = { id: Date.now(), type: testType, name: newTest.name, date: newTest.date, p, c, m, total, maxMarks: max, reminder: newTest.reminder }; if(newTest.reminder) requestNotificationPermission(); setData(prev => ({ ...prev, mockTests: [...(prev.mockTests || []), testEntry] })); setIsAdding(false); setNewTest({ name: '', date: '', p: '', c: '', m: '', maxMarks: 0, reminder: false }); };
  const deleteTest = (id) => { if(window.confirm("Delete record?")) setData(prev => ({ ...prev, mockTests: prev.mockTests.filter(t => t.id !== id) })); };
  const filteredTests = (data.mockTests || []).filter(t => { if (filterType === 'All') return true; return t.type === filterType; }); const sortedTests = [...filteredTests].sort((a,b) => new Date(a.date) - new Date(b.date)); const graphTests = (data.mockTests || []).filter(t => t.type === filterType).sort((a,b) => new Date(a.date) - new Date(b.date));
  const textCol = isDark ? 'text-white' : 'text-gray-900';
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"><div><h1 className={`text-3xl font-bold ${textCol} mb-2`}>Mock Test Analysis</h1><p className="text-gray-400">Track your {filterType} progress</p></div><div className="flex gap-2 overflow-x-auto max-w-full pb-2 no-scrollbar"><button onClick={() => setFilterType('All')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition whitespace-nowrap ${filterType==='All' ? `${isDark ? 'bg-white text-black' : 'bg-black text-white'}` : `border-transparent text-gray-400`}`}>All History</button>{(data.selectedExams || []).map(exam => (<button key={exam} onClick={() => setFilterType(exam)} className={`px-4 py-2 rounded-lg text-sm font-bold border transition whitespace-nowrap ${filterType===exam ? `${theme.bg} text-white` : `border-transparent text-gray-400`}`}>{exam}</button>))}</div><button onClick={() => setIsAdding(!isAdding)} className={`px-6 py-3 ${theme.bg} text-white rounded-xl font-bold flex items-center gap-2`}>{isAdding ? <X size={18}/> : <Plus size={18}/>} {isAdding ? 'Cancel' : 'Log Test'}</button></div>
      {isAdding && (<GlassCard className={`border-t-4 ${theme.border}`} isDark={isDark}><div className="mb-6"><label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Exam Type</label><select className={`w-full border rounded-lg p-3 outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300 text-black'}`} value={testType} onChange={(e) => setTestType(e.target.value)}>{(data.selectedExams?.length > 0 ? data.selectedExams : ['JEE Mains (Jan) 2027']).map(e => <option key={e} value={e}>{e}</option>)}<option value="Custom">Custom</option></select></div><div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end"><div className="col-span-2 space-y-2"><label className="text-xs text-gray-400 font-bold uppercase">Name</label><input type="text" className={`w-full border rounded-lg p-3 outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={newTest.name} onChange={e => setNewTest({...newTest, name: e.target.value})} /></div><div className="space-y-2"><label className="text-xs text-gray-400 font-bold uppercase">Date</label><input type="date" className={`w-full border rounded-lg p-3 outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={newTest.date} onChange={e => setNewTest({...newTest, date: e.target.value})} /></div><div className="space-y-2"><label className="text-xs text-violet-400 font-bold uppercase">P</label><input type="number" className={`w-full border rounded-lg p-3 outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={newTest.p} onChange={e => setNewTest({...newTest, p: e.target.value})} /></div><div className="space-y-2"><label className="text-xs text-green-400 font-bold uppercase">C</label><input type="number" className={`w-full border rounded-lg p-3 outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={newTest.c} onChange={e => setNewTest({...newTest, c: e.target.value})} /></div><div className="space-y-2"><label className="text-xs text-blue-400 font-bold uppercase">M/B</label><input type="number" className={`w-full border rounded-lg p-3 outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={newTest.m} onChange={e => setNewTest({...newTest, m: e.target.value})} /></div></div><div className="mt-4"><label className="text-xs text-orange-400 font-bold uppercase">Total Max Marks</label><input type="number" className={`border rounded-lg p-3 outline-none w-40 ml-4 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-300'}`} value={newTest.maxMarks} onChange={e => setNewTest({...newTest, maxMarks: e.target.value})} /></div><div className="mt-4 flex items-center gap-2"><input type="checkbox" id="remindMe" className={`w-5 h-5 ${theme.ring}`} checked={newTest.reminder} onChange={e => setNewTest({...newTest, reminder: e.target.checked})} /><label htmlFor="remindMe" className="text-gray-500 text-sm font-bold flex items-center gap-2"><Bell size={16} /> Remind me</label></div><button onClick={addTest} className={`mt-6 w-full py-3 font-bold rounded-lg ${theme.bg} text-white`}>Save Score</button></GlassCard>)}
      {filterType !== 'All' && graphTests.length > 0 && (<GlassCard className="h-[400px]" isDark={isDark}><h3 className={`text-lg font-bold ${textCol} mb-4`}>{filterType} Trend</h3><ResponsiveContainer width="100%" height="90%"><LineChart data={graphTests}><CartesianGrid strokeDasharray="3 3" stroke={isDark?"rgba(255,255,255,0.05)":"#eee"} /><XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[0, 'auto']} /><RechartsTooltip contentStyle={{backgroundColor: isDark?'#18181b':'#fff', borderColor: isDark?'#27272a':'#ddd', color: isDark?'#fff':'#000'}} /><Legend /><Line type="monotone" dataKey="total" stroke={theme.stroke} strokeWidth={3} dot={{r:4}} name="Total Score" /></LineChart></ResponsiveContainer></GlassCard>)}
      <div className="grid gap-3">{sortedTests.length > 0 ? sortedTests.slice().reverse().map(test => (<div key={test.id} className={`group border p-4 rounded-xl flex items-center justify-between transition ${isDark ? 'bg-[#121212] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300'}`}><div className="flex gap-4 items-center"><div className={`w-1 h-12 rounded-full ${test.type.includes('NEET') || test.type.includes('PCB') ? 'bg-red-500' : theme.bg}`}></div><div><div className="flex items-center gap-3"><h3 className={`font-bold ${textCol}`}>{test.name}</h3><span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{test.type}</span>{test.reminder && <Bell size={12} className={theme.text} />}</div><div className="text-xs text-gray-500 mt-1">{test.date}</div><div className="flex gap-4 mt-2 text-sm"><span className="text-violet-400">P: {test.p}</span><span className="text-green-400">C: {test.c}</span><span className="text-blue-400">M/B: {test.m}</span></div></div></div><div className="flex items-center gap-6"><div className="text-right"><div className={`text-2xl font-bold ${textCol}`}>{test.total} <span className="text-sm text-gray-500 font-normal">/ {test.maxMarks}</span></div><div className="text-xs text-gray-500 uppercase">{test.maxMarks > 0 ? Math.round((test.total / test.maxMarks) * 100) : 0}%</div></div><button onClick={() => deleteTest(test.id)} className="p-2 text-gray-600 hover:text-red-500 transition"><Trash2 size={20} /></button></div></div>)) : <div className="text-center py-10 text-gray-500">No tests found.</div>}</div>
    </div>
  );
};

// --- SETTINGS VIEW ---
const SettingsView = ({ data, setData, user, onBack, theme, isDark }) => {
    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 mb-6 text-gray-500 hover:text-white"><ArrowRight className="rotate-180" size={20} /> Back</button>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-8`}>Settings</h1>
            <GlassCard isDark={isDark} className="mb-6">
                <h3 className="font-bold mb-4">Appearance</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Theme Color</span>
                        <div className="flex gap-2">
                            {THEME_COLORS.map(c => (
                                <button key={c.name} onClick={() => setData({...data, settings: {...data.settings, theme: c.name}})} className={`w-6 h-6 rounded-full ${c.bg} ${data.settings.theme === c.name ? 'ring-2 ring-white' : ''}`} />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Dark Mode</span>
                        <button onClick={() => setData({...data, settings: {...data.settings, mode: isDark ? 'Light' : 'Dark'}})} className={`w-12 h-6 rounded-full relative transition ${isDark ? 'bg-green-500' : 'bg-gray-500'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isDark ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            </GlassCard>
            <GlassCard isDark={isDark}>
                <h3 className="font-bold mb-4">Account</h3>
                <p className="text-sm text-gray-500 mb-4">Logged in as {user.email}</p>
                <div className="space-y-2">
                    <button onClick={async () => {await sendPasswordResetEmail(auth, user.email); alert("Link sent!")}} className="w-full py-3 border border-white/10 rounded-xl hover:bg-white/5 text-left px-4">Reset Password</button>
                </div>
            </GlassCard>
        </div>
    );
};

// --- LOGIN SCREEN ---
const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true); const [isReset, setIsReset] = useState(false); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [isLoading, setIsLoading] = useState(false);
  const handleGoogleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (error) { setError(error.message); } };
  const handleAuth = async (e) => { e.preventDefault(); setError(""); setIsLoading(true); try { if (isReset) { await sendPasswordResetEmail(auth, email); alert(`Link sent to ${email}`); setIsReset(false); } else if (isLogin) { await signInWithEmailAndPassword(auth, email, password); } else { const userCredential = await createUserWithEmailAndPassword(auth, email, password); await sendEmailVerification(userCredential.user); alert("Verification email sent!"); } } catch (err) { setError(err.message); } setIsLoading(false); };
  return (
    <div className="h-screen w-full bg-[#09090b] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8"><div className="inline-flex p-4 bg-violet-600/20 rounded-full mb-4 animate-pulse"><Zap size={40} className="text-violet-500" /></div><h1 className="text-3xl font-bold text-white">PrepPilot <span className="text-violet-500">Pro</span></h1><p className="text-gray-400 text-sm mt-2">{isReset ? "Reset Password" : (isLogin ? "Welcome back!" : "Prepare for takeoff.")}</p></div>
        <form onSubmit={handleAuth} className="space-y-4"><div className="space-y-2"><div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"><Mail size={20} className="text-gray-400" /><input type="email" placeholder="Email" required className="bg-transparent outline-none text-white w-full placeholder-gray-500" value={email} onChange={e => setEmail(e.target.value)} /></div>{!isReset && (<div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"><Lock size={20} className="text-gray-400" /><input type="password" placeholder="Password" required className="bg-transparent outline-none text-white w-full placeholder-gray-500" value={password} onChange={e => setPassword(e.target.value)} /></div>)}</div>{error && <p className="text-red-400 text-xs text-center">{error}</p>}{!isReset && isLogin && (<div className="flex justify-end"><button type="button" onClick={() => setIsReset(true)} className="text-xs text-violet-400 font-bold">Forgot Password?</button></div>)}<button type="submit" disabled={isLoading} className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl">{isLoading ? "Processing..." : (isReset ? "Send Link" : (isLogin ? "Login" : "Sign Up"))}</button></form>
        {!isReset && (<><div className="flex items-center gap-4 my-6"><div className="h-px bg-white/10 flex-1"></div><span className="text-xs text-gray-500 font-bold uppercase">Or</span><div className="h-px bg-white/10 flex-1"></div></div><button onClick={handleGoogleLogin} className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3"><img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" /> Google</button><p className="text-center text-gray-400 text-sm mt-8">{isLogin ? "No account?" : "Have account?"} <button onClick={() => setIsLogin(!isLogin)} className="text-violet-400 font-bold ml-2">{isLogin ? "Sign Up" : "Login"}</button></p></>)}
      </div>
    </div>
  );
};

const ExamSelectionScreen = ({ onSave }) => {
  const [selected, setSelected] = useState([]); const toggleExam = (exam) => { if (selected.includes(exam)) setSelected(selected.filter(e => e !== exam)); else setSelected([...selected, exam]); };
  return (
    <div className="h-screen w-full bg-[#09090b] flex flex-col items-center justify-center p-6"><div className="max-w-5xl w-full text-center"><h1 className="text-3xl font-bold text-white mb-2">Select Exams</h1><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">{Object.keys(EXAM_CONFIG).map((exam) => { const isSelected = selected.includes(exam); return ( <button key={exam} onClick={() => toggleExam(exam)} className={`p-5 rounded-2xl text-left flex justify-between items-center border ${isSelected ? 'bg-violet-600/20 border-violet-500' : 'bg-white/5 border-white/10'}`}><div><h3 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{exam}</h3></div>{isSelected && <CheckCircle size={20} className="text-violet-500" />}</button> ); })}</div><button onClick={() => onSave(selected)} disabled={selected.length === 0} className="px-10 py-4 bg-white text-black font-bold rounded-xl disabled:opacity-50">Continue</button></div></div>
  );
};

// --- APP SHELL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(INITIAL_DATA);
  const [view, setView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showExamSelect, setShowExamSelect] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open

  // --- DERIVE THEME (WITH FALLBACK) ---
  const theme = getThemeStyles(data?.settings?.theme || 'Violet');
  const isDark = (data?.settings?.mode || 'Dark') === 'Dark';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) { setData(docSnap.data()); if(!docSnap.data().selectedExams?.length) setShowExamSelect(true); }
        else { await setDoc(docRef, INITIAL_DATA); setShowExamSelect(true); }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { if (user && !loading) { const t = setTimeout(async () => { await setDoc(doc(db, "users", user.uid), data); }, 1000); return () => clearTimeout(t); } }, [data, user, loading]);
  const handleLogout = async () => { await signOut(auth); setData(INITIAL_DATA); };
  const saveSession = (subject, seconds) => { const mins = parseFloat((seconds/60).toFixed(2)); const today = new Date().toISOString().split('T')[0]; const newHistory = { ...data.history, [today]: (data.history?.[today] || 0) + mins }; const newSubjects = { ...data.subjects, [subject]: { ...data.subjects[subject], timeSpent: data.subjects[subject].timeSpent + seconds } }; setData(prev => ({ ...prev, subjects: newSubjects, history: newHistory, xp: (prev.xp || 0) + Math.floor(mins) })); };
  const handleExamSelect = (exams) => { setData(prev => ({ ...prev, selectedExams: exams })); setShowExamSelect(false); };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <LoginScreen />;
  if (!user.emailVerified) return <div className="h-screen bg-black flex flex-col items-center justify-center text-white"><h1 className="text-2xl font-bold mb-4">Verify Email</h1><p className="mb-6">Link sent to {user.email}</p><button onClick={()=>window.location.reload()} className="px-6 py-2 bg-violet-600 rounded-lg">Refresh</button></div>;
  if (showExamSelect) return <ExamSelectionScreen onSave={handleExamSelect} />;

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }, 
    { id: 'prepai', icon: Bot, label: 'PrepAI' }, 
    { id: 'timer', icon: TimerIcon, label: 'Timer' }, 
    { id: 'analysis', icon: PieChartIcon, label: 'Analysis' }, 
    { id: 'syllabus', icon: BookOpen, label: 'Syllabus' }, 
    { id: 'mocks', icon: FileText, label: 'Mock Tests' }, 
    { id: 'kpp', icon: Target, label: 'Physics KPP' }
  ];

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 flex ${isDark ? 'bg-[#09090b] text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
      {/* EXPANDABLE SIDEBAR */}
      <aside className={`fixed left-0 top-0 h-full border-r flex flex-col transition-all duration-300 z-40 hidden md:flex ${isSidebarOpen ? 'w-64' : 'w-20'} ${isDark ? 'bg-[#09090b] border-white/10' : 'bg-white border-black/10'}`}>
        <div className="flex items-center justify-between p-6">
            <div className={`flex items-center gap-3 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
               <Zap size={24} className={theme.text} />
               <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>PrepPilot</span>
            </div>
            {!isSidebarOpen && <Zap size={24} className={`${theme.text} mx-auto mb-4`} />}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1 rounded hover:bg-white/10 transition ${!isSidebarOpen && 'mx-auto'}`}><div className={isDark ? 'text-white' : 'text-black'}>{isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</div></button>
        </div>
        <nav className="flex flex-col gap-2 w-full px-4 mt-4">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`relative flex items-center gap-4 py-3 px-3 rounded-xl transition-all duration-200 group ${view === item.id ? `${theme.bg} text-white shadow-lg` : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}>
              <item.icon size={22} />
              {isSidebarOpen && <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>}
              {!isSidebarOpen && <span className={`absolute left-14 z-50 px-2 py-1 text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className={`flex-1 p-6 md:p-10 pb-24 h-screen overflow-y-auto custom-scrollbar transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} ${view === 'prepai' ? 'p-0 md:p-0 overflow-hidden' : ''}`}>
        {/* Only show top header if NOT in PrepAI mode */}
        {view !== 'prepai' && (
          <div className={`flex justify-between items-center mb-8 sticky top-0 backdrop-blur-md z-30 py-2 -mt-4 border-b ${isDark ? 'bg-[#09090b]/90 border-white/5' : 'bg-gray-100/90 border-black/5'}`}>
             <h2 className={`text-xl font-bold capitalize flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{view === 'kpp' ? 'Physics KPP' : view}</h2>
             <ProfileDropdown user={user} onLogout={handleLogout} onChangeExam={() => setShowExamSelect(true)} data={data} setView={setView} theme={theme} isDark={isDark} />
          </div>
        )}

        {/* --- ALL FEATURES RENDERED HERE --- */}
        {view === 'dashboard' && <Dashboard data={data} setData={setData} goToTimer={() => setView('timer')} setView={setView} user={user} theme={theme} isDark={isDark} />}
        {view === 'prepai' && <PrepAIView data={data} theme={theme} isDark={isDark} />}
        {view === 'analysis' && <Analysis data={data} theme={theme} isDark={isDark} />} 
        {view === 'timer' && <FocusTimer data={data} setData={setData} onSaveSession={saveSession} theme={theme} isDark={isDark} />} 
        {view === 'syllabus' && <Syllabus data={data} setData={setData} theme={theme} isDark={isDark} />}
        {view === 'mocks' && <MockTestTracker data={data} setData={setData} theme={theme} isDark={isDark} />}
        {view === 'kpp' && <PhysicsKPP data={data} setData={setData} theme={theme} isDark={isDark} />} 
        {view === 'settings' && <SettingsView data={data} setData={setData} user={user} onBack={() => setView('dashboard')} theme={theme} isDark={isDark} />}
      </main>

      <div className={`md:hidden fixed bottom-0 left-0 w-full backdrop-blur-md border-t p-4 flex justify-around z-50 ${isDark ? 'bg-[#09090b]/95 border-white/10' : 'bg-white/95 border-black/10'}`}>
        <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? theme.text : 'text-gray-500'}><LayoutDashboard /></button>
        <button onClick={() => setView('timer')} className={view === 'timer' ? theme.text : 'text-gray-500'}><TimerIcon /></button>
        <button onClick={() => setView('syllabus')} className={view === 'syllabus' ? theme.text : 'text-gray-500'}><BookOpen /></button>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500"><Menu /></button>
      </div>
    </div>
  );
}