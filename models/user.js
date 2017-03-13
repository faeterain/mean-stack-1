var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
    fullname: {type: String},
    email: {type: String},
    password: {type: String},
    role: {type: String, default: ''},
    company: {
        name: {type: String, default:''},
        image: {type: String, default:''},
    },
    passwordResetToken: {type: String, default: ''},
    passwordResetExpires: {type: Date, default: Date.now},
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }
})

userSchema.methods.encryptPassword = (password)=>{
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}


userSchema.methods.validPassword = (password)=>{
    return bcrypt.hashSync(password, this.password);
}

module.exports = mongoose.model('User', userSchema);