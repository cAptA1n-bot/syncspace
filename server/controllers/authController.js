const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const registerUser = async (req, res) => {
    try {
        const { name, emailId, password } = req.body;

        // 1. Validate required fields
        if (
            !name ||
            !name.firstName ||
            !name.lastName ||
            !emailId ||
            !password
        ) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // 2. Validate email
        if (!validator.isEmail(emailId)) {
            return res.status(400).json({
                message: 'Please enter a valid email'
            });
        }

        // 3. Validate password
        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({
                message:
                    'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
            });
        }

        // 4. Check if user already exists
        const existingUser = await User.findOne({ emailId });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        // 5. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Create user
        const user = await User.create({
            name,
            emailId,
            password: hashedPassword
        });

        // 7. Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 8. Send response
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.emailId
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    registerUser
};