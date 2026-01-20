
import React, { useState, useRef, useEffect } from 'react';
import { getConstructionAdvice, analyzeConstructionSite } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Assalam-o-Alaikum! I'm your PakConstruct Compliance & Design Advisor. I can help you with LDA, CDA, and SBCA building codes, floor area ratios (FAR), setbacks, and structural planning. What's on your mind today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const QUICK_QUERIES = [
    { label: "LDA 5-Marla Setbacks", query: "What are the required front and rear setbacks for a 5 Marla residential plot under LDA bylaws in Lahore?" },
    { label: "CDA High-Rise Rules", query: "What are the latest CDA regulations for high-rise apartment buildings in Islamabad (E-11 or Markaz)?" },
    { label: "Commercialization Fee", query: "How is the commercialization fee calculated for a residential property on a major road in Faisalabad?" },
    { label: "SBCA Rooftop Access", query: "What are the SBCA rules for rooftop structures and open terraces in Karachi?" }
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (customMessage?: string) => {
    const userMsg = customMessage || input.trim();
    if (!userMsg || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    if (!customMessage) setInput('');
    setIsLoading(true);

    try {
      const response = await getConstructionAdvice(messages, userMsg);
      setMessages(prev => [...prev, { role: 'model', content: response || 'Sorry, I couldn\'t process that.' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: 'Network error. Please ensure your API key is configured correctly.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      setMessages(prev => [...prev, { role: 'user', content: "[Uploaded site photo for analysis]" }]);
      
      try {
        const analysis = await analyzeConstructionSite(base64String);
        setMessages(prev => [...prev, { role: 'model', content: analysis || 'I analyzed the photo but have no specific feedback.' }]);
      } catch (error) {
        setMessages(prev => [...prev, { role: 'model', content: 'Error analyzing image.' }]);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatMessage = (content: string) => {
    // Basic Markdown-like formatting for links and bold text
    return content.split('\n').map((line, i) => {
      // Check for links [title](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = linkRegex.exec(line)) !== null) {
        parts.push(line.substring(lastIndex, match.index));
        parts.push(
          <a key={match[2]} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline font-bold hover:text-emerald-600">
            {match[1]}
          </a>
        );
        lastIndex = match.index + match[0].length;
      }
      parts.push(line.substring(lastIndex));

      return <p key={i} className="mb-2">{parts}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
      {/* Assistant Header */}
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/20 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg rotate-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12L2.7 7.3"/><path d="M12 12l9.3 4.7"/></svg>
          </div>
          <div>
            <h3 className="font-black text-base tracking-tight uppercase">Regulatory Advisor</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Grounding Active (LDA/CDA/SBCA)</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
           <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white border border-white/5"
            title="Analyze site photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      </div>

      {/* Quick Queries Area */}
      <div className="p-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-3 px-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Suggested Compliance Checks</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUERIES.map((q, i) => (
            <button 
              key={i}
              onClick={() => handleSend(q.query)}
              disabled={isLoading}
              className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:border-emerald-400 hover:text-emerald-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none font-medium'
            }`}>
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        {isAnalyzingImage && (
          <div className="flex justify-center">
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 animate-pulse">
              Running Site Analysis Engine...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-3"
        >
          <div className="flex-1 relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about setbacks, FAR, zoning fees, or bylaws..."
              className="w-full pl-6 pr-12 py-4 bg-slate-100 border-none rounded-[1.5rem] text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
          </div>
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-14 h-14 bg-emerald-600 text-white rounded-[1.25rem] flex items-center justify-center disabled:opacity-50 hover:bg-emerald-700 transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="rotate-45 -translate-x-0.5"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
        <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4">
          Always cross-check advice with physical LDA/CDA documents before construction.
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
