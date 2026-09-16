const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const registerUser = async (name, emailId, password) => {

    // 1. Validate required fields
    if (
        !name ||
        !name.firstName ||
        !name.lastName ||
        !emailId ||
        !password
    ) {
        throw new Error('All fields are required');
    }

    // 2. Validate email
    if (!validator.isEmail(emailId)) {
        throw new Error('Please enter a valid email');
    }

    // 3. Validate password
    if (
        !validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })
    ) {
        throw new Error(
            'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
        );
    }

    // 4. Check if user already exists
    const existingUser = await User.findOne({ emailId });

    if (existingUser) {
        throw new Error('User already exists');
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

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.emailId
        }
    };
};

const loginUser = async (emailId, password) => {

    // 1. Validate fields
    if (!emailId || !password) {
        throw new Error('Email and password are required');
    }

    if (!validator.isEmail(emailId)) {
        throw new Error('Please enter a valid email');
    }

    // 2. Find user
    const user = await User.findOne({ emailId });

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // 3. Compare password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    // 4. Generate JWT
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.emailId
        }
    };
};

module.exports = {
    registerUser,
    loginUser
};