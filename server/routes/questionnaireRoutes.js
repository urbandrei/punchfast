const express = require('express');
const router = express.Router();
const questionnaireController = require('../controllers/questionnaireController');

router.get('/pending', questionnaireController.checkPendingQuestionnaire);

router.get('/question', questionnaireController.getQuestion);

router.post('/answer', questionnaireController.submitAnswer);

module.exports = router;
