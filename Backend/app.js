// backend/app.js
require('dotenv').config();

const express       = require('express');
const path          = require('path');
const logger        = require('morgan');
const cookieParser  = require('cookie-parser');
const cors          = require('cors');
const session       = require('express-session');
const MongoStore    = require('connect-mongo');
const mongoose      = require('mongoose');

// Connect to MongoDB
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const indexRouter     = require('./routes/index');
const usersRouter     = require('./routes/userRoutes');
const activitysRouter = require('./routes/activityRoutes');

const app = express();

// Allow all cross-origins (enable credentials if needed)
app.use(cors({ origin: true, credentials: true }));

// Standard middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Session storage in Mongo
app.use(
  session({
    secret:           process.env.SECRET,
    resave:           false,
    saveUninitialized:false,
    store:            MongoStore.create({ mongoUrl: process.env.DATABASE }),
    cookie:           { maxAge: 1000 * 60 * 60 * 24 } // optional
  })
);

// Expose session to templates / downstream
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Mount routes
app.use('/',        indexRouter);
app.use('/users',   usersRouter);
app.use('/activitys', activitysRouter);

// 404 catch
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({
      message: err.message,
      error:   req.app.get('env') === 'development' ? err : {}
    });
});

module.exports = app;
