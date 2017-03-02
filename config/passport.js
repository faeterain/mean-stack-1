var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

passport.use('local.login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, (req, email, password, done) => {
        console.log(1);
        User.findOne({'email': email}, (err, user) => {
            if(err){
                return done(err);
            }

            var msg = [];
            if(!user || !user.validPassword(password)){
                msg.push('Email Does Not Exist Or Password is Invalid.');
                return done(null,false, req.flash('error', msg));
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
        if(err){
            return done(err);
        }
        if(user){
            return done(null,false, req.flash('error', 'User with email already exist.'));
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