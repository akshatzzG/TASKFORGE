import { Draggable } from '@hello-pangea/dnd';
import { Sparkles, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const PRIORITY_STYLES = {
  low: 'bg-surface-2 text-text-muted',
  medium: 'bg-blue-500/10 text-blue-400',
  high: 'bg-amber-500/10 text-amber-400',
  urgent: 'bg-coral-500/10 text-coral-400',
};

export default function TaskCard({ task, index, onClick }) {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`relative bg-surface border rounded-xl p-3 mb-2 cursor-pointer transition-all ${
            task.isAIGenerated ? 'border-violet-500/30 border-l-2' : 'border-border-base'
          } ${
            snapshot.isDragging ? 'shadow-2xl shadow-black/40 rotate-1 border-violet-500/40' : 'hover:border-border-light'
          }`}
        >
          {task.isAIGenerated && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-violet-400 mb-1.5 uppercase tracking-wide">
              <Sparkles className="w-3 h-3" />
              AI
            </div>
          )}

          <p className="text-sm font-medium text-text-primary mb-2.5 line-clamp-2 leading-snug">{task.title}</p>

          <div className="flex items-center justify-between">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority]}`}>
              {task.priority}
            </span>

            {task.assignee && (
              <div className="w-5.5 h-5.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] flex items-center justify-center font-medium">
                {task.assignee.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {task.dueDate && (
            <div className="flex items-center gap-1 text-[11px] text-text-muted mt-2 font-mono">
              <Calendar className="w-3 h-3" />
              {format(new Date(task.dueDate), 'MMM d')}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}