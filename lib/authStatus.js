function authIsOwner(req) {
  let name = 'Guest';
  let login = false;
  let cls = 'NON';

  if (req.session.is_logined) {
    name = req.session.name;
    login = true;
    cls = req.session.cls;
  }

  return { name, login, cls };
}

module.exports = authIsOwner;
