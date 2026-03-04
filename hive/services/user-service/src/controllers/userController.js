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
    if (!["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { studentNumber } = req.params;

    // Find user first
    const user = await User.findOne({ studentNumber, role: "student" });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Soft delete in MongoDB
    user.isActive = false;
    await user.save();

    // Disable Firebase account
    if (user.firebaseUid) {
      await admin.auth().updateUser(user.firebaseUid, {
        disabled: true,
      });

      // Force logout
      await admin.auth().revokeRefreshTokens(user.firebaseUid);
    }

    return res.json({
      message: "User deactivated successfully",
      studentNumber: user.studentNumber,
    });

  } catch (err) {
    console.error("deleteUser error", err);
    return res.status(500).json({ message: "Server error" });
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
      password: password,
      studentNumber: studentNumber,
      role: 'admin',
      firebaseUid: firebaseUser.uid,
    });

    await user.save();
    return res.status(201).json(user);
  } catch (err) {
    console.error('createAdmin error', err);

    if (err.code === 11000) return res.status(400).json({ message: 'Duplicate field', error: err.keyValue });
    if (err.code === "auth/email-already-exists") {
      return res.status(400).json({
        message: "Email already registered",
      });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE soft delete admin (superadmin only)
const deleteAdmin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { studentNumber } = req.params;

    const adminUser = await User.findOne({ studentNumber, role: "admin" });

    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Soft delete in MongoDB
    adminUser.isActive = false;
    await adminUser.save();

    // Disable Firebase account
    if (adminUser.firebaseUid) {
      await admin.auth().updateUser(adminUser.firebaseUid, {
        disabled: true,
      });

      await admin.auth().revokeRefreshTokens(adminUser.firebaseUid);
    }

    return res.json({
      message: "Admin deactivated successfully",
      studentNumber: adminUser.studentNumber,
    });

  } catch (err) {
    console.error("deleteAdmin error", err);
    return res.status(500).json({ message: "Server error" });
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


