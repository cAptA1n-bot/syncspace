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

module.exports = {
    createDocument
};