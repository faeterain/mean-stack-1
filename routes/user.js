module.exports = (app, passport) => {
    app.get('/',function (req,res,next) {
        res.render('index', {title: 'Index || Rate Me'});
    });
    app.get('/api',function (req,res,next) {
        res.render('api', {title: 'API || Rate Me'});
    });
    app.get('/signup',function (req,res) {
        var err = req.flash('error');
        console.log(err);
        res.render('pages/signup', {title: 'Sign Up || Rate Me', messages: err, hasError: err.length>0});
    });
    app.post('/signup', validate, passport.authenticate('local.signup', {
        successRedirect: '/',
        failureRedirect: '/signup',
        failureFlash: true
    }));
    app.get('/login',function (req,res,next) {
        var err = req.flash('error');
        console.log(err);
        res.render('pages/login', {title: 'Sign Up || Rate Me', messages: err, hasError: err.length>0});
    });
    app.post('/login', loginValidate, passport.authenticate('local.login', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true
    }));
    app.get('/home',function (req,res,next) {
        res.render('pages/home', {title: 'Home || Rate Me'});
    });
}

function validate(req,res,next) {
    req.checkBody('fullname', 'Fullname is Required').notEmpty();
    req.checkBody('fullname', 'Fullname must not be less than 5').isLength({min:5});
    req.checkBody('email', 'Email is Required').notEmpty();
    req.checkBody('email', 'Email is Invalid').isEmail();
    req.checkBody('password', 'Password is Required').notEmpty();
    req.checkBody('password', 'Password must not be less than 5').isLength({min:5});
    req.check('password', 'Password must contain at least 1 number').matches(/^(?=.*\d)(?=.*[a-z])[0-9a-z]{5,}$/, "i");

    var errors = req.validationErrors();

    if(errors){
        var messages = [];
        errors.forEach((error)=>{
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/signup');
    }
    else{
        return next();
    }
}


function loginValidate(req,res,next) {
    req.checkBody('email', 'Email is Required').notEmpty();
    req.checkBody('email', 'Email is Invalid').isEmail();
    req.checkBody('password', 'Password is Required').notEmpty();

    var loginErrors = req.validationErrors();

    if(loginErrors){
        var messages = [];
        loginErrors.forEach((error)=>{
            messages.push(error.msg);
        });

        req.flash('error', messages);
        res.redirect('/login');
    }
    else{
        return next();
    }
}