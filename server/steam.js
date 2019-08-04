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
        try {
            const resp = await axios.get(url)
            const response = resp.data.response

            const gameMap = {}
            response.games.slice(0,10).forEach((g) => {
                let game = new Game(g)
                gameMap[game.id] = game
            })

            return { game_count: response.game_count, games: gameMap }
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
        try {
            const response = await axios.get(url)
            return response.data
        } catch (err) {
            if(err.response.status == 400) {
                if('playerstats' in err.response.data && err.response.data.playerstats.error == 'Requested app has no stats') {
                    return {playerstats: { achievements: [] }}
                }
            }
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