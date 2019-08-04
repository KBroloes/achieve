const session = require("express-session")
const RedisStore = require('connect-redis')(session)

module.exports = {
    configure: function configure_session(app, rclient) {
        app.use(session({
            store: new RedisStore({ client: rclient }),
            secret: process.env.SESSION_SECRET,
            name: 'Steam Session',
            resave: true,
            saveUninitialized: true
        }))
    }
}