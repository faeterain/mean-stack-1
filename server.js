var express= require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var ejs = require('ejs');
var engine = require('ejs-mate');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var flash = require('connect-flash');
var logger = require('morgan');
var methodOverride = require('method-override');
var errorHandler = require('errorhandler');


var app = express();

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/rateme');

require('./config/passport');
require('./secret/authenticate')(express,app);
var secret = require('./secret/secret');

app.use(logger({ format: 'dev', immediate: true }));
app.set('superSecret', secret.secret);
app.use(express.static('public'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(function(req, res, next){
    if(req.session){
        var err = req.session.error,
            msg = req.session.notice,
            success = req.session.success;

        delete req.session.error;
        delete req.session.success;
        delete req.session.notice;
        if (err) res.locals.error = err;
        if (msg) res.locals.notice = msg;
        if (success) res.locals.success = success;
    }

    next();
});

/* method-override - https://github.com/expressjs/method-override
 Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it. */
app.use(methodOverride());
/* errorhandler - https://github.com/expressjs/errorhandler
 Show errors in development. */
app.use(errorHandler({ dumpExceptions: true, showStack: true }));


app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(session({
    secret: 'teskey',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use(validator());

require('./routes/user')(app, passport);

app.listen(3000, function () {
    console.log(('Listening on port 3000'));
});