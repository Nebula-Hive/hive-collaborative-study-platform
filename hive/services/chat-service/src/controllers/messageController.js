const Message = require('../models/messageModal');

exports.getMessagesByGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const messages = await Message.find({ groupId }).sort({ time: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};