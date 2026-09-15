const userService = require('../services/authService');

const registerUser = async (req, res) => {
    try {

        const { name, emailId, password } = req.body;

        const result = await userService.registerUser(
            name,
            emailId,
            password
        );

        res.cookie('token', result.token,{
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        return res.status(201).json({
            message: 'User registered successfully',
            user: result.user
        });

    } catch (error) {

        console.error(error);

        return res.status(400).json({
            message: error.message
        });
    }
};

module.exports = {
    registerUser
};