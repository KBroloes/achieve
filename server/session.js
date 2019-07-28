const session = require("express-session")
const RedisStore = require('connect-redis')(session)
const Redis = require('redis')

const redis_url = process.env.REDIS_URL || 'redis://localhost:6379'

module.exports = {
    configure: function configure_session(app) {
        let rclient;
        if(redis_url) {
            rclient = Redis.createClient(redis_url);
        } else {
            throw new Error("Redis URL required to configure the session store")
        }

        app.use(session({
            store: new RedisStore({ client: rclient }),
            secret: process.env.SESSION_SECRET,
            name: 'Steam Session',
            resave: true,
            saveUninitialized: true
        }))
    }
}