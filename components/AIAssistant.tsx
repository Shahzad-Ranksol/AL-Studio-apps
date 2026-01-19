
import React, { useState, useRef, useEffect } from 'react';
import { getConstructionAdvice, analyzeConstructionSite } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Assalam-o-Alaikum! I'm your PakConstruct AI assistant. How can I help you with your construction project in Pakistan today? I can estimate costs, explain building bylaws, or suggest materials." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
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

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-xs">AI</div>
          <div>
            <h3 className="font-bold text-sm">PakConstruct AI Assistant</h3>
            <p className="text-[10px] text-slate-400">Powered by Gemini</p>
          </div>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-slate-300 hover:text-white transition-colors"
          title="Upload site photo for AI analysis"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
        </button>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-none'
            }`}>
              {msg.content.split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none animate-pulse flex gap-1">
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        {isAnalyzingImage && (
          <div className="text-center text-xs text-slate-400 py-2">Analyzing site photo...</div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-slate-100 bg-white">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about materials, costs, or bylaws..."
            className="flex-1 px-4 py-2 bg-slate-100 border-none rounded-full text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-emerald-700 transition-all shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
