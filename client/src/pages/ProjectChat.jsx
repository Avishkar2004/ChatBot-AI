import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getProject, sendChat } from '../services/projects.js';

const ProjectChat = () => {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await getProject(token, projectId);
        setProject(p);
      } catch (e) { setError(e.message); }
    };
    if (token) load();
  }, [token, projectId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    try {
      setIsSending(true);
      const { reply } = await sendChat(token, projectId, userMsg.content);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen max-w-4xl mx-auto pt-10 pb-16">
      <div className="glass rounded-xl p-6 mb-4">
        <h2 className="text-xl font-semibold text-white">Chat — {project?.name || 'Project'}</h2>
        {error && <div className="bg-rose-500/10 text-rose-300 p-3 rounded my-3 border border-rose-500/20">{error}</div>}
      </div>

      <div className="glass rounded-xl p-6 h-[60vh] flex flex-col">
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {messages.map((m, idx) => (
            <div key={idx} className={`max-w-[80%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
              <div className={`${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-white/5 text-gray-100'} rounded-lg px-3 py-2`}>{m.content}</div>
            </div>
          ))}
          {isSending && (
            <div className="max-w-[80%]">
              <div className="bg-white/5 text-gray-100 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-gray-300 animate-bounce" />
                <span className="inline-block h-2 w-2 rounded-full bg-gray-300 animate-bounce [animation-delay:150ms]" />
                <span className="inline-block h-2 w-2 rounded-full bg-gray-300 animate-bounce [animation-delay:300ms]" />
                <span className="ml-2 text-sm text-gray-300">Assistant is typing…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="mt-4 flex gap-3">
          <input className="input flex-1" placeholder="Type your message..." value={input} onChange={(e) => setInput(e.target.value)} aria-label="Message" disabled={isSending} />
          <button className="btn-primary" disabled={isSending}>{isSending ? 'Sending…' : 'Send'}</button>
        </form>
      </div>
    </div>
  );
};

export default ProjectChat;


