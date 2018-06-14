


const express = require('express');
const passport = require('passport');
//Facebook
const fbStrategy = require('passport-facebook').Strategy;
//Local Login
var loStrategy = require('passport-local').Strategy;
var db = require('./db');

//Facebook
//'http://localhost:3000/login/facebook/return'
passport.use(new fbStrategy({
    clientID: "202065647087620",
    clientSecret: "77c213b28e805272002ed465854d3cca",
    callbackURL: "https://prj2userauth.herokuapp.com/"
  },
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
  })
);

//Local Login
passport.use(new loStrategy(
    function(username, password, cb) {
      db.users.findByUsername(username, function(err, user) {
        if (err) { return cb(err); }
        if (!user) { return cb(null, false); }
        if (user.password != password) { return cb(null, false); }
        return cb(null, user);
      });
    })
);

//Configure Passport authenticated session persistence.
passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});
  
passport.deserializeUser(function(id, cb) {
    db.users.findById(id, function (err, user) {
      if (err) { return cb(err); }
      cb(null, user);
    });
});

// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get('/',
function(req, res) {
  res.render('home', { user: req.user });
});

app.get('/login', passport.authenticate(['local', 'loStrategy', 'fbStrategy']),
function(req, res){
  res.render('login');
});

app.get('/login/facebook',
passport.authenticate('facebook'));

app.get('/login/facebook/return', 
passport.authenticate('facebook', { failureRedirect: '/login' }),
function(req, res) {
  res.redirect('/');
});

app.post('/login', 
passport.authenticate('local', { failureRedirect: '/login' }),
function(req, res) {
  res.redirect('/');
});

app.get('/logout',
function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/profile',
require('connect-ensure-login').ensureLoggedIn(),
function(req, res){
  res.render('profile', { user: req.user });
});

app.listen(3000);