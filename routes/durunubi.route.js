const express = require('express');
const router = express.Router();
const controller = require('../controllers/durunubi.controller');

router.get('/nearby', controller.getNearbyCourses);           // /api/durunubi/nearby?mapX=...&mapY=...
router.get('/course/:contentId', controller.getCourseDetail); // /api/durunubi/course/123456

module.exports = router;
