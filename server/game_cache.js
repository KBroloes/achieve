const Steam = require('./steam')

module.exports = class GameCache {
    constructor() {
        this.steam = new Steam(process.env.STEAM_API_KEY)
    }

    async GetGamesFor(userId) {

        try {
            const owned_games = await this._fetchOwnedGames(userId)
            await this._fetchUserStatsForGames(userId, owned_games)

            owned_games.games = owned_games.games.filter(game => game.achievements.length)
            owned_games.games.sort((x, y) => x.completion_score - y.completion_score)

            return owned_games
        } catch (err) {
            console.error("[Game Cache]", err)
            throw new Error(err)
        }
    }

    async _commitToCache(userId, gamesObject) {}
    async _getFromCache(userId) {}

    async _fetchOwnedGames(userId) {
        return this.steam.Player.GetOwnedGames(userId)
    }
    async _fetchUserStatsForGames(userId, gamesObject) {
        return Promise.all(
            gamesObject.games.map(async game => {
                try {
                    const achievement = await this.steam.User.GetUserStatsForGame(userId, game.appId)
                    game.addAchievements(achievement)
                } catch (err) {
                    console.error("[Router]", err)
                }
            })
        )
    }
}