var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var async = require('async');
var crypto = require('crypto');
var User = require('../models/user');
var secret = require('../secret/secret');
var jwt    = require('jsonwebtoken');

module.exports = (app, passport) => {
    app.get('/', function (req, res, next) {
        res.render('index', {title: 'Index || Rate Me'});
    });
    app.post('/authenticate', (req, res) => {

        User.findOne({
            email: req.body.email || req.body.username
        }, function(err, user) {

            if (err)
                res.status(500).json({'errors': err});

            if (!user) {
                res.status(400).json({ success: false, 'errors': 'Authentication failed. User not found.' });
            } else if (user) {

                // check if password matches
                if (!user.validPassword(req.body.password)) {
                    res.status(400).json({ success: false, message: 'Authentication failed. Wrong password.' });
                } else {

                    // if user is found and password is right
                    // create a token
                    var token = jwt.sign(user, app.get('superSecret'), {
                        expiresIn : 1440 // expires in 24 hours
                    });

                    // return the information including token as JSON
                    res.status(200).json({
                        success: true,
                        message: 'Enjoy your token!',
                        token: token
                    });
                }

            }

        });
    });
    app.get('/api', function (req, res, next) {
        res.render('api', {title: 'API || Rate Me'});
    });
    app.get('/users', function (req, res, next) {
        User.find({}, (err, users) => {
            if (err)
                res.status(500).json({'errors': err});

            res.status(200).json(users);
        });
    });
    app.get('/users/:id', (req, res) => {
        User.findById(req.params.id, (err, users) => {
            if (err)
                res.status(500).json({'errors': err});

            res.status(200).json(users);
        });
    });
    app.put('/users/:id', updateValidate, (req, res) => {
        User.findById(req.params.id, (err, users) => {
            if (err)
                res.status(500).json({'errors': err});
            users.fullname = req.body.fullname;  // update the bears info
            users.password = users.encryptPassword(req.body.password);  // update the bears info


            users.save(function (err) {
                if (err)
                    res.status(400).json({'errors': err});

                res.status(200).json({message: 'User updated!'});
            });
        });
    });
    app.delete('/users/:id', (req, res) => {
        User.remove({
            _id: req.params.id
        }, function (err, users) {
            if (err)
                res.status(400).json({'errors': err});

            res.status(200).json({message: 'Successfully deleted'});
        });
    });


    app.get('/signup', (req, res) => {
        var err = req.flash('error');
        var data = {
            title: 'Sign Up || Rate Me',
            errors: err,
            hasError: err.length > 0
        };
        // res.json(data);
        res.render('user/signup', data);
    });
    app.post('/signup', validate, (req, res, next) => {
        passport.authenticate('local.signup', function (err, user, info) {
            if (err) {
                return res.status(500).json({'errors': err});
            }
            if (!user) {
                return res.status(401).json({'errors': 'Email Does Not Exist Or Password is Invalid.'});
            }
            res.status(201).json({
                message: 'User created successfully'
            });
        })(req, res, next);
    });
    app.get('/login', function (req, res, next) {
        var err = req.flash('error');
        var data = {
            title: 'Login || Rate Me',
            errors: err,
            hasError: err.length > 0
        };
        // res.json(data);
        res.render('user/login', data);
    });
    app.post('/login', loginValidate, (req, res, next) => {
        passport.authenticate('local.login', function (err, user, info) {
            if (err) {
                return res.status(500).json({'errors': err});
            }
            if (!user) {
                return res.status(401).json({'errors': req.flash('error')});
            }
            res.status(200).json({
                message: 'Login successfully'
            });
        })(req, res, next);
    });
    app.get('/home', function (req, res, next) {
        res.render('pages/home', {title: 'Home || Rate Me'});
    });
    app.get('/forgot', (req, res) => {
        var err = req.flash('error');
        var info = req.flash('info');
        var data = {
            title: 'Request Password Reset',
            messages: err,
            hasError: err.length > 0,
            info: info,
            noError: info.length > 0
        };
        res.render('user/forgot', data);
    });

    app.post('/forgot', (req, res, next) => {
        async.waterfall([
                (callback) => {
                    crypto.randomBytes(20, (err, buf) => {
                        var rand = buf.toString('hex');
                        callback(err, rand);
                    });
                },
                (rand, callback) => {
                    console.log(req.body.email);
                    User.findOne({'email': req.body.email}, (err, user) => {
                        if (!user) {
                            req.flash('error', 'No Account with that exist or Email is Invalid');
                            return res.redirect('/forgot');
                        }

                        user.passwordResetToken = rand;
                        user.passwordResetExpires = Date.now() + 60 * 60 * 1000;

                        user.save((err) => {
                            callback(err, rand, user);
                        });

                    });
                },

                (rand, user, callback) => {
                    // var smtpTransport = nodemailer.createTransport({
                    //     service: 'Outlook',
                    //     auth: {
                    //         user: secret.auth.user,
                    //         pass: secret.auth.pass
                    //     }
                    // });

                    // var smtpTransport = nodemailer.createTransport({
                    //     host: "smtp.gmail.com",
                    //     secureConnection: false,
                    //     port: 465,
                    //     requiresAuth: true,
                    //     domains: ["gmail.com", "googlemail.com"],
                    //     auth: {
                    //         user: secret.auth.user,
                    //         pass: secret.auth.pass
                    //     }
                    // });
                    //
                    //
                    var smtpTransport = nodemailer.createTransport({
                        host: "smtp-mail.outlook.com", // hostname
                        secureConnection: false, // TLS requires secureConnection to be false
                        port: 587, // port for secure SMTP
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

                    smtpTransport.sendMail(mailOptions, (err, res) => {

                        console.log('err');
                        console.log(err);
                        console.log(user.email);
                        req.flash('info', 'A password reset token has been send to ' + user.email);
                        return callback(err, user);
                    });

                }
            ],
            (err) => {
                console.log(123);
                console.log(err);
                if (err) {
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
    req.checkBody('password', 'Password must not be less than 5').isLength({min: 8});

    var errors = req.validationErrors();

    if (errors) {
        var messages = [];
        errors.forEach((error) => {
            messages.push(error.msg);
        });

        res.status(400).json({'errors': messages});
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
        loginErrors.forEach((error) => {
            messages.push(error.msg);
        });

        res.status(400).json({'errors': messages});
    }
    else {
        return next();
    }
}

function updateValidate(req, res, next) {
    req.checkBody('fullname', 'Fullname is Required').notEmpty();
    req.checkBody('fullname', 'Fullname must not be less than 5').isLength({min: 5});
    req.checkBody('password', 'Password is Required').notEmpty();
    req.checkBody('password', 'Password must not be less than 5').isLength({min: 8});

    var updateErrors = req.validationErrors();

    if (updateErrors) {
        var messages = [];
        updateErrors.forEach((error) => {
            messages.push(error.msg);
        });

        res.status(400).json({'errors': messages});
    }
    else {
        return next();
    }
}