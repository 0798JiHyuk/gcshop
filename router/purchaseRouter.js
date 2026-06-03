const express = require('express');

const router = express.Router();
const purchase = require('../lib/purchase');

router.get('/', (req, res) => purchase.purchase(req, res));
router.post('/', (req, res) => purchase.purchase_process(req, res));
router.get('/detail/:prodId', (req, res) => purchase.purchasedetail(req, res));
router.get('/cancel/:purchaseId', (req, res) => purchase.cancel_process(req, res));

router.get('/cart', (req, res) => purchase.cart(req, res));
router.post('/cart_process', (req, res) => purchase.cart_process(req, res));
router.post('/cartpurchase_process', (req, res) => purchase.cartpurchase_process(req, res));
router.post('/cartdelete_process', (req, res) => purchase.cartdelete_process(req, res));

router.get('/view', (req, res) => purchase.purchaseview(req, res));
router.get('/update/:purchaseId', (req, res) => purchase.purchaseupdate(req, res));
router.post('/update_process', (req, res) => purchase.purchaseupdate_process(req, res));
router.get('/delete/:purchaseId', (req, res) => purchase.purchasedelete_process(req, res));

router.get('/cart/view', (req, res) => purchase.cartview(req, res));
router.get('/cart/update/:cartId', (req, res) => purchase.cartupdate(req, res));
router.post('/cart/update_process', (req, res) => purchase.cartupdate_process(req, res));
router.get('/cart/delete/:cartId', (req, res) => purchase.cartdelete_admin_process(req, res));

module.exports = router;
