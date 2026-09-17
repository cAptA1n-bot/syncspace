const Document = require('../models/Document');

const createDocument = async (title, ownerId) => {

    if (!title) {
        throw new Error('Title is required');
    }

    const document = await Document.create({
        title,
        owner: ownerId
    });

    return document;
};

const getAllDocuments = async () => {
    return await Document.find();
};

const getDocumentById = async (documentId) => {
    const document = await Document.findById(documentId);

    if (!document) {
        throw new Error('Document not found');
    }

    return document;
};

const updateDocument = async (documentId, content) => {

    const document = await Document.findByIdAndUpdate(
        documentId,
        { content },
        { new: true }
    );

    if (!document) {
        throw new Error('Document not found');
    }

    return document;
};

module.exports = {
    createDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument
};