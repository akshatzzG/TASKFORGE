import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { generateStandup } from '../api/ai';

export default function AIStandupModal({ projectId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [standup, setStandup] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStandup();
  }, []);

  const fetchStandup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await generateStandup({ projectId });
      setStandup(res.data.data.standup);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate standup');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(standup);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-gray-900">Daily Standup</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500 mb-2" />
            <p className="text-sm text-gray-400">Analyzing your tasks...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
        ) : (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line mb-4">
              {standup}
            </div>
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}