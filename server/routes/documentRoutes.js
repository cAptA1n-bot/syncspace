const express = require('express');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.post('/', documentController.createDocument);
router.get('/', documentController.getAllDocuments);
router.get('/:id', documentController.getDocumentById);
router.patch('/:id', documentController.updateDocument);

module.exports = router;