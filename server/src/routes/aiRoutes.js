const express = require('express');
const router = express.Router();
const { breakdownTask, generateStandup, predictDeadline } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/breakdown', breakdownTask);
router.post('/standup', generateStandup);
router.post('/predict-deadline', predictDeadline);

module.exports = router;