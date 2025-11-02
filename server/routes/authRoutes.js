const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const businessController = require('../controllers/businessController');
const punchesController = require('../controllers/punchesController');
const storeController = require('../controllers/storeController');
const routeController = require('../controllers/routeController');

// NEW: import Business for listing
const Business = require('../models/business');

// ------- user auth -------
router.post('/login', authController.login);
router.post('/signup', authController.signup);

// ------- business auth -------
router.post('/business/login', businessController.login);
router.post('/business/signup', businessController.signup);

const requireAdmin = (req, res, next) => {
  if (req.headers['x-admin-token'] !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  next();
};

// list businesses (filterable by ?status=, with limit/offset)
router.get('/admin/businesses', requireAdmin, async (req, res) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;
    const where = {};
    if (status) where.status = status;

    const rows = await Business.findAll({
      where,
      order: [['id', 'ASC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      attributes: ['id', 'legalName', 'email', 'status'],
    });

    res.json({ rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// existing approve endpoint
router.post('/admin/businesses/:id/approve', requireAdmin, businessController.approve);



module.exports = router;
