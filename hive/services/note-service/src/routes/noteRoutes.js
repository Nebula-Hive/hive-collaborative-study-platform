const express = require("express");
const {
  getNotes,
  createNote,
  deleteNote,
  updateNote,
} = require("../controllers/noteController"); 
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getNotes);
router.post('/create', authMiddleware, createNote);
router.delete('/delete/:id', authMiddleware, deleteNote);
router.put('/update/:id', authMiddleware, updateNote);

module.exports = router;