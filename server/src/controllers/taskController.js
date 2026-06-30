const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/tasks?projectId=xxx
const getTasks = asyncHandler(async (req, res) => {
  const { projectId, status, assignee, priority } = req.query;

  const filter = { tenantId: req.tenantId };
  if (projectId) filter.projectId = projectId;
  if (status) filter.status = status;
  if (assignee) filter.assignee = assignee;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('parentTask', 'title')
    .sort({ order: 1, createdAt: -1 });

  // Group tasks by status for kanban view
  const grouped = {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };

  tasks.forEach((task) => {
    if (grouped[task.status]) {
      grouped[task.status].push(task);
    }
  });

  sendSuccess(res, 200, 'Tasks fetched', { tasks, grouped });
});

// POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { projectId, title, description, status, priority, assignee, dueDate, tags } = req.body;

  // Verify project belongs to this tenant
  const project = await Project.findOne({ _id: projectId, tenantId: req.tenantId });
  if (!project) {
    return sendError(res, 404, 'Project not found');
  }

  // Get highest order in this status column
  const lastTask = await Task.findOne({ projectId, status: status || 'todo' }).sort({ order: -1 });
  const order = lastTask ? lastTask.order + 1 : 0;

  const task = await Task.create({
    tenantId: req.tenantId,
    projectId,
    title,
    description,
    status,
    priority,
    assignee,
    dueDate,
    tags,
    order,
    createdBy: req.user._id,
  });

  await task.populate('assignee', 'name email avatar');
  await task.populate('createdBy', 'name email');

  sendSuccess(res, 201, 'Task created', { task });
});

// GET /api/tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email')
    .populate('parentTask', 'title status');

  if (!task) {
    return sendError(res, 404, 'Task not found');
  }

  // Get subtasks if this is a parent task
  const subtasks = await Task.find({ parentTask: task._id })
    .populate('assignee', 'name email avatar');

  sendSuccess(res, 200, 'Task fetched', { task, subtasks });
});

// PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, tenantId: req.tenantId });

  if (!task) {
    return sendError(res, 404, 'Task not found');
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('assignee', 'name email avatar')
    .populate('createdBy', 'name email');

  sendSuccess(res, 200, 'Task updated', { task: updated });
});

// DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, tenantId: req.tenantId });

  if (!task) {
    return sendError(res, 404, 'Task not found');
  }

  // Delete subtasks too
  await Task.deleteMany({ parentTask: task._id });
  await task.deleteOne();

  sendSuccess(res, 200, 'Task deleted');
});

// PUT /api/tasks/reorder — for drag and drop
const reorderTasks = asyncHandler(async (req, res) => {
  const { tasks } = req.body;
  // tasks = [{ id, status, order }, ...]

  const bulkOps = tasks.map(({ id, status, order }) => ({
    updateOne: {
      filter: { _id: id, tenantId: req.tenantId },
      update: { status, order },
    },
  }));

  await Task.bulkWrite(bulkOps);

  sendSuccess(res, 200, 'Tasks reordered');
});

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, reorderTasks };