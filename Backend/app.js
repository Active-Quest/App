require("dotenv").config();
const express      = require("express");
const path         = require("path");
const logger       = require("morgan");
const cookieParser = require("cookie-parser");
const cors         = require("cors");
const mongoose     = require("mongoose");
const session      = require("express-session");
const MongoStore   = require("connect-mongo");

// Routers
const indexRouter     = require("./routes/index");
const usersRouter     = require("./routes/userRoutes");
const activitysRouter = require("./routes/activityRoutes");

const app = express();

// ——————————————
// 1) MongoDB connection
// ——————————————
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// ——————————————
// 2) CORS configuration
// ——————————————
const allowedOrigins = [
  "http://localhost:3000",  // React frontend
  "http://activequest.ddns.net"
];

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    // Allow tools like Postman or server-to-server calls
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked request from origin: ${origin}`);
    return callback(null, false);  // Do not throw; return false silently
  }
}));

// ——————————————
// 3) Standard middleware
// ——————————————
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ——————————————
// 4) Session support
// ——————————————
app.use(session({
  secret:           process.env.SECRET,
  resave:           true,
  saveUninitialized:false,
  store:            MongoStore.create({ mongoUrl: process.env.DATABASE })
}));

// Make session available in views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// ——————————————
// 5) Route bindings
// ——————————————
app.use("/",         indexRouter);
app.use("/users",    usersRouter);
app.use("/activitys",activitysRouter);

// ——————————————
// 6) 404 handler
// ——————————————
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

// ——————————————
// 7) Global error handler
// ——————————————
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(err.status || 500).json({ message: err.message });
});

module.exports = app;
