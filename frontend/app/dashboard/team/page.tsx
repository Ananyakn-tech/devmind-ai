// frontend/app/dashboard/team/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { Users, Mail, Plus, Crown, Shield, Eye, User, Copy, Loader2, X } from 'lucide-react';
import { workspacesApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ROLE_CONFIG: Record<string, { icon: typeof Crown; color: string; label: string }> = {
  OWNER:  { icon: Crown,  color: 'text-amber-600 bg-amber-50 border-amber-200',   label: 'Owner'  },
  ADMIN:  { icon: Shield, color: 'text-blue-600 bg-blue-50 border-blue-200',      label: 'Admin'  },
  MEMBER: { icon: User,   color: 'text-gray-600 bg-gray-50 border-gray-200',      label: 'Member' },
  VIEWER: { icon: Eye,    color: 'text-purple-600 bg-purple-50 border-purple-200',label: 'Viewer' },
};

export default function TeamPage() {
  const { currentWorkspace } = useAppStore();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!currentWorkspace) return;
    Promise.all([
      workspacesApi.get(currentWorkspace.id),
      workspacesApi.getStats(currentWorkspace.id),
    ]).then(([wsRes, statsRes]) => {
      setWorkspace(wsRes.data);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, [currentWorkspace]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return toast.error('Email required');
    setInviting(true);
    try {
      const res = await workspacesApi.invite(currentWorkspace!.id, inviteEmail, inviteRole);
      setInviteLink(res.data.inviteLink);
      setInviteEmail('');
      toast.success('Invitation created!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link copied!');
  };

  const canManage = workspace?.myRole === 'OWNER' || workspace?.myRole === 'ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold">Team</h2>
        <p className="text-sm text-muted-foreground mt-1">{workspace?.name} · {workspace?.members?.length} members</p>
      </div>

      {/* Workspace stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Code Reviews', value: stats.reviewsByStatus?.reduce((a: number, s: any) => a + s._count, 0) || 0 },
            { label: 'Open Bugs', value: stats.bugsByStatus?.find((s: any) => s.status === 'TODO')?._count || 0 },
            { label: 'Bugs Fixed', value: stats.bugsByStatus?.find((s: any) => s.status === 'DONE')?._count || 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Members list */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Members ({workspace?.members?.length})
          </h3>
          <div className="space-y-3">
            {workspace?.members?.map((member: any) => {
              const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.MEMBER;
              const RoleIcon = roleConfig.icon;
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {member.user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{member.user.name}</span>
                      {member.user.id === user?.id && (
                        <span className="text-xs text-muted-foreground">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${roleConfig.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleConfig.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite */}
        {canManage && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              Invite Members
            </h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="ADMIN">Admin — can manage workspace</option>
                  <option value="MEMBER">Member — can create and edit</option>
                  <option value="VIEWER">Viewer — read only</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Send Invitation
              </button>
            </form>

            {inviteLink && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-2">Invite link (valid 7 days):</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background border border-border rounded px-2 py-1 flex-1 truncate">
                    {inviteLink}
                  </code>
                  <button onClick={copyLink} className="shrink-0 p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setInviteLink('')} className="shrink-0 p-1.5 rounded hover:bg-accent text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      {stats?.recentActivity?.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 8).map((item: any) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {item.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.user.name} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
