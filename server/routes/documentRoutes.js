const express = require('express');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.post('/', documentController.createDocument);

module.exports = router;