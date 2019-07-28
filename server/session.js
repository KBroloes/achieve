const session = require("express-session")

module.exports = {
    configure: function configure_session(app) {
        app.use(session({
            secret: process.env.SESSION_SECRET,
            name: 'Steam Session',
            resave: true,
            saveUninitialized: true
        }))
    }
}