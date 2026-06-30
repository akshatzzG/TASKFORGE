const OpenAI = require('openai');
const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/ai/breakdown
// Takes a high-level task title, returns 5-10 subtasks
// POST /api/ai/breakdown
const breakdownTask = asyncHandler(async (req, res) => {
  const { taskTitle, projectContext, taskId, projectId, createTasks } = req.body;

  if (!taskTitle) {
    return sendError(res, 400, 'Task title is required');
  }

  const prompt = `You are a senior project manager. Break down the following task into clear, actionable subtasks.

Task: "${taskTitle}"
${projectContext ? `Project context: "${projectContext}"` : ''}

Rules:
- Generate 5-8 subtasks maximum
- Each subtask should be completable in 1-4 hours
- Be specific and actionable
- Estimate priority for each subtask

Return ONLY valid JSON in this exact format:
{
  "subtasks": [
    {
      "title": "subtask title here",
      "description": "brief description of what needs to be done",
      "priority": "low | medium | high",
      "estimatedHours": 2
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const parsed = JSON.parse(response.choices[0].message.content);

  // Case 1: breaking down an EXISTING task into subtasks
  if (taskId) {
    const parentTask = await Task.findOne({ _id: taskId, tenantId: req.tenantId });
    if (parentTask) {
      const subtaskDocs = parsed.subtasks.map((sub, index) => ({
        tenantId: req.tenantId,
        projectId: parentTask.projectId,
        title: sub.title,
        description: sub.description,
        priority: sub.priority,
        status: 'todo',
        order: index,
        createdBy: req.user._id,
        parentTask: parentTask._id,
        isAIGenerated: true,
      }));
      await Task.insertMany(subtaskDocs);
    }
  }

  // Case 2: creating brand new standalone tasks directly in a project (no parent)
  if (createTasks && projectId) {
    const project = await Project.findOne({ _id: projectId, tenantId: req.tenantId });
    if (project) {
      const lastTask = await Task.findOne({ projectId, status: 'todo' }).sort({ order: -1 });
      let order = lastTask ? lastTask.order + 1 : 0;

      const taskDocs = parsed.subtasks.map((sub) => ({
        tenantId: req.tenantId,
        projectId,
        title: sub.title,
        description: sub.description,
        priority: sub.priority,
        status: 'todo',
        order: order++,
        createdBy: req.user._id,
        isAIGenerated: true,
      }));
      await Task.insertMany(taskDocs);
    }
  }

  sendSuccess(res, 200, 'Task breakdown generated', { subtasks: parsed.subtasks });
});

// POST /api/ai/standup
// Generates a standup update based on user's tasks
const generateStandup = asyncHandler(async (req, res) => {
  const { projectId } = req.body;

  // Get yesterday's completed tasks
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const filter = {
    tenantId: req.tenantId,
    assignee: req.user._id,
  };
  if (projectId) filter.projectId = projectId;

  const [doneTasks, inProgressTasks, todoTasks] = await Promise.all([
    Task.find({ ...filter, status: 'done', completedAt: { $gte: yesterday, $lte: today } })
      .select('title'),
    Task.find({ ...filter, status: 'in_progress' })
      .select('title dueDate'),
    Task.find({ ...filter, status: 'todo' })
      .sort({ priority: -1, order: 1 })
      .limit(5)
      .select('title priority'),
  ]);

  if (doneTasks.length === 0 && inProgressTasks.length === 0) {
    return sendError(res, 400, 'No tasks found to generate standup');
  }

  const prompt = `Generate a professional daily standup update based on this data.

Done yesterday:
${doneTasks.map((t) => `- ${t.title}`).join('\n') || '- Nothing completed'}

In progress:
${inProgressTasks.map((t) => `- ${t.title}`).join('\n') || '- Nothing in progress'}

Planned today:
${todoTasks.map((t) => `- ${t.title} (${t.priority} priority)`).join('\n') || '- To be decided'}

Write a concise, professional standup update in first person. Keep it under 150 words. Format:
- Yesterday: ...
- Today: ...
- Blockers: (mention if any tasks are overdue, otherwise write "None")`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
  });

  const standup = response.choices[0].message.content;

  sendSuccess(res, 200, 'Standup generated', {
    standup,
    meta: {
      doneTasks: doneTasks.length,
      inProgressTasks: inProgressTasks.length,
      plannedTasks: todoTasks.length,
    },
  });
});

// POST /api/ai/predict-deadline
// Analyzes task complexity and team history to suggest a deadline
const predictDeadline = asyncHandler(async (req, res) => {
  const { taskId } = req.body;

  const task = await Task.findOne({ _id: taskId, tenantId: req.tenantId })
    .populate('assignee', 'name');

  if (!task) {
    return sendError(res, 404, 'Task not found');
  }

  // Get historical data: how long similar tasks took to complete
  const completedTasks = await Task.find({
    tenantId: req.tenantId,
    status: 'done',
    completedAt: { $ne: null },
    priority: task.priority,
  })
    .sort({ completedAt: -1 })
    .limit(20)
    .select('title createdAt completedAt priority');

  // Calculate average completion time for similar priority tasks
  let avgDays = 3; // fallback default
  if (completedTasks.length > 0) {
    const totalDays = completedTasks.reduce((sum, t) => {
      const days = (new Date(t.completedAt) - new Date(t.createdAt)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgDays = Math.round(totalDays / completedTasks.length);
  }

  const prompt = `You are a project estimation expert. Predict a realistic deadline for this task.

Task: "${task.title}"
Description: "${task.description || 'No description'}"
Priority: ${task.priority}
Historical average for ${task.priority} priority tasks: ${avgDays} days
Today's date: ${new Date().toISOString().split('T')[0]}

Consider: task complexity from the title/description, priority level, and historical data.

Return ONLY valid JSON:
{
  "suggestedDays": 3,
  "reasoning": "brief explanation of why this deadline",
  "confidence": "low | medium | high"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const prediction = JSON.parse(response.choices[0].message.content);

  // Calculate suggested date
  const suggestedDate = new Date();
  suggestedDate.setDate(suggestedDate.getDate() + prediction.suggestedDays);

  // Save AI suggestion to task
  await Task.findByIdAndUpdate(taskId, { aiSuggestedDueDate: suggestedDate });

  sendSuccess(res, 200, 'Deadline predicted', {
    suggestedDate: suggestedDate.toISOString().split('T')[0],
    suggestedDays: prediction.suggestedDays,
    reasoning: prediction.reasoning,
    confidence: prediction.confidence,
    basedOnTasks: completedTasks.length,
  });
});

module.exports = { breakdownTask, generateStandup, predictDeadline };