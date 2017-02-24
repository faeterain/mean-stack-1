module.exports = (app) => {
    app.get('/',function (req,res,next) {
        res.render('index', {title: 'Index || Rate Me'});
    });
    app.get('/api',function (req,res,next) {
        res.render('api', {title: 'API || Rate Me'});
    });
    app.get('/signup',function (req,res,next) {
        res.render('pages/signup', {title: 'Sign Up || Rate Me'});
    });
    app.get('/login',function (req,res,next) {
        res.render('pages/login', {title: 'Login || Rate Me'});
    });
}