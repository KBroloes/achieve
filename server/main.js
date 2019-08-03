const express = require('express')
require('dotenv').config();

const auth = require('./authentication')
const session = require('./session')
const Steam = require('./steam')

const app = express()
const port = 3000

const public = express.static('public')

// Configure node app
app.set('views', './server/views')
app.set('view engine', 'ejs')
app.use(public)

session.configure(app)
auth.configure(app)

steam = new Steam(process.env.STEAM_API_KEY)
app.get('/', (req, res) =>  {
    res.render('index', { user: req.user })
})

app.get('/main', auth.ensure, (req, res) =>  {
    steam.Player.GetOwnedGames(req.user.id)
    .then( async (owned_games) => {
        try {
            await Promise.all(
                owned_games.games.map(async game => {
                    try {
                        const achievement = await steam.User.GetUserStatsForGame(req.user.id, game.appId)
                        game.addAchievements(achievement)
                    } catch (err) {
                        console.error("[Router]", err)
                    }
                })
            )
            owned_games.games = owned_games.games.filter(game => game.achievements.length)
            owned_games.games.sort((x, y) => x.completion_score - y.completion_score)
        } catch (err) {
            console.error("[Router]", err)
        }
        res.render('main', { user: req.user, games: owned_games })
    })
    .catch(err => res.status(500).send(err))
})

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });


app.listen(port, () => console.log(`Example app listening on port ${port}!`))