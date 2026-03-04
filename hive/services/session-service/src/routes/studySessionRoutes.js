const express = require("express");
const router = express.Router();
const {
  getAllSessions,
  getSessionById,
    getCurrentMonthSessions,
  getNextMonthSessions,
  getSessionsByMonth
} = require("../controllers/studySessionController");

// Get All
router.get("/", getAllSessions);
router.get("/current-month", getCurrentMonthSessions);
router.get("/next-month", getNextMonthSessions);
router.get("/month/:month", getSessionsByMonth);

// Get One
router.get("/:id", getSessionById);


module.exports = router;