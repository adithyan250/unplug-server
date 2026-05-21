const DetoxSession = require('../models/DetoxSession');

// Helper to calculate streak information
const calculateStreak = (sessions) => {
  if (sessions.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  // Get unique local dates (YYYY-MM-DD)
  const uniqueDates = [
    ...new Set(
      sessions.map((s) => {
        const d = new Date(s.completedAt);
        // Convert to local date format YYYY-MM-DD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })
    )
  ].sort((a, b) => new Date(b) - new Date(a)); // Sort descending (newest first)

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Check if user has a session today or yesterday to continue current streak
  let currentStreak = 0;
  let hasSessionRecently = uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr;

  if (hasSessionRecently) {
    currentStreak = 1;
    let checkDate = new Date(uniqueDates[0]);

    for (let i = 1; i < uniqueDates.length; i++) {
      const nextDate = new Date(uniqueDates[i]);
      const diffTime = Math.abs(checkDate - nextDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        checkDate = nextDate;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }
  }

  // Calculate max streak historically
  let maxStreak = currentStreak;
  let tempStreak = 1;
  let checkDate = new Date(uniqueDates[0]);

  for (let i = 1; i < uniqueDates.length; i++) {
    const nextDate = new Date(uniqueDates[i]);
    const diffTime = Math.abs(checkDate - nextDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    } else {
      tempStreak = 1;
    }
    checkDate = nextDate;
  }

  return { currentStreak, maxStreak };
};

// @desc    Log a completed detox session
// @route   POST /api/detox
// @access  Private
exports.logDetoxSession = async (req, res) => {
  try {
    const { duration, focusNotes } = req.body;

    if (!duration) {
      return res.status(400).json({
        success: false,
        error: 'Please provide duration in minutes'
      });
    }

    const session = await DetoxSession.create({
      userId: req.user.id,
      duration: Number(duration),
      focusNotes,
      completed: true
    });

    // Fetch all completed detox sessions to recalculate streaks
    const allSessions = await DetoxSession.find({
      userId: req.user.id,
      completed: true
    }).sort({ completedAt: -1 });

    const streaks = calculateStreak(allSessions);

    res.status(201).json({
      success: true,
      data: session,
      streaks
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get detox session history
// @route   GET /api/detox
// @access  Private
exports.getDetoxHistory = async (req, res) => {
  try {
    const sessions = await DetoxSession.find({ userId: req.user.id })
      .sort({ completedAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get streak and aggregate data
// @route   GET /api/detox/streak
// @access  Private
exports.getStreakInfo = async (req, res) => {
  try {
    const sessions = await DetoxSession.find({
      userId: req.user.id,
      completed: true
    }).sort({ completedAt: -1 });

    const streaks = calculateStreak(sessions);

    const totalMinutes = sessions.reduce((acc, curr) => acc + curr.duration, 0);

    res.status(200).json({
      success: true,
      data: {
        currentStreak: streaks.currentStreak,
        maxStreak: streaks.maxStreak,
        totalSessions: sessions.length,
        totalMinutes
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
