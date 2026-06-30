const Project = require('../models/Project');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/projects
const getProjects = asyncHandler(async (req, res) => {
  // tenantId from middleware — only returns this tenant's projects
  const projects = await Project.find({ tenantId: req.tenantId })
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort({ createdAt: -1 });

  // Add task count to each project
  const projectsWithCount = await Promise.all(
    projects.map(async (project) => {
      const taskCount = await Task.countDocuments({ projectId: project._id });
      const completedCount = await Task.countDocuments({ projectId: project._id, status: 'done' });
      return {
        ...project.toJSON(),
        taskCount,
        completedCount,
        progress: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0,
      };
    })
  );

  sendSuccess(res, 200, 'Projects fetched', { projects: projectsWithCount });
});

// POST /api/projects
const createProject = asyncHandler(async (req, res) => {
  const { name, description, color, members } = req.body;

  const project = await Project.create({
    tenantId: req.tenantId,
    name,
    description,
    color,
    owner: req.user._id,
    members: members || [],
  });

  await project.populate('owner', 'name email avatar');

  sendSuccess(res, 201, 'Project created', { project });
});

// GET /api/projects/:id
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    tenantId: req.tenantId, // tenant isolation enforced
  })
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');

  if (!project) {
    return sendError(res, 404, 'Project not found');
  }

  sendSuccess(res, 200, 'Project fetched', { project });
});

// PUT /api/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  let project = await Project.findOne({ _id: req.params.id, tenantId: req.tenantId });

  if (!project) {
    return sendError(res, 404, 'Project not found');
  }

  // Only owner or admin can update
  if (project.owner.toString() !== req.user._id.toString() && req.user.role === 'member') {
    return sendError(res, 403, 'Not authorized to update this project');
  }

  project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('owner', 'name email avatar').populate('members', 'name email avatar');

  sendSuccess(res, 200, 'Project updated', { project });
});

// DELETE /api/projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, tenantId: req.tenantId });

  if (!project) {
    return sendError(res, 404, 'Project not found');
  }

  if (project.owner.toString() !== req.user._id.toString() && req.user.role === 'member') {
    return sendError(res, 403, 'Not authorized to delete this project');
  }

  // Delete all tasks in this project too
  await Task.deleteMany({ projectId: project._id });
  await project.deleteOne();

  sendSuccess(res, 200, 'Project and all its tasks deleted');
});

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject };