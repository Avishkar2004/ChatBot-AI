import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Cpu,
  FolderKanban,
  MessageSquarePlus,
  Plus,
  Signal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchMe } from '../services/auth.js';
import { listProjects } from '../services/projects.js';
import Page from '../components/layout/Page.jsx';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Container,
  EmptyState,
  PageHeader,
  Skeleton,
  cn,
} from '../components/ui';

/** Mirrors the tolerant unwrapping used on the Projects page. */
const toProjectArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.projects)) return data.projects;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const Dashboard = () => {
  const { token, user } = useAuth();
  const [serverUser, setServerUser] = useState(null);
  const [error, setError] = useState('');
  // Two independent requests need two flags — sharing one made each finishing
  // request clear the other's skeleton early.
  const [profileLoading, setProfileLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      setProfileLoading(true);
      try {
        const data = await fetchMe();
        setServerUser(data.user);
      } catch (e) {
        setError(e.message);
      } finally {
        setProfileLoading(false);
      }
    };
    run();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const run = async () => {
      setProjectsLoading(true);
      try {
        const data = await listProjects();
        setItems(toProjectArray(data));
      } catch (e) {
        setError(e.message);
      } finally {
        setProjectsLoading(false);
      }
    };
    run();
  }, [token]);

  const recent = [...items]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 5);

  return (
    <Page>
      <Container className="pb-20">
        <PageHeader
          title={`Welcome back, ${user?.username || user?.email || 'there'}`}
          description="An overview of your workspace and everything you have running."
          actions={
            <Button as={Link} to="/projects" leftIcon={<Plus size={15} />}>
              New project
            </Button>
          }
        />

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3.5 py-3"
          >
            <AlertCircle size={16} className="mt-px shrink-0 text-amber-400" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-amber-200">{error}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={FolderKanban}
            label="Projects"
            value={projectsLoading ? null : items.length}
          />
          <Stat
            icon={MessageSquarePlus}
            label="Prompts"
            value={projectsLoading ? null : '—'}
            hint="Open a project to manage"
          />
          <Stat
            icon={Cpu}
            label="Active model"
            value={process.env.REACT_APP_MODEL_NAME || 'Groq'}
          />
          <Stat icon={Signal} label="Status" value="Online" tone="success" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4">
              <CardTitle as="h2">Recent projects</CardTitle>
              {items.length > 0 && (
                <Button as={Link} to="/projects" variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                  View all
                </Button>
              )}
            </div>
            <div className="rule" />

            {projectsLoading ? (
              <div className="divide-y divide-line">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                bordered={false}
                icon={FolderKanban}
                title="No projects yet"
                description="Create your first project to start configuring an agent."
                action={
                  <Button as={Link} to="/projects" leftIcon={<Plus size={15} />}>
                    Create project
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((project) => (
                  <li key={project._id}>
                    <Link
                      to={`/projects/${project._id}`}
                      className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.025]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{project.name}</p>
                        <p className="mt-0.5 truncate text-[13px] text-slate-500">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <time className="tnum hidden shrink-0 text-xs text-slate-500 sm:block">
                        {project.updatedAt
                          ? new Date(project.updatedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </time>
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="shrink-0 text-slate-600 transition-colors group-hover:text-slate-300"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="px-5 py-4">
              <CardTitle as="h2">Account</CardTitle>
            </div>
            <div className="rule" />
            <CardBody className="space-y-4">
              {profileLoading ? (
                [0, 1, 2].map((i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-3.5 w-40" />
                  </div>
                ))
              ) : serverUser ? (
                <>
                  <Field label="Username" value={serverUser.username || '—'} />
                  <Field label="Email" value={serverUser.email} />
                  <Field label="User ID" value={serverUser.id || serverUser._id} mono />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-slate-500">
                      Status
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-emerald-400">
                      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" />
                      Active
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-slate-500">No account data available.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </Container>
    </Page>
  );
};

function Stat({ icon: Icon, label, value, hint, tone }) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-400">{label}</p>
        <Icon size={15} strokeWidth={1.75} className="shrink-0 text-slate-600" aria-hidden="true" />
      </div>
      {value === null ? (
        <Skeleton className="mt-2.5 h-7 w-16" />
      ) : (
        <p
          className={cn(
            'tnum mt-2 font-display text-2xl font-bold leading-none',
            tone === 'success' ? 'text-emerald-400' : 'text-white'
          )}
        >
          {value}
        </p>
      )}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1 break-all text-[13px] text-slate-200',
          mono && 'font-mono text-[12px] text-slate-400'
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default Dashboard;
