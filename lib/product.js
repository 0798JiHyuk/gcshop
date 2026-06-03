const db = require('./db');
const { renderFrame } = require('./viewUtil');

function loadCategories(callback) {
  db.query('select * from code order by main_id, sub_id, start', callback);
}

function productImage(req) {
  if (!req.file) {
    return req.body.current_image || '';
  }
  return req.file.filename;
}

module.exports = {
  view: (req, res) => {
    db.query('select * from product order by prod_id desc', (error, products) => {
      if (error) {
        res.status(500).send('DB 오류: product 테이블을 확인하세요.');
        return;
      }

      renderFrame(req, res, 'product.ejs', {
        products,
        showControls: true
      });
    });
  },

  create: (req, res) => {
    loadCategories((error, categories) => {
      if (error) {
        res.status(500).send('DB 오류: code 테이블을 확인하세요.');
        return;
      }

      renderFrame(req, res, 'productCU.ejs', {
        mode: 'create',
        product: {},
        categories,
        formAction: '/product/create_process'
      });
    });
  },

  create_process: (req, res) => {
    const post = req.body;
    const [mainId = '', subId = ''] = (post.category || ':').split(':');
    const values = [
      mainId,
      subId,
      post.name,
      Number(post.price || 0),
      Number(post.stock || 0),
      post.brand,
      post.supplier,
      productImage(req)
    ];

    db.query(
      `insert into product(main_id, sub_id, name, price, stock, brand, supplier, image)
       values(?, ?, ?, ?, ?, ?, ?, ?)`,
      values,
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 상품을 추가할 수 없습니다.');
          return;
        }
        res.redirect('/product/view');
      }
    );
  },

  update: (req, res) => {
    const prodId = req.params.prodId;
    db.query('select * from product where prod_id = ?', [prodId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('수정할 상품을 찾을 수 없습니다.');
        return;
      }

      loadCategories((categoryError, categories) => {
        if (categoryError) {
          res.status(500).send('DB 오류: code 테이블을 확인하세요.');
          return;
        }

        renderFrame(req, res, 'productCU.ejs', {
          mode: 'update',
          product: rows[0],
          categories,
          formAction: '/product/update_process'
        });
      });
    });
  },

  update_process: (req, res) => {
    const post = req.body;
    const [mainId = '', subId = ''] = (post.category || ':').split(':');
    db.query(
      `update product
       set main_id = ?, sub_id = ?, name = ?, price = ?, stock = ?, brand = ?, supplier = ?, image = ?
       where prod_id = ?`,
      [
        mainId,
        subId,
        post.name,
        Number(post.price || 0),
        Number(post.stock || 0),
        post.brand,
        post.supplier,
        productImage(req),
        post.prod_id
      ],
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 상품을 수정할 수 없습니다.');
          return;
        }
        res.redirect('/product/view');
      }
    );
  },

  delete_process: (req, res) => {
    db.query('delete from product where prod_id = ?', [req.params.prodId], (error) => {
      if (error) {
        res.status(500).send('DB 오류: 상품을 삭제할 수 없습니다.');
        return;
      }
      res.redirect('/product/view');
    });
  }
};
