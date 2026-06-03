const sanitizeHtml = require('sanitize-html');
const db = require('./db');
const { renderFrame } = require('./viewUtil');

function alertAndMove(res, message, url) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<script>alert("${message}"); location.href="${url}";</script>`);
}

function currentDate() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function loginid(req) {
  return req.session.loginid || '';
}

function canWrite(req, boardtype) {
  const cls = req.session.cls || 'NON';
  return cls === 'MNG' || (cls === 'CST' && boardtype.write_YN === 'Y');
}

function canManage(req, board) {
  const cls = req.session.cls || 'NON';
  return cls === 'MNG' || (cls === 'CST' && board.loginid === loginid(req));
}

function requireManager(req, res) {
  if ((req.session.cls || 'NON') === 'MNG') {
    return true;
  }
  alertAndMove(res, '관리자만 사용할 수 있습니다.', '/');
  return false;
}

function replyCount(boardId, callback) {
  db.query('select count(*) as total from board where p_id = ?', [boardId], (error, rows) => {
    callback(error, rows && rows[0] ? rows[0].total : 0);
  });
}

module.exports = {
  typeview: (req, res) => {
    if (!requireManager(req, res)) return;

    db.query('select * from boardtype order by type_id', (error, boardtypes) => {
      if (error) {
        res.status(500).send('DB 오류: boardtype 테이블을 확인하세요.');
        return;
      }

      renderFrame(req, res, 'boardtype.ejs', { boardtypes });
    });
  },

  typecreate: (req, res) => {
    if (!requireManager(req, res)) return;

    renderFrame(req, res, 'boardtypeCU.ejs', {
      mode: 'create',
      boardtype: {},
      formAction: '/board/type/create_process'
    });
  },

  typecreate_process: (req, res) => {
    if (!requireManager(req, res)) return;

    const post = req.body;
    db.query(
      `insert into boardtype(title, description, write_YN, re_YN, numPerPage)
       values(?, ?, ?, ?, ?)`,
      [
        sanitizeHtml(post.title || ''),
        sanitizeHtml(post.description || ''),
        sanitizeHtml(post.write_YN || 'N'),
        sanitizeHtml(post.re_YN || 'N'),
        Number(post.numPerPage || 5)
      ],
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 게시판 종류를 추가할 수 없습니다.');
          return;
        }
        res.redirect('/board/type/view');
      }
    );
  },

  typeupdate: (req, res) => {
    if (!requireManager(req, res)) return;

    db.query('select * from boardtype where type_id = ?', [req.params.typeId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('수정할 게시판 종류를 찾을 수 없습니다.');
        return;
      }

      renderFrame(req, res, 'boardtypeCU.ejs', {
        mode: 'update',
        boardtype: rows[0],
        formAction: '/board/type/update_process'
      });
    });
  },

  typeupdate_process: (req, res) => {
    if (!requireManager(req, res)) return;

    const post = req.body;
    db.query(
      `update boardtype
       set title = ?, description = ?, write_YN = ?, re_YN = ?, numPerPage = ?
       where type_id = ?`,
      [
        sanitizeHtml(post.title || ''),
        sanitizeHtml(post.description || ''),
        sanitizeHtml(post.write_YN || 'N'),
        sanitizeHtml(post.re_YN || 'N'),
        Number(post.numPerPage || 5),
        post.type_id
      ],
      (error) => {
        if (error) {
          res.status(500).send('DB 오류: 게시판 종류를 수정할 수 없습니다.');
          return;
        }
        res.redirect('/board/type/view');
      }
    );
  },

  typedelete_process: (req, res) => {
    if (!requireManager(req, res)) return;

    db.query('select count(*) as total from board where type_id = ?', [req.params.typeId], (error, rows) => {
      if (error) {
        res.status(500).send('DB 오류: board 테이블을 확인하세요.');
        return;
      }

      if (rows[0].total > 0) {
        alertAndMove(res, '아직 보드에 게시글이 남아있어서 삭제할 수 없습니다. 게시글을 먼저 삭제하세요.', '/board/type/view');
        return;
      }

      db.query('delete from boardtype where type_id = ?', [req.params.typeId], (deleteError) => {
        if (deleteError) {
          res.status(500).send('DB 오류: 게시판 종류를 삭제할 수 없습니다.');
          return;
        }
        res.redirect('/board/type/view');
      });
    });
  },

  view: (req, res) => {
    const typeId = sanitizeHtml(req.params.typeId || '');
    const pNum = Number(req.params.pNum || 1);
    const sql = `select * from boardtype where type_id = ?;
                 select count(*) as total from board where type_id = ? and p_id = 0;`;

    db.query(sql, [typeId, typeId], (error, results) => {
      if (error || results[0].length === 0) {
        res.status(404).send('게시판 종류를 찾을 수 없습니다.');
        return;
      }

      const btname = results[0];
      const numPerPage = Number(btname[0].numPerPage || 5);
      const totalPages = Math.max(1, Math.ceil(results[1][0].total / numPerPage));
      const offs = (pNum - 1) * numPerPage;

      db.query(
        `select board_id
         from board
         where type_id = ? and p_id = 0
         order by board_id desc
         limit ? offset ?`,
        [typeId, numPerPage, offs],
        (parentError, parentBoards) => {
          if (parentError) {
            res.status(500).send('DB 오류: board 테이블을 확인하세요.');
            return;
          }

          if (parentBoards.length === 0) {
            renderFrame(req, res, 'board.ejs', {
              boards: [],
              btname,
              pNum,
              totalPages,
              canWrite: canWrite(req, btname[0]),
              sessionLoginid: loginid(req)
            });
            return;
          }

          const parentIds = parentBoards.map((board) => board.board_id);
          db.query(
            `select b.board_id, b.p_id, b.title, b.date, b.loginid, p.name
             from board b inner join person p on b.loginid = p.loginid
             where b.type_id = ? and (b.board_id in (?) or b.p_id in (?))
             order by case when b.p_id = 0 then b.board_id else b.p_id end desc,
                      b.board_id asc`,
            [typeId, parentIds, parentIds],
            (boardError, boards) => {
              if (boardError) {
                res.status(500).send('DB 오류: board 테이블을 확인하세요.');
                return;
              }

              renderFrame(req, res, 'board.ejs', {
                boards,
                btname,
                pNum,
                totalPages,
                canWrite: canWrite(req, btname[0]),
                sessionLoginid: loginid(req)
              });
            }
          );
        }
      );
    });
  },

  create: (req, res) => {
    db.query('select * from boardtype where type_id = ?', [req.params.typeId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('게시판 종류를 찾을 수 없습니다.');
        return;
      }

      if (!canWrite(req, rows[0])) {
        alertAndMove(res, '이 게시판에 글을 쓸 수 없습니다.', `/board/view/${req.params.typeId}/1`);
        return;
      }

      renderFrame(req, res, 'boardCRU.ejs', {
        mode: 'create',
        boardtype: rows[0],
        board: {},
        pNum: 1,
        sessionLoginid: loginid(req),
        formAction: '/board/create_process'
      });
    });
  },

  create_process: (req, res) => {
    const post = req.body;
    const writer = loginid(req);
    const typeId = sanitizeHtml(post.type_id || '');
    if (!writer) {
      alertAndMove(res, '로그인 후 글을 작성할 수 있습니다.', `/board/view/${typeId}/1`);
      return;
    }

    db.query('select * from boardtype where type_id = ?', [typeId], (typeError, rows) => {
      if (typeError || rows.length === 0) {
        res.status(404).send('게시판 종류를 찾을 수 없습니다.');
        return;
      }

      if (!canWrite(req, rows[0])) {
        alertAndMove(res, '이 게시판에 글을 쓸 수 없습니다.', `/board/view/${typeId}/1`);
        return;
      }

      db.query(
        `insert into board(type_id, p_id, loginid, password, title, date, content)
         values(?, 0, ?, ?, ?, ?, ?)`,
        [
          typeId,
          writer,
          sanitizeHtml(post.password || ''),
          sanitizeHtml(post.title || ''),
          currentDate(),
          sanitizeHtml(post.content || '')
        ],
        (error) => {
          if (error) {
            res.status(500).send('DB 오류: 게시글을 추가할 수 없습니다.');
            return;
          }
          res.redirect(`/board/view/${typeId}/1`);
        }
      );
    });
  },

  detail: (req, res) => {
    db.query(
      `select b.*, p.name, bt.re_YN
       from board b inner join person p on b.loginid = p.loginid
       inner join boardtype bt on b.type_id = bt.type_id
       where b.board_id = ?`,
      [req.params.boardId],
      (error, rows) => {
        if (error || rows.length === 0) {
          res.status(404).send('게시글을 찾을 수 없습니다.');
          return;
        }

        const board = rows[0];
        replyCount(board.board_id, (replyError, replies) => {
          if (replyError) {
            res.status(500).send('DB 오류: 답변 정보를 조회할 수 없습니다.');
            return;
          }

          renderFrame(req, res, 'boardCRU.ejs', {
            mode: 'detail',
            board,
            boardtype: { type_id: board.type_id, re_YN: board.re_YN },
            pNum: req.params.pNum,
            sessionLoginid: loginid(req),
            canReply: (req.session.cls || 'NON') === 'MNG' && board.re_YN === 'Y' && Number(board.p_id || 0) === 0 && replies === 0,
            formAction: ''
          });
        });
      }
    );
  },

  reply: (req, res) => {
    if (!requireManager(req, res)) return;

    db.query(
      `select b.*, p.name, bt.re_YN
       from board b inner join person p on b.loginid = p.loginid
       inner join boardtype bt on b.type_id = bt.type_id
       where b.board_id = ?`,
      [req.params.boardId],
      (error, rows) => {
        if (error || rows.length === 0) {
          res.status(404).send('답변할 게시글을 찾을 수 없습니다.');
          return;
        }

        const board = rows[0];
        if (board.re_YN !== 'Y' || Number(board.p_id || 0) !== 0) {
          alertAndMove(res, '답변을 작성할 수 없는 게시글입니다.', `/board/view/${board.type_id}/${req.params.pNum}`);
          return;
        }

        replyCount(board.board_id, (replyError, replies) => {
          if (replyError) {
            res.status(500).send('DB 오류: 답변 정보를 조회할 수 없습니다.');
            return;
          }

          if (replies > 0) {
            alertAndMove(res, '이미 답변이 작성된 게시글입니다.', `/board/detail/${board.board_id}/${req.params.pNum}`);
            return;
          }

          renderFrame(req, res, 'boardCRU.ejs', {
            mode: 'reply',
            board: {
              ...board,
              parent_board_id: board.board_id,
              title: `[답변] : ${board.title}`,
              content: ''
            },
            boardtype: { type_id: board.type_id, re_YN: board.re_YN },
            pNum: req.params.pNum,
            sessionLoginid: loginid(req),
            formAction: '/board/reply_process'
          });
        });
      }
    );
  },

  reply_process: (req, res) => {
    if (!requireManager(req, res)) return;

    const post = req.body;
    const parentId = sanitizeHtml(post.parent_board_id || '');
    db.query(
      `select b.*, bt.re_YN
       from board b inner join boardtype bt on b.type_id = bt.type_id
       where b.board_id = ?`,
      [parentId],
      (error, rows) => {
        if (error || rows.length === 0) {
          res.status(404).send('답변할 게시글을 찾을 수 없습니다.');
          return;
        }

        const parent = rows[0];
        if (parent.re_YN !== 'Y' || Number(parent.p_id || 0) !== 0) {
          alertAndMove(res, '답변을 작성할 수 없는 게시글입니다.', `/board/view/${post.type_id}/${post.pNum}`);
          return;
        }

        replyCount(parentId, (replyError, replies) => {
          if (replyError) {
            res.status(500).send('DB 오류: 답변 정보를 조회할 수 없습니다.');
            return;
          }

          if (replies > 0) {
            alertAndMove(res, '이미 답변이 작성된 게시글입니다.', `/board/detail/${parentId}/${post.pNum}`);
            return;
          }

          db.query(
            `insert into board(type_id, p_id, loginid, password, title, date, content)
             values(?, ?, ?, '', ?, ?, ?)`,
            [
              parent.type_id,
              parentId,
              loginid(req),
              sanitizeHtml(post.title || `[답변] : ${parent.title}`),
              currentDate(),
              sanitizeHtml(post.content || '')
            ],
            (insertError) => {
              if (insertError) {
                res.status(500).send('DB 오류: 답변을 저장할 수 없습니다.');
                return;
              }
              res.redirect(`/board/view/${parent.type_id}/${post.pNum}`);
            }
          );
        });
      }
    );
  },

  update: (req, res) => {
    db.query('select * from board where board_id = ?', [req.params.boardId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('수정할 게시글을 찾을 수 없습니다.');
        return;
      }

      if (!canManage(req, rows[0])) {
        alertAndMove(res, '본인이 작성한 게시물만 수정할 수 있습니다.', `/board/view/${req.params.typeId}/${req.params.pNum}`);
        return;
      }

      renderFrame(req, res, 'boardCRU.ejs', {
        mode: 'update',
        board: rows[0],
        boardtype: { type_id: req.params.typeId },
        pNum: req.params.pNum,
        sessionLoginid: loginid(req),
        formAction: '/board/update_process'
      });
    });
  },

  update_process: (req, res) => {
    const post = req.body;
    db.query('select * from board where board_id = ?', [post.board_id], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('수정할 게시글을 찾을 수 없습니다.');
        return;
      }

      const board = rows[0];
      if (!canManage(req, board)) {
        alertAndMove(res, '본인이 작성한 게시물만 수정할 수 있습니다.', `/board/view/${post.type_id}/${post.pNum}`);
        return;
      }

      if ((req.session.cls || 'NON') !== 'MNG' && board.password !== post.password) {
        alertAndMove(res, '비밀번호가 일치하지 않습니다.', `/board/update/${post.board_id}/${post.type_id}/${post.pNum}`);
        return;
      }

      db.query(
        'update board set title = ?, content = ? where board_id = ?',
        [sanitizeHtml(post.title || ''), sanitizeHtml(post.content || ''), post.board_id],
        (updateError) => {
          if (updateError) {
            res.status(500).send('DB 오류: 게시글을 수정할 수 없습니다.');
            return;
          }
          res.redirect(`/board/view/${post.type_id}/${post.pNum}`);
        }
      );
    });
  },

  delete_process: (req, res) => {
    const { boardId, typeId, pNum } = req.params;
    db.query('select * from board where board_id = ?', [boardId], (error, rows) => {
      if (error || rows.length === 0) {
        res.status(404).send('삭제할 게시글을 찾을 수 없습니다.');
        return;
      }

      if (!canManage(req, rows[0])) {
        alertAndMove(res, '본인이 작성한 게시물만 삭제할 수 있습니다.', `/board/view/${typeId}/${pNum}`);
        return;
      }

      db.query('delete from board where board_id = ? or p_id = ?', [boardId, boardId], (deleteError) => {
        if (deleteError) {
          res.status(500).send('DB 오류: 게시글을 삭제할 수 없습니다.');
          return;
        }
        res.redirect(`/board/view/${typeId}/${pNum}`);
      });
    });
  }
};
