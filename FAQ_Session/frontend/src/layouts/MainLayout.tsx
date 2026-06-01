import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import LoginModal from '../components/LoginModal';
import { apiService } from '../utils/api';
import { MessageSquare, X, Send } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I am Yaksha, your AI onboarding assistant. Ask me anything about stipend timelines, PPO performance evaluation, leaves, or NOC submissions!' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userMsg = inputVal.trim();
    setInputVal('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await apiService.chatBot(userMsg, sessionId);
      if (res.sessionId && !sessionId) {
        setSessionId(res.sessionId);
      }
      setChatMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to my database servers. Please verify if the backend is running!' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:pl-72 min-h-screen">
        {/* Top Navbar */}
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Dynamic Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto pb-24">
          <Outlet />
        </main>
      </div>

      {/* Floating Yaksha AI Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="w-96 max-w-[calc(100vw-2rem)] border border-slate-200 bg-white shadow-2xl z-50 flex flex-col rounded-2xl mb-4 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
              <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h4 className="leading-none text-xs font-semibold text-slate-900 uppercase tracking-wider">Yaksha AI</h4>
                  <span className="text-[10px] text-slate-500 font-medium leading-none">VINS Assistant</span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Message Box */}
            <div className="flex-1 h-[320px] overflow-y-auto p-4 space-y-3 bg-slate-50/50 scrollbar-thin">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-semibold text-slate-400 mb-1">
                    {msg.role === 'user' ? 'You' : 'Yaksha'}
                  </span>
                  <div className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none font-normal' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none font-normal'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-semibold text-slate-400 mb-1">Yaksha</span>
                  <div className="px-4 py-2.5 border border-slate-200 text-sm font-medium bg-white text-slate-500 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 animate-pulse">
                    <span>🤖 Thinking...</span>
                    <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-ping"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Field */}
            <form onSubmit={handleSend} className="border-t border-slate-200 p-3 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Ask me about leaves, stipends, projects..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isLoading}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-normal outline-none bg-slate-50 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !inputVal.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Pulsating Trigger Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-400/20 animate-ping opacity-75 rounded-full pointer-events-none"></div>
          <MessageSquare className="w-6 h-6 text-white relative z-10" />
        </button>
      </div>

      {/* Global simulated components */}
      <LoginModal />
    </div>
  );
};
export default MainLayout;
