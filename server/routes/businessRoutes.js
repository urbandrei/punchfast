const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/businessController');

// admin gate
const requireAdmin = (req, res, next) => {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!process.env.ADMIN_TOKEN) return res.status(500).json({ message: 'Admin token not configured' });
  if (token !== process.env.ADMIN_TOKEN) return res.status(401).json({ message: 'Unauthorized' });
  next();
};

router.post('/signup', ctrl.signup);                 // /api/business/signup
router.post('/login', ctrl.login);                   // /api/business/login
router.post('/:id/approve', requireAdmin, ctrl.approve);

module.exports = router;
