// frontend/app/dashboard/review/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Code2, Loader2, Upload, Sparkles } from 'lucide-react';
import { reviewsApi } from '@/lib/api';
import toast from 'react-hot-toast';

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Rust', 'Go',
  'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'Scala', 'R', 'MATLAB', 'SQL', 'HTML/CSS', 'Shell',
];

const EXAMPLES: Record<string, string> = {
  JavaScript: `function fetchUserData(userId) {
  var url = "https://api.example.com/users/" + userId;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, false); // synchronous!
  xhr.send();
  if (xhr.status === 200) {
    var data = JSON.parse(xhr.responseText);
    return data;
  }
}`,
  Python: `def calculate_average(numbers):
  total = 0
  for i in range(len(numbers)):
    total = total + numbers[i]
  avg = total / len(numbers)
  return avg`,
};

export default function NewReviewPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', language: 'TypeScript', code: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return toast.error('Please add a title');
    if (!form.code.trim()) return toast.error('Please paste your code');
    setLoading(true);
    try {
      const res = await reviewsApi.create(form);
      toast.success('Review submitted! AI is analyzing your code...');
      router.push(`/dashboard/review/${res.data.review.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create review');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, code: ev.target?.result as string }));
    };
    reader.readAsText(file);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      js: 'JavaScript', ts: 'TypeScript', py: 'Python',
      rs: 'Rust', go: 'Go', java: 'Java',
    };
    if (ext && langMap[ext]) setForm((f) => ({ ...f, language: langMap[ext] }));
    if (!form.title) setForm((f) => ({ ...f, title: file.name }));
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold">New Code Review</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your code and our AI will give you detailed feedback.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Review Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Auth service refactor"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Language</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Code input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Code</label>
            <div className="flex items-center gap-2">
              {EXAMPLES[form.language] && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, code: EXAMPLES[form.language], title: f.title || `${form.language} Example` }))}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Load example
                </button>
              )}
              <label className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <Upload className="w-3 h-3" />
                Upload file
                <input type="file" accept=".js,.ts,.py,.go,.rs,.java,.cpp,.cs" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
          <textarea
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Paste your code here..."
            rows={18}
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono resize-none scrollbar-thin"
          />
          <p className="text-xs text-muted-foreground mt-1">{form.code.length.toLocaleString()} characters</p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Analyze with AI'}
          </button>
          <button type="button" onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
