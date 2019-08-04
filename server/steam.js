const axios = require('axios')
const Game = require('./game')

module.exports = class Steam {
    constructor(apiKey){
        this._apiKey = apiKey
        this.Player = new Player(apiKey)
        this.User = new User(apiKey)
    }
}

class Player {
    constructor(apiKey) {
        this._apiKey = apiKey
        this._interface = "IPlayerService"
        this._version = "0001"
    }

    async GetOwnedGames(steamid, include_appinfo=true, include_played_free_games=true) {
        const method = "GetOwnedGames"
        const params = { steamid, include_appinfo, include_played_free_games }
        const url = constructSteamUrL(this._apiKey, this._interface, method, this._version, params)
        console.log(url)
        try {
            const resp = await request(url)

            const gameMap = {}
            resp.response.games.slice(0,10).forEach((g) => {
                let game = new Game(g)
                gameMap[game.id] = game
            })

            return { game_count: resp.response.game_count, games: gameMap }
        } catch (err) {
            console.error(`[Steam] Failed to request for ${url}, ${err}`)
            throw new Error("Request failed")
        }
    }
}

class User {
    constructor(apiKey) {
        this._apiKey = apiKey
        this._interface = "ISteamUserStats"
        this._version = "0002"
    }

    async GetUserStatsForGame(steamid, appid) {
        const method = "GetPlayerAchievements"
        const version = "0001"
        const params = { steamid, appid }
        const url = constructSteamUrL(this._apiKey, this._interface, method, version, params)
        console.log(url)
        try {
            const response = await request(url)
            return response
        } catch (err) {
            console.error(`[Steam] Failed to request for ${url}, ${err}`)
            throw new Error("Request failed")
        }
    }

    async GetGlobalAchievementPercentagesForApp(gameid) {
        const method = "GetGlobalAchievementPercentagesForApp"
    }
}

const constructSteamUrL = (apiKey, interface, method, version, params) => {
    url = `http://api.steampowered.com/${interface}/${method}/v${version}/?key=${apiKey}`
    for (var key in params) {
        url = url + `&${key}=${params[key]}`
    }
    return url
}

const request = async (url) => {
    try {
        const resp = await axios.get(url)
        return resp.data
    } catch (resp) {
        let response = resp.response
        console.error("[Request]", response.status, response.statusText, response.data)
        throw new Error(`Request failed with ${response.status}: ${response.statusText}`)
    }
}