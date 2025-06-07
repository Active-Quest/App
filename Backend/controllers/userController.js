const UserModel = require('../models/userModel.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */

const sendLoginNotification = async (fcmToken, userName) => {
    const message = {
    notification: {
        title: 'Login Alert',
        body: `${ userName } logged in on the web.`,
    },
    token: fcmToken,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Notification sent:', response);
    } catch(error) {
        console.error('Error sending notification:', error);
    }
};

module.exports = {
    list: async function (req, res) {
        try {
            const users = await UserModel.find();
            if (!users) {
                return res.status(404).json({ message: 'No users' });
            }
            return res.json(users);
        } catch (err) {
            return res.status(500).json({
                message: 'Error when getting users.',
                error: err.message || err
            });
        }
    },

    show: async function (req, res) {
        const id = req.params.id;
        try {
            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'No such user' });
            }
            return res.json(user);
        } catch (err) {
            return res.status(500).json({
                message: 'Error when getting user.',
                error: err.message || err
            });
        }
    },

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

    update: async function (req, res) {
        try {
            const id = req.params.id;
            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'No such user' });
            }

            user.firstName = req.body.firstName || user.firstName;
            user.lastName = req.body.lastName || user.lastName;
            user.email = req.body.email || user.email;
            user.password = req.body.password || user.password;

            const savedUser = await user.save();
            return res.status(201).json(savedUser);
        } catch (err) {
            return res.status(500).json({
                message: 'Error saving user',
                error: err.message || err
            });
        }
    },

    remove: async function (req, res) {
        try {
            const id = req.params.id;
            await UserModel.findByIdAndRemove(id);
            return res.status(204).json();
        } catch (err) {
            return res.status(500).json({
                message: 'Error when deleting the user.',
                error: err
            });
        }
    },

    login: async function (req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await UserModel.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            if(user.twoFA==true){
                user.waitingMobile2FA = true;

                await user.save();
               return res.json({
                twoFARequired: true,
                userId: user._id,
                message: '2FA required. Please verify on your phone.',
              });
            }

            const token = jwt.sign(
                { id: user._id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return res.json({ token, user });
        } catch (err) {
            return next(err);
        }
    },
    check2FAStatus: async function (req, res, next) {
      try {
        const userId = req.params.id;
    
        const user = await UserModel.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        //2FA passed
        if (user.passed2FA === true) {
            //continue normally with sign in
          const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          );
          return res.json({ passed2FA: true, token });
        } else {
          return res.json({ passed2FA: false });
        }
      } catch (err) {
        return next(err);
      }
    },

    update2FAResult: async function (req,res){
        const {passed2FA} = req.body;
        const userId = req.params.id;
        const user = await UserModel.findById(userId);
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }

        user.Passed2FA = passed2FA;
        user.waitingMobile2FA = false;
        await user.save();
    },


    profile: async function (req, res, next) {
        try {
            const user = await UserModel.findById(req.session.userId);
            if (!user) {
                return res.status(400).json({ message: 'Not authorized' });
            }
            return res.json(user);
        } catch (err) {
            return next(err);
        }
    },

    logout: async function (req, res, next) {
        try {
            if (req.session) {
                req.session.destroy();
                return res.status(201).json({});
            }
        } catch (err) {
            return next(err);
        }
    },

mobileLogin: async function (req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required!' });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (err) {
        return next(err);
    }
},

me: async function (req, res) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Token missing' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        });
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token', error: err.message });
    }
},

find: async function (req, res) {
    try {
        const { firstName, lastName } = req.query;
        if (!firstName && !lastName) {
            return res.status(400).json({ message: 'At least one of firstName or lastName is required.' });
        }

        const query = {};
        if (firstName) query.firstName = { $regex: firstName, $options: 'i' };
        if (lastName) query.lastName = { $regex: lastName, $options: 'i' };

        const users = await UserModel.find(query);
        return res.json(users);
    } catch (err) {
        return res.status(500).json({
            message: 'Error during search',
            error: err.message || err
            });
        }
    },

    add: async function (req, res) {
        try {
            const userId = req.params.id;
            const friendId = req.body.friendId;


            if (!friendId) {
            return res.status(400).json({ message: 'friendId is required in body' });
            }

            const user = await UserModel.findById(userId);
            if (!user) {
            return res.status(404).json({ message: 'User not found' });
            }

            if (!user.friends.includes(friendId)) {
            user.friends.push(friendId);
            }

            const savedUser = await user.save();
            return res.status(201).json(savedUser);
        } catch (err) {
            console.error("==> ADD FRIEND ERROR", err);
            return res.status(500).json({ message: 'Error updating friends list', error: err.message });
        }
    },

    listFriends: async function (req, res) {
        try {
            const user = await UserModel.findById(req.params.id).populate('friends');
            if (!user) {
            return res.status(404).json({ message: 'User not found' });
            }
            return res.json(user.friends);
        } catch (err) {
            return res.status(500).json({ message: 'Error fetching friends list', error: err.message });
        }
    },

    update2FA: async function (req,res){
        try {
            const user = await UserModel.findById(req.params.id);
            if(!user){
                return res.status(404).json({message:'User not found'});
            }
            const status2FA = req.body.boolean2FA;
            const token = req.body.fcmToken;
            user.twoFA = status2FA;
            user.fcmToken = token;
    
            try {
                    const savedUser = await user.save();
                    return res.status(201).json(savedUser);
                } catch (err) {
                    return res.status(500).json({
                        message: 'Error saving 2FA boolean',
                        error: err.message || err
                    });
                }
        }catch(err){
            return res.status(500).json({ message: 'Error when updating 2FA choice', error: err.message });
        }
    },
           
};
