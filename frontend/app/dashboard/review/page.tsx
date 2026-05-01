// frontend/app/dashboard/review/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Code2, CheckCircle, Clock, Loader2, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import { reviewsApi } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  COMPLETED: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Completed' },
  PENDING:   { icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',   label: 'Pending'   },
  IN_PROGRESS:{ icon: Loader2,     color: 'text-blue-600',    bg: 'bg-blue-50',    label: 'Analyzing' },
  FAILED:    { icon: AlertCircle,  color: 'text-rose-600',    bg: 'bg-rose-50',    label: 'Failed'    },
};

const LANG_COLORS: Record<string, string> = {
  javascript: 'bg-yellow-100 text-yellow-800',
  typescript: 'bg-blue-100 text-blue-800',
  python:     'bg-green-100 text-green-800',
  rust:       'bg-orange-100 text-orange-800',
  go:         'bg-cyan-100 text-cyan-800',
  java:       'bg-red-100 text-red-800',
  cpp:        'bg-purple-100 text-purple-800',
};

export default function ReviewListPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = async () => {
    try {
      const res = await reviewsApi.list();
      setReviews(res.data.reviews);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this review?')) return;
    try {
      await reviewsApi.delete(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Code Reviews</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total reviews</p>
        </div>
        <Link href="/dashboard/review/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Review
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-16 text-center">
          <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
          <p className="text-muted-foreground mb-6 text-sm">Submit your first code for an AI-powered review.</p>
          <Link href="/dashboard/review/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Start Review
          </Link>
        </div>
      )}

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map((review) => {
          const statusCfg = STATUS_CONFIG[review.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
          const StatusIcon = statusCfg.icon;

          return (
            <Link key={review.id} href={`/dashboard/review/${review.id}`} className="block bg-card border border-border rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all group">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${statusCfg.bg} flex items-center justify-center shrink-0`}>
                  <StatusIcon className={`w-5 h-5 ${statusCfg.color} ${review.status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base group-hover:text-blue-600 transition-colors truncate">{review.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button onClick={(e) => handleDelete(review.id, e)} className="p-1 rounded hover:bg-rose-50 hover:text-rose-600 text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LANG_COLORS[review.language?.toLowerCase()] || 'bg-gray-100 text-gray-700'}`}>
                      {review.language}
                    </span>
                    <span className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {review._count?.suggestions || 0} suggestions · {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
