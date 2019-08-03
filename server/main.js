const express = require('express')
require('dotenv').config();

const auth = require('./authentication')
const session = require('./session')
const Cache = require('./game_cache')

const app = express()
const port = 3000

const public = express.static('public')

// Configure node app
app.set('views', './server/views')
app.set('view engine', 'ejs')
app.use(public)

session.configure(app)
auth.configure(app)
const cache = new Cache()

app.get('/', (req, res) =>  {
    res.render('index', { user: req.user })
})

app.get('/main', auth.ensure, (req, res) =>  {
    cache.GetGamesFor(req.user.id)
    .then( owned_games => {
        res.render('main', { user: req.user, games: owned_games })
    })
    .catch(err => res.status(500).send(err))
})

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });


app.listen(port, () => console.log(`Example app listening on port ${port}!`))