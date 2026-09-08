const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            firstName: {
                type: String,
                required: true,
                maxlength: 50,
                trim: true
            },
            lastName: {
                type: String,
                required: true,
                maxlength: 50,
                trim: true
            }
        },

        emailId: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            maxlength: 100,
            trim: true
        },

        password: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);