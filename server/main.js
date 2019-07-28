const express = require('express')
const passport = require('passport')
const SteamStrategy = require('passport-steam').Strategy
const session = require("express-session")
require('dotenv').config();

const app = express()
const port = 3000

const public = express.static('public')

// Configure node app
app.set('views', './server/views')
app.set('view engine', 'ejs')
app.use(public)
app.use(session({
    secret: process.env.SESSION_SECRET,
    name: 'Steam Session',
    resave: true,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/');
  }

app.get('/', (req, res) =>  {
    res.render('index', { user: req.user })
})

app.get('/main', ensureAuthenticated, (req, res) =>  {
    res.render('main', { user: req.user })
})
// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Steam profile is serialized
//   and deserialized.
passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((obj, done) => {
    done(null, obj)
})

passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: process.env.STEAM_API_KEY
  },
  (identifier, profile, done) => {
    console.log(identifier)
    console.log(profile)
    user = profile._json
    userObj = {
        identifier: identifier,
        id: profile.id,
        displayName: profile.displayName,
        country: user.loccountrycode,
        avatar: user.avatarfull,
        profileurl: user.profileurl,
        realname: user.realname
    }
    // Use the SteamStrategy within Passport.
    //   Strategies in passport require a `validate` function, which accept
    //   credentials (in this case, an OpenID identifier and profile), and invoke a
    //   callback with a user object.
    return done(undefined, userObj)
  }
));

app.get('/auth/steam',
    passport.authenticate('steam'),
    (req, res) => {
    // The request will be redirected to Steam for authentication, so
    // this function will not be called.
})

app.get('/auth/steam/return',
    passport.authenticate('steam', { failureRedirect: '/' }),
    (req, res) => {
    // Successful authentication, redirect home.
        res.redirect('/main')
})



app.listen(port, () => console.log(`Example app listening on port ${port}!`))