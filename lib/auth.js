const db = require('./db');
const sanitizeHtml = require('sanitize-html');
const authIsOwner = require('./authStatus');
const { renderFrame } = require('./viewUtil');

module.exports = {
  login: (req, res) => {
    renderFrame(req, res, 'login.ejs');
  },

  login_process: (req, res) => {
    const post = req.body;
    const sntzedLoginid = sanitizeHtml(post.loginid || '');
    const sntzedPassword = sanitizeHtml(post.password || '');

    db.query(
      'select count(*) as num from person where loginid = ? and password = ?',
      [sntzedLoginid, sntzedPassword],
      (error, results) => {
        if (error) {
          res.status(500).send('DB 오류: person 테이블과 MySQL 접속 정보를 확인하세요.');
          return;
        }

        if (results[0].num === 1) {
          db.query(
            'select name, class, loginid from person where loginid = ? and password = ?',
            [sntzedLoginid, sntzedPassword],
            (error2, result) => {
              if (error2) {
                res.status(500).send('DB 오류: 로그인 정보를 조회할 수 없습니다.');
                return;
              }

              req.session.is_logined = true;
              req.session.loginid = result[0].loginid;
              req.session.name = result[0].name;
              req.session.cls = result[0].class;
              req.session.save(() => {
                res.redirect('/');
              });
            }
          );
        } else {
          req.session.is_logined = false;
          req.session.name = 'Guest';
          req.session.cls = 'NON';
          req.session.save(() => {
            res.redirect('/');
          });
        }
      }
    );
  },

  logout_process: (req, res) => {
    req.session.destroy(() => {
      res.redirect('/');
    });
  },

  register: (req, res) => {
    const { login } = authIsOwner(req);

    if (login) {
      res.redirect('/');
      return;
    }

    renderFrame(req, res, 'personCU.ejs', {
      formAction: '/auth/register_process',
      mode: 'create',
      person: {},
      showClass: false
    });
  },

  register_process: (req, res) => {
    const post = req.body;
    const person = [
      sanitizeHtml(post.loginid || ''),
      sanitizeHtml(post.password || ''),
      sanitizeHtml(post.name || ''),
      sanitizeHtml(post.mf || 'm'),
      sanitizeHtml(post.address || ''),
      sanitizeHtml(post.tel || ''),
      sanitizeHtml(post.birth || ''),
      'CST'
    ];

    db.query(
      'insert into person(loginid, password, name, mf, address, tel, birth, class) values(?, ?, ?, ?, ?, ?, ?, ?)',
      person,
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 회원 가입 정보를 저장할 수 없습니다.');
          return;
        }
        res.redirect('/');
      }
    );
  }
};
