// get an instance of the router for api routes
var jwt    = require('jsonwebtoken');



module.exports = (express,app) => {
    var apiRoutes = express.Router();


// route middleware to verify a token
    apiRoutes.use((req, res, next) => {

        // check header or url parameters or post parameters for token
        var token = req.body?req.body.token:'' || req.query.token || req.headers['x-access-token'] || '';
        // decode token
        if (token) {

            // verifies secret and checks exp
            jwt.verify(token, app.get('superSecret'), function (err, decoded) {
                if (err) {
                    return res.status(500).json({success: false, errors: 'Failed to authenticate token.'});
                } else {
                    // if everything is good, save to request for use in other routes
                    req.decoded = decoded;
                    next();
                }
            });

        } else {

            // if there is no token
            // return an error
            return res.status(403).send({
                success: false,
                errors: 'No token provided.'
            });

        }
    });
    app.use('/token/users',apiRoutes);
}
