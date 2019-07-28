const axios = require('axios')

module.exports = class Steam {
    constructor(apiKey){
        this._apiKey = apiKey
        this.Player = new Player(apiKey)
        this.User = new User(apiKey)
    }
}

const constructSteamUrL = (apiKey, interface, method, version, params) => {
    url = `http://api.steampowered.com/${interface}/${method}/v${version}/?key=${apiKey}`
    for (var key in params) {
        url = url + `&${key}=${params[key]}`
    }
    return url
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
            const response = await axios.get(url)
            console.log(response)
            switch(response.status) {
                case 200:
                case 302:
                    return response.data.response
                case 400:
                case 500:
                    console.error(response.data)
                    throw new Error("Got status ", response.status)
                default:
                    console.warn("Unexpected response", response.data)
                    throw new Error("Unexpected response", response.data)
            }
        } catch (err) {
            console.error(`Failed to request for ${url}, error: ${err}`)
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

    GetUserStatsForGame(steamid, gameid) {
        const method = "GetUserStatsForGame"
    }

    GetGlobalAchievementPercentagesForApp(gameid) {
        const method = "GetGlobalAchievementPercentagesForApp"
    }
}