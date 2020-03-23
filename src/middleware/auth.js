const jwt = require('jsonwebtoken');
const User = require('../models/user');


const auth = async (req, res ,next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', ''); //remove bearer and space to get just the token itself
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token});

        if(!user) {
            throw new Error()// didnot add anything to throw the below error
        }
        req.token = token
        req.user = user // instead of letting the handler fetcing again to save time and sources
        next()
    } catch (error) {
        res.status(401).send({ error: 'Please authenticate' })
    }

}


module.exports = auth