const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }, 
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('password CONNOT contains the word *password*')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be postive number')
            }
        }
    }, 
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

// virtual data for the tasks, how to figure out how these two things relate
userSchema.virtual('userTasks', {
    ref: 'Task',
    localField: '_id', // user ID that assoicate it with task
    foreignField: 'author' // name of the given in Task field that assoiacate the user
})

// Hide the data such as password and tokens
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}


// methods :: insatce methods b/c we define method in user router file
userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat({ token });
    await user.save()
    return token
}

// statics :: model methods
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if(!user) {
        throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Unable to login');
    }

    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function(next) { // pre before event OR post after event
    const user = this

    if (user.isModified('password')) { // check if the password changed
        user.password = await bcrypt.hash(user.password, 8);
    }

    next()
});

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ author: user._id })
    next()
})


const User = mongoose.model('User', userSchema);

module.exports = User