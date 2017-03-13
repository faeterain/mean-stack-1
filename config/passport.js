var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var OAuth2Strategy = require('passport-oauth2').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var TokenStrategy = require('passport-token-auth').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var User = require('../models/user');
var configAuth = require('../secret/oauth');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});
passport.use(new BearerStrategy(
    function(token, cb) {
        User.findOne({ 'google.token' : token }, function(err, user) {
            if (err) { return cb(err); }
            if (!user) { return cb(null, false); }
            return cb(null, user);
        });
    }));


passport.use(new TokenStrategy(
    function(token, done) {
        User.findOne({ 'google.token' : token }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            return done(null, user, { scope: 'all' });
        });
    }
));

passport.use(new GoogleStrategy({

        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL,
        passReqToCallback : true
        // callbackURL: "https://www.getpostman.com/oauth2/callback",

    },
    function (req, token, refreshToken, profile, done) {

        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function () {
            if (!req.user) {
                // try to find the user based on their google id
                User.findOne({'google.id': profile.id}, function (err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.google.token) {
                            user.google.token = token;
                            user.google.name  = profile.displayName;
                            user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                            user.save(function(err) {
                                if (err)
                                    return done(err);

                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        // if the user isnt in our database, create a new user
                        var newUser = new User();

                        // set all of the relevant information
                        newUser.google.id = profile.id;
                        newUser.google.token = token;
                        newUser.google.name = profile.displayName;
                        newUser.google.email = profile.emails[0].value; // pull the first email

                        // save the user
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });

            }
            else {
                // user already exists and is logged in, we have to link accounts
                var user               = req.user; // pull the user out of the session

                user.google.id    = profile.id;
                user.google.token = token;
                user.google.name  = profile.displayName;
                user.google.email = (profile.emails[0].value || '').toLowerCase(); // pull the first email

                user.save(function(err) {
                    if (err)
                        return done(err);

                    return done(null, user);
                });

            }
        });

    }));


passport.use('local.login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => {
    User.findOne({'email': email}, (err, user) => {
        if (err) {
            return done(err);
        }

        var msg = [];
        if (!user || !user.validPassword(password)) {
            msg.push('Email Does Not Exist Or Password is Invalid.');
            return done(null, false, req.flash('error', msg));
        }

        return done(null, user);
    })
}));


passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => {
    User.findOne({'email': email}, (err, user) => {
        if (err) {
            return done(err);
        }
        if (user) {
            return done(null, false, req.flash('error', 'User with email already exist.'));
        }
        var newUser = new User();
        newUser.fullname = req.body.fullname;
        newUser.email = req.body.email;

        console.log(req.body);
        newUser.password = newUser.encryptPassword(req.body.password);

        newUser.save((err) => {
            return done(null, newUser);
        });
    })
}));

passport.use(new BasicStrategy(
    function(email, password, done) {
        User.findOne({ email: email }, function (err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!user.encryptPassword(password)) {
                return done(null, false);
            }
            return done(null, user);
        });
    }
));
