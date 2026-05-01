// frontend/app/dashboard/review/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle, Clock, Loader2, AlertCircle,
  Shield, Zap, Eye, Wrench, Star, ChevronDown, ChevronUp, Copy, Check,
} from 'lucide-react';
import { reviewsApi } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', badge: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  HIGH:     { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  MEDIUM:   { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: Star },
  LOW:      { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: Zap },
  INFO:     { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-700', icon: Eye },
};

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  security: Shield, performance: Zap, readability: Eye,
  maintainability: Wrench, 'best-practices': Star, bugs: AlertCircle,
};

function SuggestionCard({ s }: { s: any }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const cfg = SEVERITY_CONFIG[s.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.INFO;
  const CatIcon = CATEGORY_ICONS[s.category] || Star;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${cfg.bg}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 p-4 text-left">
        <CatIcon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{s.severity}</span>
            <span className="text-xs text-muted-foreground capitalize">{s.category}</span>
            {s.line && <span className="text-xs text-muted-foreground">Line {s.line}</span>}
          </div>
          <p className="font-semibold text-sm mt-1">{s.title}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-current/10 pt-3 space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Issue</p>
            <p className="text-sm">{s.description}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Suggestion</p>
            <p className="text-sm">{s.suggestion}</p>
          </div>
          {s.codeSnippet && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Fixed Code</p>
                <button onClick={() => copy(s.codeSnippet)} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
              </div>
              <pre className="bg-card border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto scrollbar-thin">{s.codeSnippet}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const load = async () => {
    try {
      const res = await reviewsApi.get(id as string);
      setReview(res.data);
    } catch {
      toast.error('Review not found');
      router.push('/dashboard/review');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('review:join', id);
    socket.on('review:completed', (data: any) => {
      if (data.reviewId === id) {
        toast.success(`Review complete! Found ${data.suggestionsCount} suggestions.`);
        load();
      }
    });
    socket.on('review:failed', (data: any) => {
      if (data.reviewId === id) toast.error('Review analysis failed. Please try again.');
    });
    return () => {
      socket.off('review:completed');
      socket.off('review:failed');
    };
  }, [socket, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!review) return null;

  const criticalCount = review.suggestions?.filter((s: any) => s.severity === 'CRITICAL').length || 0;
  const highCount = review.suggestions?.filter((s: any) => s.severity === 'HIGH').length || 0;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      {/* Back */}
      <button onClick={() => router.push('/dashboard/review')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Reviews
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{review.title}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">{review.language}</span>
              <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {review.status === 'IN_PROGRESS' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
            {review.status === 'COMPLETED' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
            {review.status === 'PENDING' && <Clock className="w-5 h-5 text-amber-600" />}
            {review.status === 'FAILED' && <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span className="text-sm font-medium capitalize">{review.status.toLowerCase().replace('_', ' ')}</span>
          </div>
        </div>

        {/* Stats row */}
        {review.status === 'COMPLETED' && (
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold">{review.suggestions?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Suggestions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-600">{criticalCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Critical Issues</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{highCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">High Priority</p>
            </div>
          </div>
        )}
      </div>

      {/* In progress state */}
      {(review.status === 'PENDING' || review.status === 'IN_PROGRESS') && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-8 text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">AI is analyzing your code...</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">This usually takes 15-30 seconds. You'll be notified when done.</p>
        </div>
      )}

      {/* Suggestions */}
      {review.status === 'COMPLETED' && review.suggestions?.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Suggestions ({review.suggestions.length})</h3>
          {review.suggestions.map((s: any) => (
            <SuggestionCard key={s.id} s={s} />
          ))}
        </div>
      )}

      {review.status === 'COMPLETED' && review.suggestions?.length === 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl p-8 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
          <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">Excellent code!</h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">No issues found. Your code looks great!</p>
        </div>
      )}

      {/* Code preview */}
      <div>
        <h3 className="font-semibold mb-3">Original Code</h3>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">{review.language}</span>
            <button onClick={() => { navigator.clipboard.writeText(review.code); toast.success('Copied!'); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <pre className="p-4 text-sm font-mono overflow-x-auto scrollbar-thin max-h-80">{review.code}</pre>
        </div>
      </div>
    </div>
  );
}
