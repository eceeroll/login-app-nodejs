// .env file
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const PORT = process.env.PORT || 3000;

// declaring all required modules
const express = require("express");
const bcrypt = require("bcrypt");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require('method-override');
const path = require('path');

// passport
const passport = require("passport");
const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

// global users array
let users = [];

// static assesments
const publicPath = path.join(__dirname, '../public')

const app = express();

app.set("view engine", "ejs");

app.use(express.static(publicPath));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'))

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.name, title: 'Welcome Page' });
});

app.get("/login",checkNotAuthenticated, (req, res) => {
  res.render("login.ejs", {title: 'Login Page'});
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs", {title: 'Register Page'});
});

app.post(
  "/login", checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.post("/register",checkNotAuthenticated, async (req, res) => {
  // hashing password for security
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  try {
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    setTimeout(() => {
      res.redirect("/login");
    }, 1000);
  } catch {
    res.redirect("/register");
  }
});

// logout functionallity
app.delete('/logout', function (req, res, next) {
    req.logOut(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect('/login');
    });
  });

// if a user didnt authenticate cant reach the index page
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

// if a user alreay authenticated cant direct to login and register page
function checkNotAuthenticated(req, res, next) {
    if(req.isAuthenticated()){
        res.redirect('/')
    } else {
        next();
    }
}

app.listen(PORT, () => console.log("Server has started at " + PORT));
