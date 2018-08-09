var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var session = require('express-session');
var bodyParser = require('body-parser');
var dotenv = require('dotenv').config();
var db = require('./config/database');
var bcrypt = require('bcrypt-nodejs');
var flash    = require('connect-flash');
// Here we initialize our app and all the plugins we need. We use passport for checking login and to create sessions
var app = express();

app.use(flash());
// Body parser base settings. 
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Setup session secret
// required for passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));

// Call the passport config file and pass the passport instance to it.
//Passport configuration file is in the config folder
require('./config/passport')(passport); 

// Initialize passport
app.use(passport.initialize());

// Set up passport for a persistent session when logged in
app.use(passport.session());

// set the view engine to ejs
//ejs engine sends data to views
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(cookieParser());
// Set the static path where all our js/css/images will be stored
app.use(express.static(path.join(__dirname, 'public')));


// Handling global errors and logging to console.
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send(err);
  });
  // Call the routes file 
 require('./routes/index')(app, passport);

//Export the app
module.exports = app;
