const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');
const router = new express.Router();


// Create User 
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save(); //once this promise filffed line below runs
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }
});

// Login user
router.post('/users/login', async (req, res) => {
    const email = req.body.email
    const password = req.body.password
    try {
        const user = await User.findByCredentials(email, password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send()
    }
})


// Logout user
router.post('/users/logout', auth, async (req, res) => {
    try {// from auth file
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token // from auth file
        })
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

// Logout All 
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        // req.user.tokens = req.user.tokens.filter(token => token.length = 0);
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})

// User Profile <== (Read All User)
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
    // try {
    //     const users = await User.find({}); // this already fillfud
    //     res.send(users);
    // } catch (error) {
    //     res.status(500).send(error);
    // }
})

// Read User By ID *** NO NEED 
router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findById(_id)
        if(!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch (error) {
        res.status(500).send(error)
    }
})

// Update User By ID
router.patch('/users/me', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    
    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid Operations'})
    }

    // const _id = req.user.id;
    try {

        // const user = await User.findById(_id);
        updates.forEach((update) => req.user[update] = req.body[update]); 
        await req.user.save()

        // line below bypass the malware so we replace by the above lines
        // const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
        // if (!user) {
        //     return res.status(404).send();
        // }
        res.send(req.user);
    } catch (error) {
        res.status(400).send(error);
    }
})

// Delete User By ID
router.delete('/users/me', auth, async (req, res) => {
    // const _id = req.user._id

    try {
        // const user = await User.findByIdAndDelete(_id);
        // if (!user) {
        //     return res.status(404).send()
        // }
        await req.user.remove()
        sendCancelationEmail(req.user.email, req.user.name)
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error)
    }
    
})


const upload = multer({
    // dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }
        cb(undefined, true)
    }
})

// Upload User Profile Pic
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})


// Delete User Profile Pic
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send()
})


// Viewing User Profile Pic by ID
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    } catch (error) {
        res.status(400).send()
    }
})

module.exports = router
