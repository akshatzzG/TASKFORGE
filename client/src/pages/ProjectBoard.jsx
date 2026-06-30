import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { ArrowLeft, Plus, Sparkles, Users } from 'lucide-react';
import { getTasks, reorderTasks } from '../api/tasks';
import { getProject } from '../api/projects';
import Layout from '../components/layout';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import AIBreakdownModal from '../components/AIBreakdownModal';
import AIStandupModal from '../components/AIStandupModal';
import TaskDetailModal from '../components/TaskDetailModal';
import {updateTask } from '../api/tasks';

const COLUMNS = [
  { id: 'todo', label: 'To do' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [grouped, setGrouped] = useState({ todo: [], in_progress: [], review: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [createStatus, setCreateStatus] = useState(null); // which column to create task in
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);
  const [showAIStandup, setShowAIStandup] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectRes, tasksRes] = await Promise.all([getProject(id), getTasks(id)]);
      setProject(projectRes.data.data.project);
      setGrouped(tasksRes.data.data.grouped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handler — the heart of the kanban board
  const handleDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return; // dropped outside any column
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    // Optimistic update — update UI instantly, sync to backend after
    const newGrouped = { ...grouped };
    const sourceTasks = Array.from(newGrouped[sourceCol]);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (sourceCol === destCol) {
      sourceTasks.splice(destination.index, 0, movedTask);
      newGrouped[sourceCol] = sourceTasks;
    } else {
      const destTasks = Array.from(newGrouped[destCol]);
      movedTask.status = destCol;
      destTasks.splice(destination.index, 0, movedTask);
      newGrouped[sourceCol] = sourceTasks;
      newGrouped[destCol] = destTasks;
    }

    setGrouped(newGrouped);

    // Sync new order + status to backend for both affected columns
    const updates = [
      ...newGrouped[sourceCol].map((t, i) => ({ id: t._id, status: sourceCol, order: i })),
      ...(sourceCol !== destCol
        ? newGrouped[destCol].map((t, i) => ({ id: t._id, status: destCol, order: i }))
        : []),
    ];

    try {
      await reorderTasks(updates);
    } catch (err) {
      console.error('Reorder failed, refetching', err);
      fetchData(); // rollback by refetching real state
    }
  };

  const handleTaskCreated = (task) => {
    setGrouped({ ...grouped, [task.status]: [...grouped[task.status], task] });
  };

  const handleMarkDone = async (task) => {
  // Optimistic update — instant UI feedback
  const newGrouped = { ...grouped };
  newGrouped[task.status] = newGrouped[task.status].filter((t) => t._id !== task._id);
  newGrouped.done = [...newGrouped.done, { ...task, status: 'done' }];
  setGrouped(newGrouped);

  try {
    const res = await updateTask(task._id, { status: 'done' });
    // sync the real updated task (with completedAt etc.) back in
    handleTaskUpdated(res.data.data.task);
  } catch (err) {
    console.error('Failed to mark done', err);
    fetchData(); // rollback on failure
  }
};


  const handleTaskUpdated = (updatedTask) => {
    // Task might have changed status, so rebuild grouped from scratch
    const newGrouped = { todo: [], in_progress: [], review: [], done: [] };
    Object.values(grouped).flat().forEach((t) => {
      const task = t._id === updatedTask._id ? updatedTask : t;
      newGrouped[task.status].push(task);
    });
    setGrouped(newGrouped);
  };


  const handleTaskDeleted = (taskId) => {
    const newGrouped = {};
    Object.keys(grouped).forEach((status) => {
      newGrouped[status] = grouped[status].filter((t) => t._id !== taskId);
    });
    setGrouped(newGrouped);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-gray-400 text-sm">Loading board...</div>
      </Layout>
    );
  }

 return (
    <Layout>
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-text-muted hover:text-text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project?.color }} />
              <h1 className="text-xl font-semibold text-text-primary tracking-tight">{project?.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIStandup(true)}
              className="flex items-center gap-1.5 border border-violet-500/30 text-violet-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-violet-500/10 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Generate standup
            </button>
            <button
              onClick={() => setShowAIBreakdown(true)}
              className="flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
            >
              <Sparkles className="w-4 h-4" />
              AI breakdown
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((col) => (
              <div key={col.id} className="bg-surface/50 border border-border-base rounded-2xl p-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-medium text-text-secondary">
                    {col.label}
                    <span className="ml-1.5 text-text-muted font-mono text-xs">{grouped[col.id]?.length || 0}</span>
                  </h3>
                  <button
                    onClick={() => setCreateStatus(col.id)}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[100px] rounded-xl transition-colors ${
                        snapshot.isDraggingOver ? 'bg-violet-500/5' : ''
                      }`}
                    >
                      {grouped[col.id]?.map((task, index) => (
                        <TaskCard
                          key={task._id} task={task} index={index}
                          onClick={setSelectedTask}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
      {createStatus && (
        <CreateTaskModal
          projectId={id} status={createStatus}
          onClose={() => setCreateStatus(null)}
          onCreated={handleTaskCreated}
        />
      )}

      {showAIBreakdown && (
        <AIBreakdownModal
          projectId={id}
          onClose={() => setShowAIBreakdown(false)}
          onGenerated={fetchData}
        />
      )}

      {showAIStandup && (
        <AIStandupModal projectId={id} onClose={() => setShowAIStandup(false)} />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </Layout>
  );
}