const authIsOwner = require('./authStatus');
const db = require('./db');

function frameContext(req, body, extra = {}) {
  const { login, name, cls } = authIsOwner(req);
  return {
    who: name,
    login,
    cls,
    body,
    ...extra
  };
}

function renderFrame(req, res, body, extra = {}) {
  db.query('select * from boardtype order by type_id; select * from code order by main_id, sub_id, start', (error, results) => {
    const boardtypes = error ? [] : results[0];
    const categories = error ? [] : results[1];
    const context = frameContext(req, body, {
      boardtypes,
      categories,
      ...extra
    });

    req.app.render('mainFrame', context, (err, html) => {
      if (err) {
        res.status(500).send(err.message);
        return;
      }
      res.end(html);
    });
  });
}

module.exports = {
  frameContext,
  renderFrame
};
