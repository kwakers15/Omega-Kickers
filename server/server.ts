import express, { NextFunction, Request, Response } from 'express'
import MongoStore from 'connect-mongo'
import session from 'express-session'
import { Collection, Db, MongoClient, ObjectId } from 'mongodb'
import passport from 'passport'
import { Issuer, Strategy } from 'openid-client'
import { keycloak } from './secrets'

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = 8095

// mongodb
const mongoUrl = 'mongodb://127.0.0.1:27017'
const mongoClient = new MongoClient(mongoUrl)
let db: Db
let config: Collection
let users: Collection
let tokenMap: Collection

const sessionMiddleware = session({
  secret: 'changeme',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },

  store: MongoStore.create({
    mongoUrl,
    ttl: 14 * 24 * 60 * 60
  })
})

app.use(sessionMiddleware)

app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user: any, done: any) => {
  // console.log("serializeUser " + JSON.stringify(user))
  done(null, user)
})
passport.deserializeUser((user: any, done: any) => {
  // console.log("deserializeUser " + JSON.stringify(user))
  done(null, user)
})

function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.sendStatus(401)
    return
  }

  next()
}

// app routes
app.post(
  "/api/logout",
  (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err)
      }
      res.redirect("/api/login")
    })
  }
)

// // objects for mapping userIds to tokens
// const socketIoTokens: { [key: string]: string } = {}
// const tokensToUserId: { [key: string]: string } = {}

app.get("/api/user", async (req, res) => {
  if (req.user) {
    // if (!socketIoTokens[req.user.preferred_username]) {
    //   socketIoTokens[req.user.preferred_username] = String(Math.random())
    //   tokensToUserId[socketIoTokens[req.user.preferred_username]] = req.user.preferred_username
    // }
    // res.json({ ...req.user, token: socketIoTokens[req.user.preferred_username] })
    // return
    const username = req.user.preferred_username
    const tokenDocument = await tokenMap.findOne({ username })
    if (tokenDocument) {
      res.json({ ...req.user, token: tokenDocument.token })
      return
    }
  }
  res.json({})
})

let currentConfig = {}

async function initializeDefaultConfig() {
  currentConfig = await config.findOne({})
}


// let gameState = createEmptyGame(["player1", "player2"], config)

// function emitUpdatedCardsForPlayers(cards: Card[], newGame = false) {
//   gameState.playerNames.forEach((_, i) => {
//     let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i)
//     if (newGame) {
//       updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused")
//     }
//     console.log("emitting update for player", i, ":", updatedCardsFromPlayerPerspective)
//     io.to(String(i)).emit(
//       newGame ? "all-cards" : "updated-cards",
//       updatedCardsFromPlayerPerspective,
//     )
//   })
// }

io.on('connection', (client: any) => {
  client.once("token", async (token: string) => {
    const usernameDocument = await tokenMap.findOne({ token })
    if (!usernameDocument) {
      // shut down this connection
      console.log('shutting down')
      return
    }
    const username = usernameDocument.username
    console.log('connected userId is:', username)
    client.on("this", () => { })
    client.on("that", () => { })
  })
  initializeDefaultConfig()
  // function emitGameState() {
  //   const counts = computePlayerCardCounts(gameState)
  //   console.log(counts)
  //   const playersWithOneOrFewerCards: string[] = []
  //   for (const [index, count] of counts.entries()) {
  //     if (count <= 1) {
  //       playersWithOneOrFewerCards.push(gameState.playerNames[index])
  //     }
  //   }
  //   client.emit(
  //     "game-state",
  //     gameState.currentTurnPlayerIndex,
  //     gameState.phase,
  //     gameState.playCount,
  //     playersWithOneOrFewerCards
  //   )
  // }

  // console.log("New client")
  // let playerIndex: number | null | "all" = null
  // client.on('player-index', n => {
  //   playerIndex = n
  //   console.log("playerIndex set", n)
  //   client.join(String(n))
  //   if (typeof playerIndex === "number") {
  //     client.emit(
  //       "all-cards",
  //       filterCardsForPlayerPerspective(Object.values(gameState.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
  //     )
  //   } else {
  //     client.emit(
  //       "all-cards",
  //       Object.values(gameState.cardsById),
  //     )
  //   }
  //   emitGameState()
  // })
  client.on('get-config', () => {
    client.emit('get-config-reply', currentConfig)
  })

  client.on('update-config', (newConfig: { ballSpeed: number, playerSpeed: number, obstacles: boolean, keepers: boolean }) => {
    let result = { updated: false, ballError: false, playerError: false }
    if (typeof newConfig.ballSpeed !== 'number') {
      result.ballError = true
    } else if (typeof newConfig.playerSpeed !== 'number') {
      result.playerError = true
    } else {
      result.updated = true
      currentConfig = { ...newConfig }
    }
    setTimeout(() => {
      client.emit('update-config-reply', result)
    }, 2000)
  })

  // client.on("action", (action: Action) => {
  //   if (typeof playerIndex === "number") {
  //     const updatedCards = doAction(gameState, { ...action, playerIndex })
  //     emitUpdatedCardsForPlayers(updatedCards)
  //   } else {
  //     // no actions allowed from "all"
  //   }
  //   io.to("all").emit(
  //     "updated-cards",
  //     Object.values(gameState.cardsById),
  //   )
  //   const counts = computePlayerCardCounts(gameState)
  //   console.log(counts)
  //   const playersWithOneOrFewerCards: string[] = []
  //   for (const [index, count] of counts.entries()) {
  //     if (count <= 1) {
  //       playersWithOneOrFewerCards.push(gameState.playerNames[index])
  //     }
  //   }
  //   io.emit(
  //     "game-state",
  //     gameState.currentTurnPlayerIndex,
  //     gameState.phase,
  //     gameState.playCount,
  //     playersWithOneOrFewerCards
  //   )
  // })

  // client.on("new-game", () => {
  //   gameState = createEmptyGame(gameState.playerNames, config)
  //   const updatedCards = Object.values(gameState.cardsById)
  //   emitUpdatedCardsForPlayers(updatedCards, true)
  //   io.to("all").emit(
  //     "all-cards",
  //     updatedCards,
  //   )
  //   emitGameState()
  // })
})

mongoClient.connect().then(() => {
  console.log('Connected successfully to MongoDB')
  db = mongoClient.db('omega-kickers')
  config = db.collection('config')
  users = db.collection('users')
  tokenMap = db.collection('tokenMap')

  Issuer.discover("http://127.0.0.1:8081/auth/realms/omega-kickers/.well-known/openid-configuration").then(issuer => {
    const client = new issuer.Client(keycloak)
    passport.use("oidc", new Strategy(
      {
        client,
        params: {
          prompt: "login"
        }
      },
      async (tokenSet: any, userInfo: any, done: any) => {
        const username = userInfo.preferred_username
        await tokenMap.updateOne(
          { username },
          {
            $set: {
              token: String(Math.random())
            }
          },
          { upsert: true }
        )
        return done(null, userInfo)
      }
    ))
    app.get(
      "/api/login",
      passport.authenticate("oidc", { failureRedirect: "/api/login" }),
      (req, res) => res.redirect("/")
    )

    app.get(
      "/api/login-callback",
      passport.authenticate("oidc", {
        successRedirect: "/",
        failureRedirect: "/api/login",
      })
    )
    http.listen(port, () => {
      console.log(`Game server listening on port ${port}`)
    })
  })
})

