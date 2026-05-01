// frontend/app/dashboard/bugs/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Plus, Bug, Loader2, AlertCircle, Clock, CheckCircle, ArrowRight, X, Sparkles } from 'lucide-react';
import { bugsApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useWorkspaceSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const COLUMNS = [
  { key: 'TODO',        label: 'To Do',       icon: Clock,        color: 'text-gray-600',    bg: 'bg-gray-100',   border: 'border-gray-200' },
  { key: 'IN_PROGRESS', label: 'In Progress',  icon: Loader2,      color: 'text-blue-600',    bg: 'bg-blue-100',   border: 'border-blue-200' },
  { key: 'IN_REVIEW',   label: 'In Review',    icon: AlertCircle,  color: 'text-amber-600',   bg: 'bg-amber-100',  border: 'border-amber-200' },
  { key: 'DONE',        label: 'Done',         icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-100',border: 'border-emerald-200' },
];

const PRIORITY_CONFIG: Record<string, { color: string; dot: string }> = {
  CRITICAL: { color: 'text-rose-700 bg-rose-50 border-rose-200',   dot: 'bg-rose-500' },
  HIGH:     { color: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  MEDIUM:   { color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  LOW:      { color: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500' },
};

function BugCard({ bug, onStatusChange }: { bug: any; onStatusChange: (id: string, status: string) => void }) {
  const [showAI, setShowAI] = useState(false);
  const pc = PRIORITY_CONFIG[bug.priority] || PRIORITY_CONFIG.MEDIUM;

  const nextStatus: Record<string, string> = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'IN_REVIEW',
    IN_REVIEW: 'DONE',
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm leading-snug flex-1">{bug.title}</p>
        {bug.status !== 'DONE' && (
          <button
            onClick={() => onStatusChange(bug.id, nextStatus[bug.status])}
            className="shrink-0 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Move to next stage"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">{bug.description}</p>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pc.color}`}>
          {bug.priority}
        </span>
        {bug.labels?.slice(0, 2).map((label: string) => (
          <span key={label} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {label}
          </span>
        ))}
      </div>

      {bug.aiSuggestion && (
        <div>
          <button
            onClick={() => setShowAI(!showAI)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
          >
            <Sparkles className="w-3 h-3" />
            {showAI ? 'Hide' : 'View'} AI suggestion
          </button>
          {showAI && (
            <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 rounded-lg text-xs text-indigo-900 dark:text-indigo-100 leading-relaxed">
              {bug.aiSuggestion}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          {bug.assignee && (
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
              {bug.assignee.name?.[0]?.toUpperCase()}
            </div>
          )}
          {!bug.assignee && <span className="text-xs text-muted-foreground">Unassigned</span>}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function NewBugModal({ workspaceId, onClose, onCreated }: { workspaceId: string; onClose: () => void; onCreated: (bug: any) => void }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', labels: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) return toast.error('Title and description required');
    setLoading(true);
    try {
      const res = await bugsApi.create({
        ...form,
        labels: form.labels.split(',').map(l => l.trim()).filter(Boolean),
        workspaceId,
      });
      onCreated(res.data);
      toast.success('Bug reported! AI is generating a fix suggestion...');
      onClose();
    } catch {
      toast.error('Failed to create bug');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold">Report Bug</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Short description of the bug"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Steps to reproduce, expected vs actual behavior..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Labels</label>
              <input
                value={form.labels}
                onChange={(e) => setForm({ ...form, labels: e.target.value })}
                placeholder="api, auth, ui"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-3">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            AI will automatically suggest a fix after submission
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Report Bug
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BugsPage() {
  const [kanban, setKanban] = useState<Record<string, any[]>>({ TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { currentWorkspace } = useAppStore();
  const socket = useWorkspaceSocket(currentWorkspace?.id || null);

  const load = async () => {
    if (!currentWorkspace) return;
    try {
      const res = await bugsApi.list(currentWorkspace.id);
      setKanban(res.data.kanban);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentWorkspace]);

  useEffect(() => {
    if (!socket) return;
    socket.on('bug:new', (bug: any) => {
      setKanban((prev) => ({ ...prev, TODO: [bug, ...prev.TODO] }));
    });
    socket.on('bug:updated', (bug: any) => {
      setKanban((prev) => {
        const cleaned: Record<string, any[]> = {};
        for (const key of Object.keys(prev)) {
          cleaned[key] = prev[key].filter((b) => b.id !== bug.id);
        }
        cleaned[bug.status] = [bug, ...cleaned[bug.status]];
        return cleaned;
      });
    });
    return () => {
      socket.off('bug:new');
      socket.off('bug:updated');
    };
  }, [socket]);

  const handleStatusChange = async (bugId: string, newStatus: string) => {
    try {
      await bugsApi.update(bugId, { status: newStatus });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCreated = (bug: any) => {
    setKanban((prev) => ({ ...prev, TODO: [bug, ...prev.TODO] }));
  };

  const total = Object.values(kanban).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div className="animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Bug Tracker</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total bugs · {currentWorkspace?.name}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Report Bug
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : (
        /* Kanban board */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
          {COLUMNS.map((col) => {
            const ColIcon = col.icon;
            const bugs = kanban[col.key] || [];
            return (
              <div key={col.key} className="flex flex-col min-h-0">
                <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg border ${col.border} ${col.bg}`}>
                  <ColIcon className={`w-4 h-4 ${col.color} ${col.key === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
                  <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                  <span className="ml-auto text-xs font-bold text-muted-foreground">{bugs.length}</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin pb-4">
                  {bugs.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                      <p className="text-xs text-muted-foreground">No bugs</p>
                    </div>
                  )}
                  {bugs.map((bug) => (
                    <BugCard key={bug.id} bug={bug} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && currentWorkspace && (
        <NewBugModal
          workspaceId={currentWorkspace.id}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
