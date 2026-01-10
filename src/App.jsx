import React, { useState } from 'react';
import { 
  Search, Plus, ChevronDown, ChevronUp, CheckCircle2, 
  Circle, Layout, BookOpen, Calendar, Settings, Menu 
} from 'lucide-react';

const JEEPlannerApp = () => {
  // --- CONFIGURATION ---
  // The Amber/Orange color from your screenshot
  const brandColorHex = "#d97706"; // amber-600 darker for text
  const brandButtonColor = "#f59e0b"; // amber-500 for buttons
  const brandLightColor = "#fef3c7"; // amber-100 for backgrounds

  // Your 5 Subjects
  const subjects = ["Physics", "Chemistry", "Mathematics", "English", "Computer Sc."];

  // --- STATE ---
  const [activeView, setActiveView] = useState("syllabus"); // Options: 'dashboard', 'syllabus', 'calendar'
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Syllabus Specific State
  const [activeSubjectTab, setActiveSubjectTab] = useState("Physics");
  const [expandedSections, setExpandedSections] = useState({
    class11: true,
    class12: false
  });

  // --- HANDLERS ---
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // --- COMPONENTS ---

  // 1. Sidebar Component
  const Sidebar = () => (
    <div className={`bg-white h-screen border-r border-gray-200 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} fixed left-0 top-0 z-10`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: brandButtonColor }}>
          JP
        </div>
        {isSidebarOpen && <span className="font-bold text-xl text-gray-800 tracking-tight">JEE Planner</span>}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <NavItem icon={<Layout size={20} />} label="Dashboard" id="dashboard" />
        <NavItem icon={<BookOpen size={20} />} label="Syllabus Tracker" id="syllabus" />
        <NavItem icon={<Calendar size={20} />} label="Calendar" id="calendar" />
      </nav>

      <div className="p-4 border-t border-gray-100">
        <NavItem icon={<Settings size={20} />} label="Settings" id="settings" />
      </div>
    </div>
  );

  const NavItem = ({ icon, label, id }) => (
    <button
      onClick={() => setActiveView(id)}
      className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200
        ${activeView === id 
          ? 'text-gray-900 font-semibold shadow-sm' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
      style={{ backgroundColor: activeView === id ? brandLightColor : 'transparent', color: activeView === id ? brandColorHex : undefined }}
    >
      {icon}
      {isSidebarOpen && <span>{label}</span>}
    </button>
  );

  // 2. Syllabus View Component (The new design)
  const SyllabusView = () => (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Syllabus Progress</h2>
          <p className="text-gray-500 text-sm mt-1">Browse chapters and track your subtask completion.</p>
        </div>
        <button 
          style={{ backgroundColor: brandButtonColor }}
          className="mt-4 md:mt-0 flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:opacity-90 transition-transform active:scale-95"
        >
          <Plus size={18} strokeWidth={3} />
          Add New Chapter
        </button>
      </div>

      {/* Subject Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
        {subjects.map((subject) => (
          <button
            key={subject}
            onClick={() => setActiveSubjectTab(subject)}
            className={`px-6 py-3 rounded-t-xl text-sm font-bold transition-all duration-200 border-b-2
              ${activeSubjectTab === subject 
                ? 'bg-white text-gray-900' 
                : 'bg-transparent text-gray-500 hover:text-gray-700 border-transparent'
              }`}
            style={{ 
              borderColor: activeSubjectTab === subject ? brandButtonColor : 'transparent',
              color: activeSubjectTab === subject ? brandColorHex : undefined
            }}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder={`Search ${activeSubjectTab} chapters...`}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 shadow-sm transition-shadow"
          style={{ '--tw-ring-color': brandButtonColor }}
        />
      </div>

      {/* Class 11 & 12 Accordions */}
      <div className="space-y-6">
        {/* Class 11 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <button 
            onClick={() => toggleSection('class11')}
            className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-800 text-lg">{activeSubjectTab} - Class 11 Topics</span>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">2/15 Done</span>
            </div>
            {expandedSections.class11 ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
          </button>
          
          {expandedSections.class11 && (
            <div className="p-6 pt-0 border-t border-gray-100">
              <div className="mt-4 space-y-3">
                <TopicItem title="Kinematics" status="completed" />
                <TopicItem title="Laws of Motion" status="pending" />
                <TopicItem title="Work, Energy & Power" status="pending" />
              </div>
            </div>
          )}
        </div>

        {/* Class 12 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <button 
            onClick={() => toggleSection('class12')}
            className="w-full flex justify-between items-center p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-800 text-lg">{activeSubjectTab} - Class 12 Topics</span>
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-1 rounded-md">0/12 Done</span>
            </div>
            {expandedSections.class12 ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
          </button>

           {expandedSections.class12 && (
            <div className="p-6 pt-0 border-t border-gray-100">
               <div className="mt-6 flex flex-col items-center justify-center text-gray-400 py-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <BookOpen size={24} className="opacity-20" />
                  </div>
                  <p className="italic">No chapters started yet.</p>
               </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );

  const TopicItem = ({ title, status }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-gray-300 transition-colors cursor-pointer">
      <span className="text-gray-700 font-semibold group-hover:text-gray-900">{title}</span>
      {status === 'completed' ? (
        <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 px-3 py-1 rounded-full">
          <CheckCircle2 size={16} />
          <span>Done</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-400 text-sm font-medium px-3 py-1">
          <Circle size={16} />
          <span>Pending</span>
        </div>
      )}
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex">
      {/* Mobile Menu Button (Visible on small screens) */}
      <button 
        className="fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} md:w-64 flex-shrink-0 transition-all duration-300`}>
         <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-20 lg:ml-0 transition-all overflow-y-auto h-screen">
        <div className="max-w-5xl mx-auto">
          {activeView === 'syllabus' && <SyllabusView />}
          
          {/* Placeholders for other views */}
          {activeView === 'dashboard' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-300">Dashboard View</h2>
              <p className="text-gray-400">Your daily stats and calendar would go here.</p>
              <button onClick={() => setActiveView('syllabus')} className="mt-4 text-blue-600 underline">Go to Syllabus</button>
            </div>
          )}
          {activeView === 'calendar' && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-300">Calendar View</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default JEEPlannerApp;