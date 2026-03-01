const express = require('express');
const router = express.Router();
const { getMessagesByGroup } = require('../controllers/messageController');

router.get('/:groupId', getMessagesByGroup);

module.exports = router;