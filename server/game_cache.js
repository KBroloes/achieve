const Steam = require('./steam')
const moment = require('moment')

module.exports = class GameCache {
    constructor(rclient) {
        this.redis = rclient
        this.steam = new Steam(process.env.STEAM_API_KEY)
    }

    async GetGamesFor(userId) {
        try {
            const cached_games = await this._getFromCache(userId)
            if(cached_games == null) {
                // First time use case
                const userGames = await this._fetchOwnedGames(userId)
                await this._fetchUserStatsForGames(userId, userGames)
                userGames.total_completion_score = getCompletionScore(userGames)

                await this._commitToCache(userId, userGames)

                return asFilteredGamesList(userGames)
            }
            else {
                console.debug(`Found cache with ${cached_games.game_count} games`)
                if(isStale(cached_games.last_updated)) {
                    console.debug("Cache is stale, will update games that have been played")
                    const userGames = await this._fetchOwnedGames(userId)

                    const gamesToUpdate = []
                    for (const key in userGames.games) {
                        let needsUpdate = false
                        const fetched_game = userGames.games[key]

                        if(!(key in cached_games.games)) {
                            // This game has not been seen previously
                            needsUpdate = true
                        } else {
                            const cached_game = cached_games.games[key]
                            // Heuristic to update
                            if(!cached_game.playtime_total && !fetched_game.playtime_total) {
                                needsUpdate = isStale(cached_game.last_updated, 48)
                            } else {
                                needsUpdate = cached_game.playtime_total < (fetched_game.playtime_total)
                            }

                        }

                        if(needsUpdate) {
                            console.debug("[Game Cache] Needs update: ", fetched_game.name)
                            gamesToUpdate.push(this._fetchUserStatsForGame(userId, fetched_game))
                        }
                    }

                    console.info(`Updating ${gamesToUpdate.length} games`)
                    await Promise.all(gamesToUpdate).then((games) => {
                        games.forEach((game) => {
                            // Overwrite the cache
                            cached_games.games[game.id] = game
                            console.debug("[Game Cache] Updated game ", game.name)
                        })
                    })
                    cached_games.game_count = userGames.game_count
                    cached_games.total_completion_score = getCompletionScore(cached_games)

                    await this._commitToCache(userId, cached_games)
                }

                return asFilteredGamesList(cached_games)
            }
        } catch (err) {
            console.error("[Game Cache]", err)
            throw new Error(err)
        }
    }

    async _commitToCache(userId, gamesObject) {
        return this.redis.SetJSONValue(userId, {
            ...gamesObject,
            last_updated: moment.utc(),
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
            Object.values(gamesObject.games).map(async game => this._fetchUserStatsForGame(userId, game))
        )
    }

    async _fetchUserStatsForGame(userId, game) {
        try {
            const achievement = await this.steam.User.GetUserStatsForGame(userId, game.id)
            game.addAchievements(achievement)
        } catch (err) {
            console.error("[Game Cache (fetch)]", err)
        }
        return game
    }
}

function isStale(update_time, hours) {
    let time = hours || 4
    let threshold = moment.utc(update_time).add(time, 'hours')
    return threshold.isBefore(moment.utc())
}

function asFilteredGamesList(gamesObject) {
    // Convert to array for filtering, sorting and representations
    let gamesList = Object.values(gamesObject.games)
    played = gamesList.filter(game => game.achievements && game.achievements.length && game.playtime_total && game.playtime_total > 30)
    played.sort((x, y) => x.completion_score - y.completion_score)

    const newObj = {...gamesObject}
    newObj.games = played
    newObj.unplayed = gamesList.filter(game => game.achievements && game.achievements.length && !game.playtime_total)
    newObj.unplayed.sort((x, y) => x.completion_score - y.completion_score)

    return newObj
}

function getCompletionScore(gamesObject) {
    // Only count games with achievements that has been played
    const filtered = asFilteredGamesList(gamesObject).games
    const game_count = filtered.length
    if(game_count == 0) {
        return 0
    }

    // TODO: Add better tests for integer coercion
    const total = filtered.reduce((reducer, game) => {
        return reducer + (+game.completion_score)
    }, 0)
    const score = (total / game_count).toFixed(0)
    return score
}