const db = require('./db');
const sanitizeHtml = require('sanitize-html');
const { renderFrame } = require('./viewUtil');

const DB_NAME = 'webdb2026';

function requireClass(req, res, allowed) {
  const cls = req.session.cls || 'NON';
  if (allowed.includes(cls)) {
    return true;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<script>alert("사용 권한이 없습니다."); location.href="/";</script>');
  return false;
}

module.exports = {
  home: (req, res) => {
    db.query('select * from product order by prod_id desc', (error, products) => {
      if (error) {
        res.status(500).send('DB 오류: product 테이블을 확인하세요.');
        return;
      }

      renderFrame(req, res, 'product.ejs', {
        products,
        showControls: false
      });
    });
  },

  upload: (req, res) => {
    renderFrame(req, res, 'uploadtest.ejs');
  },

  categoryview: (req, res) => {
    const categ = req.params.categ || '';
    const [mainId = '', subId = ''] = categ.split(':');
    db.query(
      'select * from product where main_id = ? and sub_id = ? order by prod_id desc',
      [mainId, subId],
      (error, products) => {
        if (error) {
          res.status(500).send('DB 오류: product 테이블을 확인하세요.');
          return;
        }

        renderFrame(req, res, 'product.ejs', {
          products,
          showControls: false
        });
      }
    );
  },

  detail: (req, res) => {
    db.query('select * from product where prod_id = ?', [req.params.prodId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('상품을 찾을 수 없습니다.');
        return;
      }

      renderFrame(req, res, 'productDetail.ejs', {
        product: rows[0]
      });
    });
  },

  search: (req, res) => {
    const keyword = sanitizeHtml(req.body.search || '');
    const like = `%${keyword}%`;
    db.query(
      `select * from product
       where name like ? or brand like ? or supplier like ?
       order by prod_id desc`,
      [like, like, like],
      (error, products) => {
        if (error) {
          res.status(500).send('DB 오류: 상품 검색을 할 수 없습니다.');
          return;
        }

        renderFrame(req, res, 'product.ejs', {
          products,
          showControls: false
        });
      }
    );
  },

  tablecreate: (req, res) => {
    if (!requireClass(req, res, ['MNG'])) {
      return;
    }

    const fs = require('fs');
    const path = require('path');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    db.query(schema, (error) => {
      if (error) {
        res.status(500).send('DB 오류: schema.sql을 실행할 수 없습니다.');
        return;
      }
      res.redirect('/');
    });
  },

  tablemanage: (req, res) => {
    if (!requireClass(req, res, ['MNG'])) {
      return;
    }

    db.query(
      `select table_name, table_comment, table_rows, create_time, update_time
       from information_schema.tables
       where table_schema = ?
       order by table_name`,
      [DB_NAME],
      (error, tables) => {
        if (error) {
          res.status(500).send('DB 오류: 테이블 메타데이터를 조회할 수 없습니다.');
          return;
        }

        renderFrame(req, res, 'tableManage.ejs', { tables });
      }
    );
  },

  tableview: (req, res) => {
    if (!requireClass(req, res, ['MNG'])) {
      return;
    }

    const tableName = sanitizeHtml(req.params.tableName || '');
    db.query(
      `select table_name, table_comment
       from information_schema.tables
       where table_schema = ? and table_name = ?;
       select column_name, column_type, is_nullable, column_key, column_default,
              extra, column_comment
       from information_schema.columns
       where table_schema = ? and table_name = ?
       order by ordinal_position;
       select * from ?? limit 100`,
      [DB_NAME, tableName, DB_NAME, tableName, tableName],
      (error, results) => {
        if (error || results[0].length === 0) {
          res.status(404).send('DB 오류: 테이블 정보를 조회할 수 없습니다.');
          return;
        }

        renderFrame(req, res, 'tableView.ejs', {
          table: results[0][0],
          columns: results[1],
          rows: results[2]
        });
      }
    );
  },

  customeranal: (req, res) => {
    if (!requireClass(req, res, ['CEO'])) {
      return;
    }

    db.query(
      `select ifnull(nullif(address, ''), '미입력') as address,
              round((count(*) / (select count(*) from person)) * 100, 2) as rate
       from person
       group by ifnull(nullif(address, ''), '미입력')
       order by rate desc, address`,
      (error, percentage) => {
        if (error) {
          res.status(500).send('DB 오류: 지역별 고객 분포를 조회할 수 없습니다.');
          return;
        }

        renderFrame(req, res, 'customerAnal.ejs', { percentage });
      }
    );
  }
};
