var EventModel = require('../models/eventModel.js');

/**
 * eventController.js
 *
 * @description :: Server-side logic for managing events.
 */
module.exports = {

    /**
     * eventController.list()
     */
    list: async function (req, res) {

        try {
        const events=await EventModel.find();
            if (!events) {
                return res.status(404).json({
                    message: 'No events'
                });
            }

            return res.json(events);
        
        } catch (err) {
            return res.status(500).json({
                message: 'Error when getting events.',
                error: err.message || err
            });
        }
    },

    /**
     * eventController.show()
     */
    show: async function (req, res) {
        const id = req.params.id;

        try {
            const event = await EventModel.findOne({ _id: id });

            if (!event) {
                return res.status(404).json({
                    message: 'No such event'
                });
            }

            return res.json(event);
        } catch (err) {
            return res.status(500).json({
                message: 'Error when getting event.',
                error: err.message || err
            });
        }
    },


    /**
     * eventController.create()
     */
    create: async function (req, res) {
        try {
            const event = new EventModel({
                title: req.body.title,
                createdBy: req.body.userId,
                type: req.body.type,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                description: req.body.description,
                goal: req.body.goal
            });

            const savedEvent = await event.save();

            return res.status(201).json(savedEvent);
        } catch (err) {
            return res.status(500).json({
                message: 'Error when creating event',
                error: err.message || err
            });
        }
    },   


    /**
     * eventController.update()
     */
    update: async function (req, res) {
        try{
            var id = req.params.id;

            const event=await EventModel.findOne({_id: id});

            if (!event) {
                return res.status(404).json({
                    message: 'No such event'
                });
            }

            event.title = req.body.title ? req.body.title : event.title;
            event.type = req.body.type ? req.body.type : event.type;
            event.startTime = req.body.startTime ? req.body.startTime : event.startTime;
            event.endTime = req.body.endTime ? req.body.endTime : event.endTime;
            event.description = req.body.description ? req.body.description : event.description;
            event.goal = req.body.goal ? req.body.goal : event.goal;
                
            try {
                const savedEvent = await event.save();
                return res.status(201).json(savedEvent);
            } catch (err) {
                return res.status(500).json({
                    message: 'Error saving event',
                    error: err.message || err
                });
            }
        } catch(err) {
            return res.status(500).json({
                message: 'Error when getting event',
                error: err
            });
        }
    },

    /**
     * eventController.remove()
     */
    remove: async function (req, res) {
        try{
            var id = req.params.id;

            const event=await EventModel.findByIdAndRemove(id);

            return res.status(204).json();
        }catch (err){
            return res.status(500).json({
                message: 'Error when deleting the event.',
                error: err
            });
        }
    }
};
