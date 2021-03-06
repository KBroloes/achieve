const moment = require('moment')
module.exports = class Game {
    constructor(json) {
        this.id = json.appid
        this.name = json.name
        this.image = constructGameImgUrl(this.id, json.img_logo_url)
        this.playtime_total = json.playtime_forever
        this.playtime_recent = json.playtime_2weeks || 0
        this.last_updated = moment.utc()
        this.achievements = []
        this.achievements_completed = 0
        this.completion_score = 100
    }

    addAchievements(statsjson) {
        const achievements = statsjson.playerstats.achievements
        if(achievements && achievements.length > 0) {
            this.achievements = achievements
            this.achievements_completed = this.achievements.reduce((memo, a) => {
                if(a.achieved == 1){
                    memo += 1
                }
                return memo
            }, 0)
            this.completion_score = (this.achievements_completed / this.achievements.length * 100).toFixed(0)
            if(statsjson.playerstats.gameName !== this.name) {
                console.warn(`Added achievements for another game. Expected: ${this.name}, but got ${statsjson.playerstats.gameName}`)
            }
        } else {
            this.achievements = []
            this.achievements_completed = 0
            this.completion_score = 100
        }
    }
}

const constructGameImgUrl = (appId, imgHash) => {
    return `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appId}/${imgHash}.jpg`
}