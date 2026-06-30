import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { breakdownTask } from '../api/ai';

export default function AIBreakdownModal({ projectId, onClose, onGenerated }) {
  const [taskTitle, setTaskTitle] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState(null);
  const [error, setError] = useState('');

  // Step 1: preview the AI breakdown before creating tasks
  const handlePreview = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await breakdownTask({ taskTitle, projectContext: context });
      setSubtasks(res.data.data.subtasks);
    } catch (err) {
      setError(err.response?.data?.message || 'AI breakdown failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: user confirms, actually creates the tasks
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await breakdownTask({
        taskTitle, projectContext: context, projectId, createTasks: true,
      });
      onGenerated();
      onClose();
    } catch (err) {
      setError('Failed to create tasks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-gray-900">AI Task Breakdown</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">Describe a high-level goal, AI splits it into subtasks</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>
        )}

        {!subtasks ? (
          <form onSubmit={handlePreview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What needs to get done?</label>
              <input
                type="text" required autoFocus
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g. Launch the new landing page"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Extra context (optional)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                rows={2}
                placeholder="Any constraints, deadline, team size..."
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-violet-600 text-white py-2.5 rounded-lg font-medium hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate breakdown'}
            </button>
          </form>
        ) : (
          <div>
            <div className="space-y-2 mb-4">
              {subtasks.map((sub, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{sub.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 shrink-0">
                      {sub.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{sub.description}</p>
                  <p className="text-xs text-gray-400 mt-1">~{sub.estimatedHours}h estimated</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSubtasks(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Regenerate
              </button>
              <button
                onClick={handleConfirm} disabled={loading}
                className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg font-medium hover:bg-violet-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : `Create ${subtasks.length} tasks`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}