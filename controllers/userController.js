const User = require('../models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const transporter = require('../config/nodemailer');
require('dotenv').config();

const sendConfirmationEmail = async (userEmail, confirmationCode) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Email Confirmation',
    html: `<h1>Email Confirmation</h1>
           <p>Click <a href="http://localhost:${process.env.PORT}/api/users/confirm/${confirmationCode}">here</a> to confirm your email.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent');
  } catch (error) {
    console.error('Error sending confirmation email', error);
  }
};

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const confirmationCode = crypto.randomBytes(16).toString('hex');
    const user = new User({ username, email, password: hashedPassword, confirmationCode });
    await user.save();

    sendConfirmationEmail(user.email, confirmationCode);

    res.status(201).json({ message: 'User registered successfully. Please check your email for confirmation.' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
}; 

// User login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return res.status(200).json({ token });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.confirmEmail = async (req, res) => {
  const { confirmationCode } = req.params;
  try {
    const user = await User.findOne({ confirmationCode });
    if (!user) return res.status(400).json({ message: 'Invalid confirmation code' });

    user.isEmailConfirmed = true;
    user.confirmationCode = null;
    await user.save();

    res.status(200).json({ message: 'Email confirmed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming email', error });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { username, email } = req.body;

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.username = username || user.username;
    user.email = email || user.email;

    const updatedUser = await user.save();

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
