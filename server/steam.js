const axios = require('axios')

module.exports = class Steam {
    constructor(apiKey){
        this._apiKey = apiKey
        this.Player = new Player(apiKey)
        this.User = new User(apiKey)
    }
}

class Game {
    constructor(json) {
        this.appId = json.appid
        this.name = json.name
        this.image = constructGameImgUrl(this.appId, json.img_logo_url)
        this.playtime_total = json.playtime_forever
        this.playtime_recent = json.playtime_2weeks || 0
        this.last_updated = new Date().getTime() // Use moment instead
        this.achievements = []
        this.achievements_completed = 0
        this.completion_score = 100
    }

    addAchievements(statsjson) {
        this.achievements = statsjson.playerstats.achievements
        if(this.achievements.length > 0) {
            this.achievements_completed = this.achievements.reduce((memo, a) => {
                if(a.achieved == 1){
                    memo += 1
                }
                return memo
            }, 0)
            this.completion_score = (this.achievements_completed / this.achievements.length * 100).toFixed(0)
        } else {
            this.achievements_completed = 0
            this.completion_score = 100
        }

        if(statsjson.playerstats.gameName !== this.name) {
            console.warn(`Added achievements for another game. Expected: ${this.name}, but got ${statsjson.playerstats.gameName}`)
        }
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

            const Games = resp.response.games.map(g => new Game(g))
            return { game_count: resp.response.game_count, games: Games.slice(0,10) }
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

const constructGameImgUrl = (appId, imgHash) => {
    return `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appId}/${imgHash}.jpg`
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