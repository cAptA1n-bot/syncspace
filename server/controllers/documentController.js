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

const getAllDocuments = async (req, res) => {
    try {

        const documents =
            await documentService.getAllDocuments();

        return res.status(200).json(documents);

    } catch (error) {

        return res.status(400).json({
            message: error.message
        });
    }
};

const getDocumentById = async (req, res) => {
    try {

        const { id } = req.params;

        const document =
            await documentService.getDocumentById(id);

        return res.status(200).json(document);

    } catch (error) {

        return res.status(404).json({
            message: error.message
        });
    }
};

const updateDocument = async (req, res) => {
    try {

        const { id } = req.params;
        const { content } = req.body;

        const document =
            await documentService.updateDocument(
                id,
                content
            );

        return res.status(200).json({
            message: 'Document updated successfully',
            document
        });

    } catch (error) {

        return res.status(400).json({
            message: error.message
        });
    }
};

module.exports = {
    createDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument
};