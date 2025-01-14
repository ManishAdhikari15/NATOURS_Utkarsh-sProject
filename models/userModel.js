const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, 'Please tell us your name!']
    },
    email: {
        type: String,
        require: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validator: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    password: {
        type: String,
        require: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        require: [true, 'Please confirm your password'],
        validate: {
            validator: function(el) {
            return el === this.password;
            },
            message: 'passwords are not the same!'
        }
    },
    passwordChangeAt: Date
});

userSchema.pre('save', async function(next) {
    // Only run this function if password was actualy modified
    if(!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordconfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangeAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    // false means NOT changed
    return false;
}

const User = mongoose.model('User', userSchema);

module.exports = User;