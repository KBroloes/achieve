const Steam = require('./steam')

module.exports = class GameCache {
    constructor(rclient) {
        this.redis = rclient
        this.steam = new Steam(process.env.STEAM_API_KEY)
    }

    async GetGamesFor(userId) {
        try {
            const cached_games = await this._getFromCache(userId)
            if(cached_games != null) {
                // DO all kinds of stuff
                console.log("Found cache", cached_games)
                return this._asFilteredGamesList(cached_games.owned_games)
            }

            const userGames = await this._fetchOwnedGames(userId)
            await this._fetchUserStatsForGames(userId, userGames)

            await this._commitToCache(userId, userGames)

            return this._asFilteredGamesList(userGames)
        } catch (err) {
            console.error("[Game Cache]", err)
            throw new Error(err)
        }
    }

    _asFilteredGamesList(gamesObject) {
        // Convert to array for filtering, sorting and representations
        let gamesList = Object.values(gamesObject.games)
        gamesList = gamesList.filter(game => game.achievements.length)
        gamesList.sort((x, y) => x.completion_score - y.completion_score)

        const newObj = {...gamesObject}
        newObj.games = gamesList

        return newObj
    }

    async _commitToCache(userId, gamesObject) {
        return this.redis.SetJSONValue(userId, {
            owned_games: gamesObject,
            last_updated: new Date().getTime(),
            userId: userId
        })
    }
    async _getFromCache(userId) {
        return this.redis.GetJSONValue(userId)
    }

    async _fetchOwnedGames(userId) {
        return this.steam.Player.GetOwnedGames(userId)
    }
    async _fetchUserStatsForGames(userId, gamesObject) {
        // Mutates the game objects. Mega yikes, but convenient!
        return Promise.all(
            Object.values(gamesObject.games).map(async game => {
                try {
                    const achievement = await this.steam.User.GetUserStatsForGame(userId, game.id)
                    game.addAchievements(achievement)
                } catch (err) {
                    console.error("[Router]", err)
                }
            })
        )
    }
}