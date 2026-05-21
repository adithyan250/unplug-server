const ScreenTime = require('../models/ScreenTime');

// @desc    Log a screen time session
// @route   POST /api/screentime
// @access  Private
exports.logScreenTime = async (req, res) => {
  try {
    const { category, appName, duration, date } = req.body;

    if (!category || !appName || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Please provide category, appName, and duration'
      });
    }

    // Set date to start of day if provided, otherwise today
    let logDate = new Date();
    if (date) {
      logDate = new Date(date);
    }
    logDate.setHours(0, 0, 0, 0);

    const log = await ScreenTime.create({
      userId: req.user.id,
      date: logDate,
      category,
      appName,
      duration: Number(duration)
    });

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get all screen time logs
// @route   GET /api/screentime
// @access  Private
exports.getLogs = async (req, res) => {
  try {
    const logs = await ScreenTime.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get screen time aggregated statistics
// @route   GET /api/screentime/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Today's boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 7 days ago boundaries
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // inclusive of today

    // 1. Today's stats by category
    const todayStats = await ScreenTime.aggregate([
      {
        $match: {
          userId,
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$category',
          totalDuration: { $sum: '$duration' },
          apps: { $addToSet: '$appName' }
        }
      }
    ]);

    // 2. Weekly usage trend (grouped by date)
    const weeklyTrend = await ScreenTime.aggregate([
      {
        $match: {
          userId,
          date: { $gte: sevenDaysAgo, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // 3. Top Apps usage
    const topApps = await ScreenTime.aggregate([
      {
        $match: {
          userId,
          date: { $gte: sevenDaysAgo, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$appName',
          category: { $first: '$category' },
          totalDuration: { $sum: '$duration' }
        }
      },
      {
        $sort: { totalDuration: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        today: todayStats,
        weeklyTrend,
        topApps
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
