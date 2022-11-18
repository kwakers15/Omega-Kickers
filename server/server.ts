import express, { NextFunction, Request, Response } from 'express'
import MongoStore from 'connect-mongo'
import session from 'express-session'
import { Collection, Db, MongoClient } from 'mongodb'
import passport from 'passport'
import { Issuer, Strategy } from 'openid-client'
import { keycloak } from './secrets'
import { exists } from 'fs'

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const port = 8095
const maxClients = 6

// mongodb
const mongoUrl = 'mongodb://127.0.0.1:27017'
const mongoClient = new MongoClient(mongoUrl)
let db: Db
let config: Collection
let tokenMap: Collection
let rooms: Collection

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

app.get("/api/user", async (req, res) => {
  if (req.user) {
    const username = req.user.preferred_username
    const tokenDocument = await tokenMap.findOne({ username })
    if (tokenDocument) {
      res.json({ ...req.user, token: tokenDocument.token })
      return
    }
  }
  res.json({})
})

function generateRandomSixDigitNumber() {
  return String(Math.floor(100000 + Math.random() * 900000))
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

    client.on('get-config', async () => {
      client.emit('get-config-reply', await config.findOne({}))
    })

    client.on('update-config', async (newConfig: { ballSpeed: number, playerSpeed: number, obstacles: boolean, keepers: boolean }) => {
      let result = { updated: false, ballError: false, playerError: false }
      if (typeof newConfig.ballSpeed !== 'number') {
        result.ballError = true
      } else if (typeof newConfig.playerSpeed !== 'number') {
        result.playerError = true
      } else {
        result.updated = true
        await config.updateOne(
          {},
          {
            $set: {
              ballSpeed: newConfig.ballSpeed,
              playerSpeed: newConfig.playerSpeed,
              obstacles: newConfig.obstacles,
              keepers: newConfig.keepers
            }
          },
        )
      }
      setTimeout(() => {
        client.emit('update-config-reply', result)
      }, 1000)
    })


    // USE SOCKET DISCONNECTED TO REMOVE USERS FROM ROOMS AND DELETE ROOMS WHEN THEY ARE THE LAST ONE
    client.on('create-room', async (username: string) => {
      // a little messy but we will never have 1 million rooms open at once
      let roomId = generateRandomSixDigitNumber()
      let existingRoom = await rooms.findOne({ roomId })
      while (existingRoom) {
        roomId = generateRandomSixDigitNumber()
        existingRoom = await rooms.findOne({ roomId })
      }
      client.join(roomId)
      rooms.insertOne({
        roomId,
        clients: [
          {
            _id: client.id,
            username
          }
        ]
      })
    })

    client.on('join-room', async (username: string, code: string) => {
      let result = {
        exists: false,
        full: false,
        joined: false
      }
      const room = await rooms.findOne({ roomId: code })
      if (room) {
        if (room.clients.length == maxClients) {
          result.exists = true
          result.full = true
        }
        else {
          result.joined = true
          client.join(room.roomId)
          rooms.updateOne(
            { roomId: room.roomId },
            {
              $set: {
                clients: [...room.clients, { _id: client.id, username }]
              }
            }
          )
        }
      }
      client.emit('join-room-reply', result)
    })
  })

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
  tokenMap = db.collection('tokenMap')
  rooms = db.collection('rooms')

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

