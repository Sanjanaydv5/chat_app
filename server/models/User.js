const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    phoneNumber: {type:String, unique:true,sparse:true},
    phoneSuffix: {type:String, unique:true,sparse:false},
    username: {type:String},
    email: {type:String, unique:true,sparse:true,lowercase:true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`,
        },
    },
    emailOtp: {type:String},
    emailOtpExpiry: {type:Date},
    profilePicture: {type:String},
    about: {type:String, default:"Hey there! I am using ChatApp."},
    lastSeen: {type:Date, default:Date.now},
    isOnline: {type:Boolean, default:false},
    isVerified: {type:Boolean, default:false},
    agreed: {type:Boolean, default:false},
}, {timestamps:true});


const User = mongoose.model('User', userSchema);

module.exports = User;