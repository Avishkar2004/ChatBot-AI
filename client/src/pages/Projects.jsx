import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
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

const formatUpdated = (value) => {
  if (!value) return 'Never updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never updated';
  return `Updated ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })}`;
};

const Projects = () => {
  const { token } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const load = async (forceRefresh = false) => {
    setError('');
    setListLoading(true);
    try {
      const data = await listProjects(forceRefresh);

      // Handle different response formats
      let projects = [];
      if (Array.isArray(data)) {
        projects = data;
      } else if (data && Array.isArray(data.projects)) {
        projects = data.projects;
      } else if (data && data.data && Array.isArray(data.data)) {
        projects = data.data;
      } else if (data && typeof data === 'object') {
        // If it's a single project object, wrap it in an array
        projects = [data];
      }

      setItems(projects);
    } catch (e) {
      setError(e.message || 'Failed to load projects');
      setItems([]); // Clear items on error
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load(true); // Force refresh on mount to ensure we get latest data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dir = sortDir === 'asc' ? 1 : -1;

    return items
      .filter((p) => {
        if (!q) return true;
        return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '') * dir;
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return (aTime - bTime) * dir;
      });
  }, [items, query, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  // Clamp rather than letting the view land on an empty page after a filter.
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginated = filteredSorted.slice(start, start + pageSize);

  const openCreate = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setError('');
    setFormOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (loading) return;
    setFormOpen(false);
    setEditingProject(null);
    setName('');
    setDescription('');
    setError('');
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const newProject = await createProject({ name, description });
      setName('');
      setDescription('');
      setFormOpen(false);

      // Optimistically add the new project to the list immediately
      if (newProject && newProject._id) {
        setItems((prevItems) => {
          // Check if project already exists to avoid duplicates
          const exists = prevItems.some((p) => p._id === newProject._id);
          if (exists) {
            return prevItems;
          }
          return [newProject, ...prevItems];
        });
      }

      toast.success('Project created', newProject?.name || name);

      // Wait a bit for cache invalidation to complete, then force refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await load(true); // Force refresh with cache-busting
    } catch (e) {
      setError(e.message);
      // If creation failed, reload to ensure consistency
      await load(true);
    } finally {
      setLoading(false);
    }
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updatedProject = await updateProject(editingProject._id, {
        name,
        description,
      });
      setEditingProject(null);
      setName('');
      setDescription('');
      setFormOpen(false);

      // Optimistically update the project in the list
      if (updatedProject && updatedProject._id) {
        setItems((prevItems) =>
          prevItems.map((p) => (p._id === updatedProject._id ? updatedProject : p))
        );
      }

      toast.success('Project updated', updatedProject?.name || name);

      // Wait a bit for cache invalidation, then force refresh
      await new Promise((resolve) => setTimeout(resolve, 300));
      await load(true);
    } catch (e) {
      setError(e.message);
      await load(true);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (projectId) => {
    setLoading(true);
    setError('');
    try {
      await deleteProject(projectId);
      setShowDeleteConfirm(null);

      // Optimistically remove the project from the list
      setItems((prevItems) => prevItems.filter((p) => p._id !== projectId));
      toast.success('Project deleted');

      // Wait a bit for cache invalidation, then force refresh
      await new Promise((resolve) => setTimeout(resolve, 300));
      await load(true);
    } catch (e) {
      if (e?.response?.status === 404) {
        setShowDeleteConfirm(null);
        // Project already deleted, just remove from list
        setItems((prevItems) => prevItems.filter((p) => p._id !== projectId));
        await load(true);
      } else {
        setError(e.message || 'Failed to delete project');
        toast.error('Could not delete project', e.message);
        await load(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = !listLoading && filteredSorted.length === 0;
  const isFiltered = query.trim().length > 0;

  return (
    <Page>
      <Container className="pb-20">
        <PageHeader
          title="Projects"
          description="Each project holds its own agent, prompt library, and conversation history."
          actions={
            <>
              <IconButton
                label="Refresh"
                icon={RefreshCw}
                size="lg"
                variant="subtle"
                onClick={() => load(true)}
                disabled={listLoading}
                className={listLoading ? '[&>svg]:animate-spin-slow' : undefined}
              />
              <Button leftIcon={<Plus size={15} />} onClick={openCreate}>
                New project
              </Button>
            </>
          }
        />

        {error && !formOpen && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-3"
          >
            <AlertCircle size={16} className="mt-px shrink-0 text-rose-400" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-rose-200">{error}</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:max-w-xs sm:flex-1">
            <Input
              size="md"
              type="search"
              aria-label="Search projects"
              placeholder="Search projects…"
              leftIcon={<Search size={15} aria-hidden="true" />}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <Select
              size="md"
              aria-label="Sort by"
              className="w-auto"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updatedAt">Last updated</option>
              <option value="name">Name</option>
            </Select>
            <Select
              size="md"
              aria-label="Sort direction"
              className="w-auto"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </Select>
            <Select
              size="md"
              aria-label="Results per page"
              className="w-auto"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={6}>6 / page</option>
              <option value={9}>9 / page</option>
              <option value={12}>12 / page</option>
            </Select>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-5">
          {listLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: pageSize }).map((_, idx) => (
                <Card key={`skeleton-${idx}`} padding="md">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-3 h-3 w-4/5" />
                  <Skeleton className="mt-2 h-3 w-1/3" />
                  <div className="mt-6 flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                </Card>
              ))}
            </div>
          ) : isEmpty ? (
            <EmptyState
              icon={FolderKanban}
              title={isFiltered ? 'No matching projects' : 'No projects yet'}
              description={
                isFiltered
                  ? `Nothing matches “${query.trim()}”. Try a different search term.`
                  : 'Create your first project to start configuring an agent and its prompts.'
              }
              action={
                isFiltered ? (
                  <Button variant="secondary" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                ) : (
                  <Button leftIcon={<Plus size={15} />} onClick={openCreate}>
                    Create project
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((project) => (
                <Card key={project._id} interactive className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 flex-1 truncate font-display text-title-sm font-semibold text-white">
                      {project.name}
                    </h2>
                    {/* Actions stay visible rather than appearing on hover —
                        hover-only controls are unreachable on touch. */}
                    <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
                      <IconButton
                        label="Edit project"
                        icon={Pencil}
                        size="sm"
                        onClick={() => openEdit(project)}
                      />
                      <IconButton
                        label="Delete project"
                        icon={Trash2}
                        size="sm"
                        variant="danger"
                        onClick={() => setShowDeleteConfirm(project._id)}
                      />
                    </div>
                  </div>

                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-400">
                    {project.description || 'No description'}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">{formatUpdated(project.updatedAt)}</p>

                  <div className="mt-5 flex gap-2 border-t border-line pt-4">
                    <Button
                      as={Link}
                      to={`/projects/${project._id}`}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      leftIcon={<Settings2 size={14} />}
                    >
                      Manage
                    </Button>
                    <Button
                      as={Link}
                      to={`/projects/${project._id}/chat`}
                      size="sm"
                      className="flex-1"
                      leftIcon={<MessageSquare size={14} />}
                    >
                      Chat
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!listLoading && filteredSorted.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
            <p className="tnum text-[13px] text-slate-500">
              {start + 1}–{Math.min(start + pageSize, filteredSorted.length)} of{' '}
              {filteredSorted.length}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ChevronLeft size={14} />}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="tnum px-2 text-[13px] text-slate-400">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ChevronRight size={14} />}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Container>

      {/* Create / edit dialog */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingProject ? 'Edit project' : 'New project'}
        description={
          editingProject
            ? 'Update the name and description for this project.'
            : 'Give your project a name. You can add prompts once it exists.'
        }
      >
        <form id="project-form" onSubmit={editingProject ? onUpdate : onCreate} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3.5 py-3"
            >
              <AlertCircle size={16} className="mt-px shrink-0 text-rose-400" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-rose-200">{error}</p>
            </div>
          )}

          <Input
            label="Project name"
            placeholder="e.g. Customer Support Bot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />

          <Textarea
            label="Description"
            rows={3}
            placeholder="What is this agent for?"
            hint="Optional — helps you tell projects apart later."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-1">
            <Button type="button" variant="ghost" onClick={closeForm} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!name.trim()}>
              {editingProject ? 'Save changes' : 'Create project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!showDeleteConfirm}
        onClose={() => !loading && setShowDeleteConfirm(null)}
        size="sm"
        title="Delete project?"
        description="All prompts and chat history for this project will be permanently removed. This cannot be undone."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={loading} onClick={() => onDelete(showDeleteConfirm)}>
              Delete project
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-slate-400">
          {items.find((p) => p._id === showDeleteConfirm)?.name ? (
            <>
              You are about to delete{' '}
              <span className="font-medium text-slate-200">
                {items.find((p) => p._id === showDeleteConfirm).name}
              </span>
              .
            </>
          ) : (
            'You are about to delete this project.'
          )}
        </p>
      </Modal>
    </Page>
  );
};

export default Projects;
