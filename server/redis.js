const Redis = require('redis')
const redis_url = process.env.REDIS_URL || 'redis://localhost:6379'

module.exports = class RedisClient {
    constructor() {
        if(redis_url) {
            this.client = Redis.createClient(redis_url);
        } else {
            throw new Error("Redis URL required to configure the session store")
        }
    }

    SetJSONValue(key, value) {
        return new Promise((resolve, reject) => {
            this.client.set(key, JSON.stringify(value), (err, reply) => {
                if(err != null) {
                    reject(error)
                } else {
                    resolve(reply)
                }
            })
        })
    }

    GetJSONValue(key) {
        return new Promise((resolve, reject) => {
            this.client.get(key, (err, reply) => {
                if(err != null) {
                    reject(error)
                } else {
                    resolve(JSON.parse(reply))
                }
            })
        })
    }
}