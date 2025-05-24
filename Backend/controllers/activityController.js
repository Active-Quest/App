var ActivityModel = require('../models/activityModel.js');

/**
 * activityController.js
 *
 * @description :: Server-side logic for managing activitys.
 */
module.exports = {

    /**
     * activityController.list()
     */
    list: async function (req, res) {

        try {
        const activitys=await ActivityModel.find();
            if (!activitys) {
                return res.status(404).json({
                    message: 'No activitys'
                });
            }

            return res.json(activitys);
        
        } catch (err) {
            return res.status(500).json({
                message: 'Error when getting activitys.',
                error: err.message || err
            });
        }
    },

    /**
     * activityController.show()
     */
    show: async function (req, res) {
        const id = req.params.id;

        try {
            const activity = await ActivityModel.findOne({ _id: id });

            if (!activity) {
                return res.status(404).json({
                    message: 'No such activity'
                });
            }

            return res.json(activity);
        } catch (err) {
            return res.status(500).json({
                message: 'Error when getting activity.',
                error: err.message || err
            });
        }
    },


    /**
     * activityController.create()
     */
    create: async function (req, res) {
        try {
            const activity = new ActivityModel({
                userId: req.body.userId,
                eventId: req.body.eventId,
                startTime: req.body.startTime,
                duration: req.body.duration,
                distance: req.body.distance,
                waypoints: req.body.waypoints,
                avgSpeed: req.body.avgSpeed,
            });

            const savedActivity = await activity.save();

            return res.status(201).json(savedActivity);
        } catch (err) {
            return res.status(500).json({
                message: 'Error when creating activity',
                error: err.message || err
            });
        }
    },   


    /**
     * activityController.update()
     */
    update: async function (req, res) {
        try{
            var id = req.params.id;

            const activity=await ActivityModel.findOne({_id: id});

            if (!activity) {
                return res.status(404).json({
                    message: 'No such activity'
                });
            }

            activity.title = req.body.title ? req.body.title : activity.title;
                
            try {
                const savedActivity = await activity.save();
                return res.status(201).json(savedActivity);
            } catch (err) {
                return res.status(500).json({
                    message: 'Error saving activity',
                    error: err.message || err
                });
            }
        } catch(err) {
            return res.status(500).json({
                message: 'Error when getting activity',
                error: err
            });
        }
    },

    /**
     * activityController.remove()
     */
    remove: async function (req, res) {
        try{
            var id = req.params.id;

            const activity=await ActivityModel.findByIdAndRemove(id);

            return res.status(204).json();
        }catch (err){
            return res.status(500).json({
                message: 'Error when deleting the activity.',
                error: err
            });
        }
    }
};
