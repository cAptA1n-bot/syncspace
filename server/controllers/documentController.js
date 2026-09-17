const documentService = require('../services/documentService');

const createDocument = async (req, res) => {
    try {

        const { title, ownerId } = req.body;

        const document = await documentService.createDocument(
            title,
            ownerId
        );

        return res.status(201).json({
            message: 'Document created successfully',
            document
        });

    } catch (error) {

        return res.status(400).json({
            message: error.message
        });
    }
};

module.exports = {
    createDocument
};