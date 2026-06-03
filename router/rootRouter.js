const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const root = require('../lib/root');

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/image');
    },
    filename: function (req, file, cb) {
      const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf-8');
      cb(null, decodedName);
    }
  })
});

router.get('/', (req, res) => {
  root.home(req, res);
});

router.get('/upload', (req, res) => {
  root.upload(req, res);
});

router.get('/category/:categ', (req, res) => {
  root.categoryview(req, res);
});

router.get('/detail/:prodId', (req, res) => {
  root.detail(req, res);
});

router.post('/search', (req, res) => {
  root.search(req, res);
});

router.post('/shop/search', (req, res) => {
  root.search(req, res);
});

router.get('/table/create', (req, res) => {
  root.tablecreate(req, res);
});

router.get('/table/manage', (req, res) => {
  root.tablemanage(req, res);
});

router.get('/table/view/:tableName', (req, res) => {
  root.tableview(req, res);
});

router.get('/customeranal', (req, res) => {
  root.customeranal(req, res);
});

router.post('/upload_process', upload.single('uploadFile'), (req, res) => {
  if (!req.file) {
    res.redirect('/upload');
    return;
  }

  const file = '/image/' + path.basename(req.file.filename);
  res.send(`
    <h1>Image Upload Successfully</h1>
    <a href="/">Back</a>
    <p><img src="${file}" alt="image 출력" style="max-width:400px;"/></p>
  `);
  console.log(file);
});

module.exports = router;
