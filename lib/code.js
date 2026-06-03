const db = require('./db');
const { renderFrame } = require('./viewUtil');

module.exports = {
  view: (req, res) => {
    db.query('select * from code order by main_id, sub_id, start', (error, codes) => {
      if (error) {
        res.status(500).send('DB 오류: code 테이블을 확인하세요.');
        return;
      }

      renderFrame(req, res, 'code.ejs', { codes });
    });
  },

  create: (req, res) => {
    renderFrame(req, res, 'codeCU.ejs', {
      mode: 'create',
      code: {},
      formAction: '/code/create_process'
    });
  },

  create_process: (req, res) => {
    const post = req.body;
    const values = [
      post.main_id,
      post.sub_id,
      post.main_name,
      post.sub_name,
      post.start,
      post.end
    ];

    db.query(
      'insert into code(main_id, sub_id, main_name, sub_name, start, end) values(?, ?, ?, ?, ?, ?)',
      values,
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 코드를 추가할 수 없습니다.');
          return;
        }
        res.redirect('/code/view');
      }
    );
  },

  update: (req, res) => {
    const { main, sub, start } = req.params;
    db.query(
      'select * from code where main_id = ? and sub_id = ? and start = ?',
      [main, sub, start],
      (error, rows) => {
        if (error || rows.length === 0) {
          res.status(404).send('수정할 코드를 찾을 수 없습니다.');
          return;
        }

        renderFrame(req, res, 'codeCU.ejs', {
          mode: 'update',
          code: rows[0],
          formAction: '/code/update_process',
          original: rows[0]
        });
      }
    );
  },

  update_process: (req, res) => {
    const post = req.body;
    db.query(
      `update code
       set main_id = ?, sub_id = ?, main_name = ?, sub_name = ?, start = ?, end = ?
       where main_id = ? and sub_id = ? and start = ?`,
      [
        post.main_id,
        post.sub_id,
        post.main_name,
        post.sub_name,
        post.start,
        post.end,
        post.original_main_id,
        post.original_sub_id,
        post.original_start
      ],
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 코드를 수정할 수 없습니다.');
          return;
        }
        res.redirect('/code/view');
      }
    );
  },

  delete_process: (req, res) => {
    const { main, sub, start } = req.params;
    db.query(
      'delete from code where main_id = ? and sub_id = ? and start = ?',
      [main, sub, start],
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 코드를 삭제할 수 없습니다.');
          return;
        }
        res.redirect('/code/view');
      }
    );
  }
};
