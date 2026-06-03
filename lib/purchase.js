const sanitizeHtml = require('sanitize-html');
const db = require('./db');
const { renderFrame } = require('./viewUtil');

function today() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function loginid(req) {
  return req.session.loginid || '';
}

function alertAndMove(res, message, url) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<script>alert("${message}"); location.href="${url}";</script>`);
}

function requireCustomer(req, res) {
  if ((req.session.cls || 'NON') === 'CST') {
    return true;
  }
  alertAndMove(res, '고객으로 로그인해야 사용할 수 있습니다.', '/');
  return false;
}

function requireManager(req, res) {
  if ((req.session.cls || 'NON') === 'MNG') {
    return true;
  }
  alertAndMove(res, '관리자만 사용할 수 있습니다.', '/');
  return false;
}

function loadPeopleAndProducts(callback) {
  db.query(
    'select loginid, name from person order by loginid; select prod_id, name from product order by prod_id',
    callback
  );
}

function selectedIds(body) {
  if (!body.check) {
    return [];
  }
  return Array.isArray(body.check) ? body.check : [body.check];
}

function insertPurchase(loginidValue, prodId, qty, callback) {
  db.query('select * from product where prod_id = ?', [prodId], (error, rows) => {
    if (error || rows.length === 0) {
      callback(error || new Error('product not found'));
      return;
    }

    const product = rows[0];
    const price = Number(product.price || 0);
    const safeQty = Math.max(1, Number(qty || 1));
    db.query(
      `insert into purchase(loginid, prod_id, date, price, point, qty, total, payYN, cancel)
       values(?, ?, ?, ?, ?, ?, ?, 'Y', 'N')`,
      [
        loginidValue,
        prodId,
        today(),
        price,
        Math.floor(price * safeQty * 0.005),
        safeQty,
        price * safeQty
      ],
      callback
    );
  });
}

module.exports = {
  purchasedetail: (req, res) => {
    if (!requireCustomer(req, res)) {
      return;
    }

    db.query('select * from product where prod_id = ?', [req.params.prodId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('상품을 찾을 수 없습니다.');
        return;
      }

      renderFrame(req, res, 'purchaseDetail.ejs', { product: rows[0] });
    });
  },

  purchase_process: (req, res) => {
    if (!requireCustomer(req, res)) {
      return;
    }

    insertPurchase(loginid(req), sanitizeHtml(req.body.prod_id || ''), req.body.qty, (error) => {
      if (error) {
        res.status(500).send('DB 오류: 구매 정보를 저장할 수 없습니다.');
        return;
      }
      res.redirect('/purchase');
    });
  },

  purchase: (req, res) => {
    if (!requireCustomer(req, res)) {
      return;
    }

    db.query(
      `select pu.*, pr.name, pr.image
       from purchase pu inner join product pr on pu.prod_id = pr.prod_id
       where pu.loginid = ?
       order by pu.purchase_id desc`,
      [loginid(req)],
      (error, purchases) => {
        if (error) {
          res.status(500).send('DB 오류: 구매 목록을 조회할 수 없습니다.');
          return;
        }
        renderFrame(req, res, 'purchase.ejs', { purchases });
      }
    );
  },

  cancel_process: (req, res) => {
    if (!requireCustomer(req, res)) {
      return;
    }

    db.query(
      'update purchase set cancel = ? where purchase_id = ? and loginid = ?',
      ['Y', req.params.purchaseId, loginid(req)],
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 구매 취소를 할 수 없습니다.');
          return;
        }
        res.redirect('/purchase');
      }
    );
  },

  cart_process: (req, res) => {
    if (!requireCustomer(req, res)) {
      return;
    }

    const prodId = sanitizeHtml(req.body.prod_id || '');
    db.query('select count(*) as total from cart where loginid = ? and prod_id = ?', [loginid(req), prodId], (error, rows) => {
      if (error) {
        res.status(500).send('DB 오류: 장바구니를 확인할 수 없습니다.');
        return;
      }

      if (rows[0].total > 0) {
        alertAndMove(res, '이미 장바구니에 있는 상품입니다.', '/purchase/cart');
        return;
      }

      db.query('insert into cart(loginid, prod_id, date) values(?, ?, ?)', [loginid(req), prodId, today()], (insertError) => {
        if (insertError) {
          res.status(500).send('DB 오류: 장바구니에 담을 수 없습니다.');
          return;
        }
        res.redirect('/purchase/cart');
      });
    });
  },

  cart: (req, res) => {
    if (!requireCustomer(req, res)) {
      return;
    }

    db.query(
      `select c.*, pr.name, pr.price, pr.image
       from cart c inner join product pr on c.prod_id = pr.prod_id
       where c.loginid = ?
       order by c.cart_id desc`,
      [loginid(req)],
      (error, carts) => {
        if (error) {
          res.status(500).send('DB 오류: 장바구니를 조회할 수 없습니다.');
          return;
        }
        renderFrame(req, res, 'cart.ejs', { carts });
      }
    );
  },

  cartpurchase_process: (req, res) => {
    if (!requireCustomer(req, res)) {
      return;
    }

    const ids = selectedIds(req.body);
    if (ids.length === 0) {
      alertAndMove(res, '결재할 상품을 선택해 주세요.', '/purchase/cart');
      return;
    }

    let index = 0;
    const next = () => {
      if (index >= ids.length) {
        res.redirect('/purchase');
        return;
      }

      const cartId = ids[index];
      db.query('select * from cart where cart_id = ? and loginid = ?', [cartId, loginid(req)], (error, rows) => {
        if (error || rows.length === 0) {
          res.status(500).send('DB 오류: 장바구니 상품을 확인할 수 없습니다.');
          return;
        }

        const cart = rows[0];
        insertPurchase(loginid(req), cart.prod_id, req.body[`qty_${cartId}`], (purchaseError) => {
          if (purchaseError) {
            res.status(500).send('DB 오류: 구매 정보를 저장할 수 없습니다.');
            return;
          }

          db.query('delete from cart where cart_id = ? and loginid = ?', [cartId, loginid(req)], (deleteError) => {
            if (deleteError) {
              res.status(500).send('DB 오류: 장바구니 상품을 삭제할 수 없습니다.');
              return;
            }
            index += 1;
            next();
          });
        });
      });
    };
    next();
  },

  cartdelete_process: (req, res) => {
    if (!requireCustomer(req, res)) {
      return;
    }

    const ids = selectedIds(req.body);
    if (ids.length === 0) {
      alertAndMove(res, '삭제할 상품을 선택해 주세요.', '/purchase/cart');
      return;
    }

    db.query('delete from cart where loginid = ? and cart_id in (?)', [loginid(req), ids], (error) => {
      if (error) {
        res.status(500).send('DB 오류: 장바구니 상품을 삭제할 수 없습니다.');
        return;
      }
      res.redirect('/purchase/cart');
    });
  },

  cartview: (req, res) => {
    if (!requireManager(req, res)) {
      return;
    }

    db.query(
      `select c.*, pe.name as person_name, pr.name as product_name
       from cart c inner join person pe on c.loginid = pe.loginid
       inner join product pr on c.prod_id = pr.prod_id
       order by c.cart_id desc`,
      (error, carts) => {
        if (error) {
          res.status(500).send('DB 오류: cart 테이블을 조회할 수 없습니다.');
          return;
        }
        renderFrame(req, res, 'cartView.ejs', { carts });
      }
    );
  },

  cartupdate: (req, res) => {
    if (!requireManager(req, res)) {
      return;
    }

    db.query('select * from cart where cart_id = ?', [req.params.cartId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('수정할 장바구니 자료를 찾을 수 없습니다.');
        return;
      }

      loadPeopleAndProducts((loadError, results) => {
        if (loadError) {
          res.status(500).send('DB 오류: 고객과 상품 목록을 조회할 수 없습니다.');
          return;
        }
        renderFrame(req, res, 'cartU.ejs', {
          cart: rows[0],
          people: results[0],
          products: results[1]
        });
      });
    });
  },

  cartupdate_process: (req, res) => {
    if (!requireManager(req, res)) {
      return;
    }

    db.query(
      'update cart set loginid = ?, prod_id = ? where cart_id = ?',
      [req.body.loginid, req.body.prod_id, req.body.cart_id],
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: cart 테이블을 수정할 수 없습니다.');
          return;
        }
        res.redirect('/purchase/cart/view');
      }
    );
  },

  cartdelete_admin_process: (req, res) => {
    if (!requireManager(req, res)) {
      return;
    }

    db.query('delete from cart where cart_id = ?', [req.params.cartId], (error) => {
      if (error) {
        res.status(500).send('DB 오류: cart 테이블을 삭제할 수 없습니다.');
        return;
      }
      res.redirect('/purchase/cart/view');
    });
  },

  purchaseview: (req, res) => {
    if (!requireManager(req, res)) {
      return;
    }

    db.query(
      `select pu.*, pe.name as person_name, pr.name as product_name
       from purchase pu inner join person pe on pu.loginid = pe.loginid
       inner join product pr on pu.prod_id = pr.prod_id
       order by pu.purchase_id desc`,
      (error, purchases) => {
        if (error) {
          res.status(500).send('DB 오류: purchase 테이블을 조회할 수 없습니다.');
          return;
        }
        renderFrame(req, res, 'purchaseView.ejs', { purchases });
      }
    );
  },

  purchaseupdate: (req, res) => {
    if (!requireManager(req, res)) {
      return;
    }

    db.query('select * from purchase where purchase_id = ?', [req.params.purchaseId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('수정할 구매 자료를 찾을 수 없습니다.');
        return;
      }

      loadPeopleAndProducts((loadError, results) => {
        if (loadError) {
          res.status(500).send('DB 오류: 고객과 상품 목록을 조회할 수 없습니다.');
          return;
        }
        renderFrame(req, res, 'purchaseU.ejs', {
          purchase: rows[0],
          people: results[0],
          products: results[1]
        });
      });
    });
  },

  purchaseupdate_process: (req, res) => {
    if (!requireManager(req, res)) {
      return;
    }

    db.query(
      `update purchase
       set loginid = ?, prod_id = ?, price = ?, point = ?, qty = ?, total = ?, payYN = ?, cancel = ?
       where purchase_id = ?`,
      [
        req.body.loginid,
        req.body.prod_id,
        Number(req.body.price || 0),
        Number(req.body.point || 0),
        Number(req.body.qty || 0),
        Number(req.body.total || 0),
        req.body.payYN,
        req.body.cancel,
        req.body.purchase_id
      ],
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: purchase 테이블을 수정할 수 없습니다.');
          return;
        }
        res.redirect('/purchase/view');
      }
    );
  },

  purchasedelete_process: (req, res) => {
    if (!requireManager(req, res)) {
      return;
    }

    db.query('delete from purchase where purchase_id = ?', [req.params.purchaseId], (error) => {
      if (error) {
        res.status(500).send('DB 오류: purchase 테이블을 삭제할 수 없습니다.');
        return;
      }
      res.redirect('/purchase/view');
    });
  }
};
