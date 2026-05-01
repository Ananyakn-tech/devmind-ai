// frontend/app/dashboard/docs/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Loader2, Trash2, Download } from 'lucide-react';
import { documentsApi } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const DOC_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  README:    { label: 'README',    color: 'bg-blue-100 text-blue-800' },
  JSDOC:     { label: 'JSDoc',     color: 'bg-yellow-100 text-yellow-800' },
  DOCSTRING: { label: 'Docstring', color: 'bg-green-100 text-green-800' },
  API_DOCS:  { label: 'API Docs',  color: 'bg-purple-100 text-purple-800' },
  CHANGELOG: { label: 'Changelog', color: 'bg-gray-100 text-gray-800' },
};

export default function DocsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    title: '', language: 'TypeScript', code: '',
    docType: 'README', projectName: '',
  });
  const [generatedDoc, setGeneratedDoc] = useState<any>(null);

  const DOC_TYPES = Object.keys(DOC_TYPE_CONFIG);
  const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++'];

  useEffect(() => {
    documentsApi.list().then((res) => {
      setDocs(res.data.documents);
    }).finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Please paste your code');
    if (!form.title) return toast.error('Please add a title');
    setGenerating(true);
    setGeneratedDoc(null);
    try {
      const res = await documentsApi.generate(form);
      setGeneratedDoc(res.data);
      setDocs((prev) => [res.data, ...prev]);
      toast.success('Documentation generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    await documentsApi.delete(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast.success('Deleted');
  };

  const downloadDoc = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.md`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold">Documentation Generator</h2>
        <p className="text-sm text-muted-foreground mt-1">Generate professional docs from your code using AI.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Generator form */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Generate New Doc
          </h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Auth module docs"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Doc Type</label>
                <select
                  value={form.docType}
                  onChange={(e) => setForm({ ...form, docType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_TYPE_CONFIG[t].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {form.docType === 'README' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Project Name (optional)</label>
                <input
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  placeholder="MyAwesomeProject"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">Code</label>
              <textarea
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Paste your code here..."
                rows={10}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono resize-none scrollbar-thin focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate Documentation'}
            </button>
          </form>
        </div>

        {/* Output */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <h3 className="font-semibold mb-4">Output</h3>
          {generating && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">AI is generating your docs...</p>
              </div>
            </div>
          )}
          {!generating && !generatedDoc && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Generated docs will appear here</p>
              </div>
            </div>
          )}
          {!generating && generatedDoc && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DOC_TYPE_CONFIG[generatedDoc.type]?.color}`}>
                    {DOC_TYPE_CONFIG[generatedDoc.type]?.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{generatedDoc.language}</span>
                </div>
                <button
                  onClick={() => downloadDoc(generatedDoc.content, generatedDoc.title)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
                >
                  <Download className="w-3 h-3" /> Download .md
                </button>
              </div>
              <div className="flex-1 bg-muted/50 rounded-lg p-4 overflow-auto scrollbar-thin">
                <pre className="text-xs font-mono whitespace-pre-wrap">{generatedDoc.content}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Doc history */}
      {docs.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Document History</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-indigo-300 transition-all group cursor-pointer"
                onClick={() => documentsApi.get(doc.id).then((r) => setGeneratedDoc(r.data))}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DOC_TYPE_CONFIG[doc.type]?.color || 'bg-gray-100 text-gray-700'}`}>
                    {DOC_TYPE_CONFIG[doc.type]?.label || doc.type}
                  </span>
                  <button onClick={(e) => handleDelete(doc.id, e)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-medium mt-2 truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{doc.language} · {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
