const express = require('express');
const router = express.Router();
const {
  getProjects, createProject, getProject, updateProject, deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect); // all project routes require auth

router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

module.exports = router;