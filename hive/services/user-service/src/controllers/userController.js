const User = require('../models/User');
const admin = require('firebase-admin');

// GET all users (admin or superadmin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    return res.json(users);
  } catch (err) {
    console.error('getAllUsers error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET user by id
const getUserById = async (req, res) => {
  try {
    const { studentNumber } = req.params;
    const user = await User.findOne({ studentNumber }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Allow admins/superadmins or the user themself
    if (
      req.user.role !== 'superadmin' &&
      req.user.role !== 'admin' &&
      req.user.uid !== user.firebaseUid
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(user);
  } catch (err) {
    console.error('getUserById error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// POST /users - create new user 
const createUser = async (req, res) => {
  try {
    const { name, email, password, studentNumber } = req.body;

    // Basic validation
    if (!name || !email || !password || !studentNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Always assign student role (DO NOT TRUST FRONTEND)
    const assignedRole = "student";

    // Create Firebase Authentication user
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Set custom claim role = student
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      role: assignedRole,
    });

    // Save user in MongoDB
    const user = new User({
      name,
      email,
      studentNumber,
      role: assignedRole,
      firebaseUid: firebaseUser.uid,
    });

    await user.save();

    // Return safe response (never send password)
    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentNumber: user.studentNumber,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("registerUser error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Duplicate field",
        error: err.keyValue,
      });
    }

    if (err.code === "auth/email-already-exists") {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE soft delete user
const deleteUser = async (req, res) => {
  try {
    const { studentNumber } = req.params;
    const user = await User.findOne({ studentNumber });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only admins/superadmins can delete
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    user.isActive = false;
    await user.save();
    return res.json({ message: 'User soft-deleted', studentNumber });
  } catch (err) {
    console.error('deleteUser error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET all admins (superadmin only)
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('-password');
    return res.json(admins);
  } catch (err) {
    console.error('getAllAdmins error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST create new admin (superadmin only)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, studentNumber } = req.body;

    const firebaseUser = await admin.auth().createUser({
      email,
      password: password || Math.random().toString(36).slice(-8),
      displayName: name,
    });

    await admin.auth().setCustomUserClaims(firebaseUser.uid, { role: 'admin' });

    const user = new User({
      name,
      email,
      password: password || undefined,
      studentNumber: studentNumber || undefined,
      role: 'admin',
      firebaseUid: firebaseUser.uid,
    });

    await user.save();
    return res.status(201).json(user);
  } catch (err) {
    console.error('createAdmin error', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Duplicate field', error: err.keyValue });
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE admin (soft delete) - superadmin only
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Admin not found' });

    if (user.role !== 'admin') return res.status(400).json({ message: 'User is not an admin' });

    user.isActive = false;
    await user.save();
    return res.json({ message: 'Admin soft-deleted', id });
  } catch (err) {
    console.error('deleteAdmin error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  deleteUser,
  getAllAdmins,
  createAdmin,
  deleteAdmin,
};


