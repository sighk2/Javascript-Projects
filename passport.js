//  Setup the passport strategy here. This will check for user when a user wants to login
// There are functions that help to get user information from and to the passport session

var bcrypt = require('bcrypt-nodejs');
var connection = require('./database');
var LocalStrategy   = require('passport-local').Strategy;

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        return done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        connection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
           return  done(err, rows[0]);
        });
    });
    // Strategy for login
    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      } , (req, email, pass, done) => {
            //  Check if both username and password are present
            if (!email || !pass ) {
                 return done(null, false, req.flash('error', 'All fields are required.'));
            }
            //  Query the database for the email provided by the user
            connection.query("select id, email, password from users where email = ?", [email], (err, row) => {
                if (err) {
                    return done(err);
                }
                //  Check if any results are returned
                if (!row.length) {
                  return done(null, false, req.flash('error', 'Invalid username or password.'));
                }
                //  Check password using bcrypt
                bcrypt.compare(pass, row[0].password, (err, res) => {
                    if (err) {
                        return done(req.flash('message',err));
                    }
                    if (!res) {
                        return done(null, false, req.flash('error', 'Invalid username or password.'));
                    }
                    return done(null, row[0]);
                });     
            });
          }
    ));
};