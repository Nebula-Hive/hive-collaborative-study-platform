const Message = require('../models/messageModal');
const Student = require('../models/studentModal');

exports.getMessagesByGroup = async (req, res) => {
  const { groupId, studentId } = req.params;

  try {
    const student = await Student.findOne({ studentId });

    if (!student || student.batch !== groupId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ room: groupId }).sort({ time: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};