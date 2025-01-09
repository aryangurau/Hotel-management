const router = require('express').Router();
const { isUser } = require('../../middlewares/auth.middleware');
const { initiatePayment, verifyPayment, getPaymentHistory } = require('./payment.controller');

router.post('/initiate', isUser, initiatePayment);
router.post('/verify', isUser, verifyPayment);
router.get('/history', isUser, getPaymentHistory);

module.exports = router;
