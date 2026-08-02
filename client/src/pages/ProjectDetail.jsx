import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Copy,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getProject,
  listPrompts,
  createPrompt,
  getPrompt,
  updatePrompt,
  deletePrompt,
} from '../services/projects.js';
import Page from '../components/layout/Page.jsx';
import {
  Button,
  Card,
  Container,
  EmptyState,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  useToast,
} from '../components/ui';

const TITLE_MAX = 60;
const CONTENT_MAX = 600;

/** Shared by the create and edit flows so the rules can't drift apart. */
const validatePrompt = (title, content) => {
  if (!title) return 'Please enter a title for your prompt.';
  if (!content) return 'Please enter content for your prompt.';
  if (title.length > TITLE_MAX) return `Title must be ${TITLE_MAX} characters or less.`;
  if (content.length > CONTENT_MAX) return `Content must be ${CONTENT_MAX} characters or less.`;
  return '';
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { token } = useAuth();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Create / edit share one dialog; `editingPromptId` decides the mode.
  const [formOpen, setFormOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | az | za
  const [expandedPromptId, setExpandedPromptId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(
    async (forceRefresh = false) => {
      setError('');
      setIsLoading(true);
      try {
        const p = await getProject(projectId);
        setProject(p);
        const pr = await listPrompts(projectId, forceRefresh);
        setPrompts(Array.isArray(pr) ? pr : []);
      } catch (e) {
        setError(e.message || 'Failed to load project');
        setPrompts([]);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const openCreate = () => {
    setEditingPromptId(null);
    setTitle('');
    setContent('');
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = async (promptId) => {
    try {
      const prompt = await getPrompt(projectId, promptId);
      setEditingPromptId(promptId);
      setTitle(prompt.title || '');
      setContent(prompt.content || '');
      setFormError('');
      setFormOpen(true);
    } catch (e) {
      toast.error('Could not open prompt', e.message);
    }
  };

  const closeForm = () => {
    if (isSaving) return;
    setFormOpen(false);
    setEditingPromptId(null);
    setTitle('');
    setContent('');
    setFormError('');
  };

  const onSubmitPrompt = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    const message = validatePrompt(trimmedTitle, trimmedContent);
    if (message) {
      setFormError(message);
      return;
    }

    setFormError('');
    setIsSaving(true);
    try {
      if (editingPromptId) {
        await updatePrompt(projectId, editingPromptId, {
          title: trimmedTitle,
          content: trimmedContent,
        });
        toast.success('Prompt updated', trimmedTitle);
      } else {
        await createPrompt(projectId, { title: trimmedTitle, content: trimmedContent });
        toast.success('Prompt created', trimmedTitle);
      }
      setFormOpen(false);
      setEditingPromptId(null);
      setTitle('');
      setContent('');
      await load(true);
    } catch (e) {
      setFormError(e.message || 'Failed to save prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPrompt = async (promptId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPromptId(promptId);
      setTimeout(() => setCopiedPromptId(null), 1400);
    } catch (_) {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleDeletePrompt = async (promptId) => {
    setIsDeleting(true);
    try {
      await deletePrompt(projectId, promptId);
      setDeleteConfirmId(null);
      toast.success('Prompt deleted');
      await load(true);
    } catch (e) {
      toast.error('Could not delete prompt', e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const normalized = (s) => (s || '').toLowerCase();

  const visiblePrompts = prompts
    .filter((p) => {
      const q = normalized(filterQuery);
      if (!q) return true;
      return normalized(p.title).includes(q) || normalized(p.content).includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'az') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'za') return (b.title || '').localeCompare(a.title || '');
      return 0;
    });

  const isFiltered = filterQuery.trim().length > 0;

  return (
    <Page>
      <Container size="md" className="pb-20">
        {isLoading && !project ? (
          <div className="pb-7 pt-9">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-4 h-8 w-64" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          </div>
        ) : (
          <PageHeader
            backTo="/projects"
            backLabel="Projects"
            title={project?.name || 'Project'}
            description={project?.description || 'No description provided.'}
            actions={
              <Button
                as={Link}
                to={`/projects/${projectId}/chat`}
                leftIcon={<MessageSquare size={15} />}
              >
                Open chat
              </Button>
            }
          />
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-3"
          >
            <AlertCircle size={16} className="mt-px shrink-0 text-rose-400" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-rose-200">{error}</p>
          </div>
        )}

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <h2 className="font-display text-title font-semibold text-white">Prompts</h2>
              <p className="mt-1 text-[13px] text-slate-400">
                Reusable instructions this agent can draw on.
                {prompts.length > 0 && (
                  <span className="tnum text-slate-500">
                    {' '}
                    · {prompts.length} saved
                  </span>
                )}
              </p>
            </div>
            <Button leftIcon={<Plus size={15} />} onClick={openCreate}>
              New prompt
            </Button>
          </div>

          {prompts.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="sm:max-w-xs sm:flex-1">
                <Input
                  size="md"
                  type="search"
                  aria-label="Search prompts"
                  placeholder="Search prompts…"
                  leftIcon={<Search size={15} aria-hidden="true" />}
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>
              <Select
                size="md"
                aria-label="Sort prompts"
                className="w-auto sm:ml-auto"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">Title A–Z</option>
                <option value="za">Title Z–A</option>
              </Select>
            </div>
          )}

          <div className="mt-5">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                  <Card key={i} padding="md">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-3 h-3 w-full" />
                    <Skeleton className="mt-2 h-3 w-5/6" />
                    <Skeleton className="mt-2 h-3 w-2/3" />
                  </Card>
                ))}
              </div>
            ) : visiblePrompts.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title={isFiltered ? 'No matching prompts' : 'No prompts yet'}
                description={
                  isFiltered
                    ? `Nothing matches “${filterQuery.trim()}”.`
                    : 'Add a prompt to give this agent a consistent set of instructions to work from.'
                }
                action={
                  isFiltered ? (
                    <Button variant="secondary" onClick={() => setFilterQuery('')}>
                      Clear search
                    </Button>
                  ) : (
                    <Button leftIcon={<Plus size={15} />} onClick={openCreate}>
                      Add prompt
                    </Button>
                  )
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {visiblePrompts.map((pr) => {
                  const isExpanded = expandedPromptId === pr._id;
                  const isLong = (pr.content || '').length > 200;
                  const copied = copiedPromptId === pr._id;

                  return (
                    <Card key={pr._id} interactive className="flex flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 flex-1 truncate font-display text-title-sm font-semibold text-white">
                          {pr.title}
                        </h3>
                        <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
                          <IconButton
                            label={copied ? 'Copied' : 'Copy prompt'}
                            icon={copied ? Check : Copy}
                            size="sm"
                            className={copied ? 'text-emerald-400' : undefined}
                            onClick={() => handleCopyPrompt(pr._id, pr.content)}
                          />
                          <IconButton
                            label="Edit prompt"
                            icon={Pencil}
                            size="sm"
                            onClick={() => openEdit(pr._id)}
                          />
                          <IconButton
                            label="Delete prompt"
                            icon={Trash2}
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteConfirmId(pr._id)}
                          />
                        </div>
                      </div>

                      <p
                        className={`mt-2.5 whitespace-pre-line text-[13px] leading-relaxed text-slate-400 ${
                          isExpanded ? '' : 'line-clamp-4'
                        }`}
                      >
                        {pr.content}
                      </p>

                      {isLong && (
                        <button
                          type="button"
                          onClick={() => setExpandedPromptId(isExpanded ? null : pr._id)}
                          className="focus-ring mt-2.5 self-start rounded text-xs font-medium text-brand-300 transition-colors hover:text-brand-200"
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </Container>

      {/* Create / edit dialog */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        size="xl"
        title={editingPromptId ? 'Edit prompt' : 'New prompt'}
        description="Use clear, directive language. Variables like {userName} are passed through as written."
      >
        <form onSubmit={onSubmitPrompt} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-3"
            >
              <AlertCircle size={16} className="mt-px shrink-0 text-rose-400" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-rose-200">{formError}</p>
            </div>
          )}

          <Input
            label="Title"
            placeholder="e.g. Greeting"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
            hint="Short, descriptive name"
            autoFocus
            required
          />

          <Textarea
            label="Content"
            rows={7}
            placeholder="Write your prompt content here…"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
            counter={`${content.length}/${CONTENT_MAX}`}
            required
          />

          <div className="flex justify-end gap-2.5 pt-1">
            <Button type="button" variant="ghost" onClick={closeForm} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} disabled={!title.trim() || !content.trim()}>
              {editingPromptId ? 'Save changes' : 'Add prompt'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteConfirmId}
        onClose={() => !isDeleting && setDeleteConfirmId(null)}
        size="sm"
        title="Delete prompt?"
        description="This prompt will be permanently removed from the project."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={isDeleting}
              onClick={() => handleDeletePrompt(deleteConfirmId)}
            >
              Delete prompt
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-400">
          {prompts.find((p) => p._id === deleteConfirmId)?.title ? (
            <>
              You are about to delete{' '}
              <span className="font-medium text-slate-200">
                {prompts.find((p) => p._id === deleteConfirmId).title}
              </span>
              .
            </>
          ) : (
            'You are about to delete this prompt.'
          )}
        </p>
      </Modal>
    </Page>
  );
};

export default ProjectDetail;
