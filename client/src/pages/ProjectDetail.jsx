import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getProject, listPrompts, createPrompt } from '../services/projects.js';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { token } = useAuth();
  const [project, setProject] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const p = await getProject(token, projectId);
      setProject(p);
      const pr = await listPrompts(token, projectId);
      setPrompts(pr);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { if (token) load(); }, [token, projectId]);

  const onCreatePrompt = async (e) => {
    e.preventDefault();
    try {
      await createPrompt(token, projectId, { title, content });
      setTitle('');
      setContent('');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen max-w-5xl mx-auto pt-10 pb-16 space-y-6">
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{project?.name || 'Project'}</h2>
            <p className="text-gray-400">{project?.description || 'No description'}</p>
          </div>
          <Link to={`/projects/${projectId}/chat`} className="btn-primary">Open Chat</Link>
        </div>
      </div>

      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-3 text-white">Prompts</h3>
        {error && <div className="bg-rose-500/10 text-rose-300 p-3 rounded mb-4 border border-rose-500/20">{error}</div>}
        <form onSubmit={onCreatePrompt} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          <input className="input md:col-span-3" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input className="input md:col-span-7" placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} required />
          <button className="btn-primary md:col-span-2">Add Prompt</button>
        </form>
        {prompts.length === 0 ? (
          <p className="text-gray-400">No prompts yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {prompts.map((pr) => (
              <div key={pr._id} className="bg-black/30 border border-white/10 rounded-lg p-4">
                <p className="text-white font-medium">{pr.title}</p>
                <p className="text-gray-300 text-sm mt-1">{pr.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;


