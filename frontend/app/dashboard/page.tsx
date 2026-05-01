// frontend/app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Code2, FileText, Bug, ArrowRight, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { userApi, activityApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { formatDistanceToNow } from 'date-fns';

interface Stats {
  reviewCount: number;
  docCount: number;
  bugCount: number;
  recentReviews: Array<{
    id: string;
    title: string;
    language: string;
    status: string;
    createdAt: string;
  }>;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user: { name: string; avatar: string | null };
}

const statusIcon = {
  COMPLETED: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  PENDING: <Clock className="w-4 h-4 text-amber-500" />,
  IN_PROGRESS: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  FAILED: <AlertCircle className="w-4 h-4 text-rose-500" />,
};

const activityColors: Record<string, string> = {
  REVIEW_CREATED: 'bg-blue-100 text-blue-700',
  REVIEW_COMPLETED: 'bg-emerald-100 text-emerald-700',
  DOC_GENERATED: 'bg-indigo-100 text-indigo-700',
  BUG_CREATED: 'bg-rose-100 text-rose-700',
  BUG_UPDATED: 'bg-amber-100 text-amber-700',
  BUG_CLOSED: 'bg-emerald-100 text-emerald-700',
  MEMBER_JOINED: 'bg-purple-100 text-purple-700',
  COMMENT_ADDED: 'bg-gray-100 text-gray-700',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userApi.getStats(), activityApi.list({ limit: '10' })])
      .then(([statsRes, actRes]) => {
        setStats(statsRes.data);
        setActivity(actRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { href: '/dashboard/review/new', icon: Code2, label: 'New Code Review', color: 'bg-blue-50 text-blue-700 border-blue-200', iconBg: 'bg-blue-600' },
    { href: '/dashboard/docs/new', icon: FileText, label: 'Generate Docs', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', iconBg: 'bg-indigo-600' },
    { href: '/dashboard/bugs/new', icon: Bug, label: 'Report Bug', color: 'bg-rose-50 text-rose-700 border-rose-200', iconBg: 'bg-rose-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-muted-foreground mt-1">Here's what's happening in your workspace.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Code Reviews', value: stats?.reviewCount ?? 0, icon: Code2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Docs Generated', value: stats?.docCount ?? 0, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Bugs Reported', value: stats?.bugCount ?? 0, icon: Bug, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-5 card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
              </div>
            </div>
            <div className="text-3xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-base font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 p-4 rounded-xl border ${action.color} transition-all hover:shadow-sm hover:-translate-y-0.5`}
            >
              <div className={`w-9 h-9 ${action.iconBg} text-white rounded-lg flex items-center justify-center shrink-0`}>
                <action.icon className="w-4.5 h-4.5" />
              </div>
              <span className="font-medium text-sm">{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Reviews */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Reviews</h3>
            <Link href="/dashboard/review" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentReviews?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No reviews yet</p>
            )}
            {stats?.recentReviews?.map((review) => (
              <Link key={review.id} href={`/dashboard/review/${review.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                {statusIcon[review.status as keyof typeof statusIcon]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{review.title}</p>
                  <p className="text-xs text-muted-foreground">{review.language} · {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activity.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
            )}
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {item.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${activityColors[item.type] || 'bg-gray-100 text-gray-700'}`}>
                  {item.type.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
