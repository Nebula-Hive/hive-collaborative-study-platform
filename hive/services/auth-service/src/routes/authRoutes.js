// const express = require('express');
// const { body, validationResult } = require('express-validator');
// const router = express.Router();
// const { verifyToken, logout } = require('../controllers/authController');

// // POST /verify - accepts { token }
// router.post(
//   '/verify',
//   [body('token').notEmpty().withMessage('token is required')],
//   (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
//     return verifyToken(req, res);
//   }
// );

// // POST /logout - accepts { uid }
// router.post(
//   '/logout',
//   [body('uid').notEmpty().withMessage('uid is required')],
//   (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
//     return logout(req, res);
//   }
// );

// module.exports = router;


const express = require('express');
const router = express.Router();
const { verifyToken, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /verify - token is taken from Authorization header
router.post('/verify', authMiddleware, (req, res) => {
  // req.user is already populated by authMiddleware
  return verifyToken(req, res);
});

// POST /logout - token is taken from Authorization header
router.post('/logout', authMiddleware, (req, res) => {
  // req.user.uid is available from authMiddleware
  return logout(req, res);
});

module.exports = router;