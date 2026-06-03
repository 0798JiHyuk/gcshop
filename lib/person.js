const db = require('./db');
const { renderFrame } = require('./viewUtil');

module.exports = {
  view: (req, res) => {
    db.query('select * from person order by loginid', (error, persons) => {
      if (error) {
        res.status(500).send('DB 오류: person 테이블을 확인하세요.');
        return;
      }

      renderFrame(req, res, 'person.ejs', { persons });
    });
  },

  create: (req, res) => {
    renderFrame(req, res, 'personCU.ejs', {
      mode: 'create',
      person: {},
      formAction: '/person/create_process',
      showClass: true
    });
  },

  create_process: (req, res) => {
    const post = req.body;
    const values = [
      post.loginid,
      post.password,
      post.name,
      post.mf || 'm',
      post.address,
      post.tel,
      post.birth,
      post.class || 'CST'
    ];

    db.query(
      'insert into person(loginid, password, name, mf, address, tel, birth, class) values(?, ?, ?, ?, ?, ?, ?, ?)',
      values,
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 고객을 추가할 수 없습니다.');
          return;
        }
        res.redirect('/person/view');
      }
    );
  },

  update: (req, res) => {
    db.query('select * from person where loginid = ?', [req.params.loginId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('수정할 고객을 찾을 수 없습니다.');
        return;
      }

      renderFrame(req, res, 'personCU.ejs', {
        mode: 'update',
        person: rows[0],
        formAction: '/person/update_process',
        showClass: true
      });
    });
  },

  update_process: (req, res) => {
    const post = req.body;
    db.query(
      `update person
       set password = ?, name = ?, mf = ?, address = ?, tel = ?, birth = ?, class = ?
       where loginid = ?`,
      [
        post.password,
        post.name,
        post.mf || 'm',
        post.address,
        post.tel,
        post.birth,
        post.class || 'CST',
        post.loginid
      ],
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 고객을 수정할 수 없습니다.');
          return;
        }
        res.redirect('/person/view');
      }
    );
  },

  delete_process: (req, res) => {
    db.query('delete from person where loginid = ?', [req.params.loginId], (error) => {
      if (error) {
        res.status(500).send('DB 오류: 고객을 삭제할 수 없습니다.');
        return;
      }
      res.redirect('/person/view');
    });
  }
};
