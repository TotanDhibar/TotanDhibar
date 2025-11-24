// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/admin/login');
}

// Middleware to redirect if already logged in
function requireGuest(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  next();
}

module.exports = {
  requireAuth,
  requireGuest
};
