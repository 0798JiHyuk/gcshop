const express = require('express');

const router = express.Router();
const person = require('../lib/person');

router.get('/view', (req, res) => person.view(req, res));
router.get('/create', (req, res) => person.create(req, res));
router.post('/create_process', (req, res) => person.create_process(req, res));
router.get('/update/:loginId', (req, res) => person.update(req, res));
router.post('/update_process', (req, res) => person.update_process(req, res));
router.get('/delete/:loginId', (req, res) => person.delete_process(req, res));

module.exports = router;
