const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth')
const router = new express.Router();


// Create Task 
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body);
    const task = new Task({ 
        ...req.body,
        author: req.user._id
    })

    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
})


// Read All Tasks for user By Author ID
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:asc/desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        // const tasks = await Task.find({ author: req.user._id }); // same as below
        await req.user.populate({
            path: 'userTasks',
            match, // flitering the data
            options: {
                limit: parseInt(req.query.limit), // limit the result per page
                skip: parseInt(req.query.skip), // skip to any # of result
                sort // sorting data
            }
        }).execPopulate()
        res.send(req.user.userTasks);
    } catch (error) {
        res.status(500).send(error);
    }
})


// Read Task By ID & Author ID
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        // const task = await Task.findById(_id);
        const task = await Task.findOne({ _id, author: req.user._id })

        if(!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
})

// Update Task By ID
router.patch('/tasks/:id', auth, async (req, res) => {
    
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid Operations'})
    }
    
    const _id = req.params.id
    try {
        // const task = await Task.findById(_id);
        const task = await Task.findOne({ _id, author: req.user._id });
        
        // const task = await Task.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true });
        if (!task) {
            return res.status(404).send();
        }

        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        res.send(task);
        
    } catch (error) {
        res.status(500).send(error);
    }
})

// Delete Task By ID
router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        // const task = await Task.findByIdAndDelete(_id);
        const task = await Task.findOneAndDelete({ _id, author: req.user._id});
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
})


module.exports = router