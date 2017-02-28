var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');
var secret = require('../secret/secret');

module.exports = (app, passport) => {
    app.get('/', function (req, res, next) {
        res.render('index', {title: 'Index || Rate Me'});
    });
    app.get('/api', function (req, res, next) {
        res.render('api', {title: 'API || Rate Me'});
    });
    app.get('/signup', function (req, res) {
        var err = req.flash('error');
        console.log(err);
        res.render('user/signup', {title: 'Sign Up || Rate Me', messages: err, hasError: err.length > 0});
    });
    app.post('/signup', validate, passport.authenticate('local.signup', {
        successRedirect: '/',
        failureRedirect: '/signup',
        failureFlash: true
    }));
    app.get('/login', function (req, res, next) {
        var err = req.flash('error');
        console.log(err);
        res.render('user/login', {title: 'Sign Up || Rate Me', messages: err, hasError: err.length > 0});
    });
    app.post('/login', loginValidate, passport.authenticate('local.login', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true
    }));
    app.get('/home', function (req, res, next) {
        res.render('pages/home', {title: 'Home || Rate Me'});
    });
    app.get('/forgot', (req, res)=> {
        var err = req.flash('error');
        var info = req.flash('info');
        res.render('user/forgot', {title: 'Request Password Reset', messages: err, hasError: err.length > 0,
            info: info, noError: info.length > 0});
    })

    app.post('/forgot', (req, res, next)=> {
        async.waterfall([
            (callback)=> {
                crypto.randomBytes(20, (err, buf)=> {
                    var rand = buf.toString('hex');
                    callback(err, rand);
                });
            },
            (rand, callback)=> {
                console.log(req.body.email);
                User.findOne({'email': req.body.email}, (err, user)=> {
                    if (!user) {
                        req.flash('error', 'No Account with that exist or Email is Invalid');
                        return res.redirect('/forgot');
                    }

                    user.passwordResetToken = rand;
                    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;

                    user.save((err)=> {
                        callback(err, rand, user);
                    });

                });
            },

            (rand, user, callback)=> {
                console.log(12);
                console.log(user);
                // var smtpTransport = nodemailer.createTransport({
                //     service: 'Gmail',
                //     auth: {
                //         user: secret.auth.user,
                //         pass: secret.auth.pass
                //     }
                // });

                var smtpTransport = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    secureConnection: false,
                    port: 465,
                    requiresAuth: true,
                    domains: ["gmail.com", "googlemail.com"],
                    auth: {
                        user: secret.auth.user,
                        pass: secret.auth.pass
                    }
                });
                console.log(4);

                var mailOptions = {
                    to: user.email,
                    from: 'RateMe ' + '<' + secret.auth.user + '>',
                    subject: 'RateMe Application Password Reset Token',
                    text: 'You have requested for password reset token. \n\n' +
                    'Please click on the link to complete the process: \n\n' +
                    'http://localhost:3000/reset/' + rand + '\n\n',

                };

                smtpTransport.sendMail(mailOptions, (err, res)=> {

                    console.log('err');
                    console.log(err);
                    console.log(user.email);
                    req.flash('info', 'A password reset token has been send to ' + user.email);
                    return callback(err, user);
                });

            }
        ],
        (err)=>{
            console.log(123);
            console.log(err);
            if(err){
                return next(err);
            }

            res.redirect('/forgot');
        });
    })

}


function validate(req, res, next) {
    req.checkBody('fullname', 'Fullname is Required').notEmpty();
    req.checkBody('fullname', 'Fullname must not be less than 5').isLength({min: 5});
    req.checkBody('email', 'Email is Required').notEmpty();
    req.checkBody('email', 'Email is Invalid').isEmail();
    req.checkBody('password', 'Password is Required').notEmpty();
    req.checkBody('password', 'Password must not be less than 5').isLength({min: 5});
    req.check('password', 'Password must contain at least 1 number').matches(/^(?=.*\d)(?=.*[a-z])[0-9a-z]{5,}$/, "i");

    var errors = req.validationErrors();

    if (errors) {
        var messages = [];
        errors.forEach((error)=> {
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/signup');
    }
    else {
        return next();
    }
}


function loginValidate(req, res, next) {
    req.checkBody('email', 'Email is Required').notEmpty();
    req.checkBody('email', 'Email is Invalid').isEmail();
    req.checkBody('password', 'Password is Required').notEmpty();

    var loginErrors = req.validationErrors();

    if (loginErrors) {
        var messages = [];
        loginErrors.forEach((error)=> {
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/login');
    }
    else {
        return next();
    }
}