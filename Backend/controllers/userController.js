var UserModel = require('../models/userModel.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    /**
     * userController.list()
     */
    list: async function (req, res) {

        try {
        const users=await UserModel.find();
            if (!users) {
                return res.status(404).json({
                    message: 'No users'
                });
            }

            return res.json(users);
        
        } catch (err) {
            return res.status(500).json({
                message: 'Error when getting users.',
                error: err.message || err
            });
        }
    },

    /**
     * userController.show()
     */
    show: async function (req, res) {
        const id = req.params.id;

        try {
            const user = await UserModel.findOne({ _id: id });

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            return res.json(user);
        } catch (err) {
            return res.status(500).json({
                message: 'Error when getting user.',
                error: err.message || err
            });
        }
    },


    /**
     * userController.create()
     */
    create: async function (req, res) {
        try {
            const user = new UserModel({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: req.body.password
            });

            const savedUser = await user.save();

            return res.status(201).json(savedUser);
        } catch (err) {
            return res.status(500).json({
                message: 'Error when creating user',
                error: err.message || err
            });
        }
    },   


    /**
     * userController.update()
     */
    update: async function (req, res) {
        try{
            var id = req.params.id;

            const user=await UserModel.findOne({_id: id});

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            user.firstName = req.body.firstName ? req.body.firstName : user.firstName;
            user.lastName = req.body.lastName ? req.body.lastName : user.lastName;
            user.email = req.body.email ? req.body.email : user.email;
            user.password = req.body.password ? req.body.password : user.password;
                
            try {
                const savedUser = await user.save();
                return res.status(201).json(savedUser);
            } catch (err) {
                return res.status(500).json({
                    message: 'Error saving user',
                    error: err.message || err
                });
            }
        } catch(err) {
            return res.status(500).json({
                message: 'Error when getting user',
                error: err
            });
        }
    },

    /**
     * userController.remove()
     */
    remove: async function (req, res) {
        try{
            var id = req.params.id;

            const user=await UserModel.findByIdAndRemove(id);

            return res.status(204).json();
        }catch (err){
            return res.status(500).json({
                message: 'Error when deleting the user.',
                error: err
            });
        }
    },

    login: async function(req, res, next){
        try {
            const user = await UserModel.authenticate(req.body.email, req.body.password);
            if (!user) {
                const err = new Error('Wrong email or password');
                err.status = 401;
                throw err;
            }
    
            req.session.userId = user._id;
            req.session.user = {
                firstName: user.firstName,
                profileImage: user.profileImage || null
            };
    
            return res.json({
                status: "success",
                data: user
            });
    
        } catch (err) {
            return next(err);
        }
    },
    
    profile: async function(req, res, next) {
        try {
            const user = await UserModel.findById(req.session.userId);

            if (!user) {
                const err = new Error('Not authorized, go back!');
                err.status = 400;
                return next(err);
            }

            return res.json(user);
        } catch (err) {
            return next(err);
        }  
    },

        
    logout: async function(req, res, next){
        try{
        if(req.session){
            req.session.destroy();

            return res.status(201).json({});
        }
        }catch(err){
            return next(err);
        }
    },

    mobileLogin: async function(req,res,next){
        try{
            const { email , password } = req.body;

            if(!email || !password){
                return res.status(400).json({
                    message:'Email and password are required!'
                });
            }

            const user = await UserModel.findOne({email:email});

            if(!user){
                return res.status(404).json({
                    message:'User not found'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                     message: 'Invalid credentials' 
                });
            }

            const token = jwt.sign(
                {id: user._id,email:user.email},
                JWT_SECRET,
                {expiresIn : '7d'}
            );

            return res.json({token,user:{id:user._id,email:user.email,firstName:user.firstName,lastName:user.lastName}});
        }catch(err){
            return next(err);
        },
      
    me: async function(req, res) {
        if (req.session && req.session.user) {
            return res.json({ user: req.session.user });
        }
        return res.status(401).json({ message: "Not logged in" });
    },
    
    
};
