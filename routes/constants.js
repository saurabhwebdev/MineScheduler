const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const {
  getConstants,
  getConstant,
  createConstant,
  updateConstant,
  deleteConstant,
  getConstantStats
} = require('../controllers/constantsController');
const Constant = require('../models/Constant');
const { protect, authorize } = require('../middleware/auth');
const { logAudit, getClientIp, getUserAgent } = require('../utils/auditLogger');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// All routes require authentication
router.use(protect);

// Public routes (authenticated users)
router.get('/', getConstants);
router.get('/stats', getConstantStats);
router.get('/:id', getConstant);

// Admin-only routes
router.post('/', authorize('admin'), createConstant);
router.put('/:id', authorize('admin'), updateConstant);
router.delete('/:id', authorize('admin'), deleteConstant);

// @route   POST /api/constants/import
// @desc    Import constants from Excel file
// @access  Private (Admin only)
router.post('/import', authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Excel file is empty'
      });
    }

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    for (const row of data) {
      try {
        if (!row.keyword || !row.value || !row.unit) {
          results.skipped.push({
            row: row,
            reason: 'Missing required fields: keyword, value, or unit'
          });
          continue;
        }

        const keyword = row.keyword.toString().trim().toUpperCase();
        const existingConstant = await Constant.findOne({ keyword });
        if (existingConstant) {
          results.skipped.push({
            row: row,
            reason: `Constant '${keyword}' already exists`
          });
          continue;
        }

        const value = parseFloat(row.value);
        if (isNaN(value) || value < 0) {
          results.failed.push({
            row: row,
            reason: 'Invalid value (must be positive number)'
          });
          continue;
        }

        const constant = await Constant.create({
          keyword: keyword,
          value: value,
          unit: row.unit.toString().trim(),
          description: row.description ? row.description.toString().trim() : '',
          category: row.category || 'Mining',
          createdBy: req.user.id
        });

        await logAudit({
          user: req.user,
          action: 'CREATE',
          module: 'SETTINGS',
          resourceType: 'Constant',
          resourceId: constant._id,
          resourceName: constant.keyword,
          newValues: { keyword: constant.keyword, value: constant.value, unit: constant.unit },
          ipAddress: getClientIp(req),
          userAgent: getUserAgent(req)
        });

        results.success.push(keyword);
      } catch (error) {
        results.failed.push({
          row: row,
          reason: error.message
        });
      }
    }

    // Log bulk import audit
    await logAudit({
      user: req.user,
      action: 'CREATE',
      module: 'SETTINGS',
      resourceType: 'Constant Import',
      resourceId: 'bulk',
      resourceName: 'Excel Import',
      newValues: { 
        totalRows: data.length,
        successful: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length
      },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    res.json({
      status: 'success',
      message: 'Import completed',
      data: results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/constants/export
// @desc    Export constants to Excel file
// @access  Private
router.get('/export', async (req, res) => {
  try {
    const constants = await Constant.find().sort({ category: 1, keyword: 1 });

    const exportData = constants.map(constant => ({
      keyword: constant.keyword,
      value: constant.value,
      unit: constant.unit,
      category: constant.category,
      description: constant.description || '',
      isActive: constant.isActive ? 'Active' : 'Inactive'
    }));

    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Constants');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=constants_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export constants'
    });
  }
});

module.exports = router;
