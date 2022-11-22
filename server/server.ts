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
const maxPlayers = 4

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

// function checkAuthenticated(req: Request, res: Response, next: NextFunction) {
//   if (!req.isAuthenticated()) {
//     res.sendStatus(401)
//     return
//   }

//   next()
// }

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
    console.log('connected client id is:', client.id)
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

    client.on('get-max-players', () => {
      client.emit('get-max-players-reply', maxPlayers)
    })

    // USE SOCKET DISCONNECTED TO REMOVE USERS FROM ROOMS AND DELETE ROOMS WHEN THEY ARE THE LAST ONE
    client.on('create', async (username: string) => {
      // a little messy but we will never have 1 million rooms open at once
      let roomId = generateRandomSixDigitNumber()
      let duplicateRoom = await rooms.findOne({ roomId })
      while (duplicateRoom) {
        roomId = generateRandomSixDigitNumber()
        duplicateRoom = await rooms.findOne({ roomId })
      }
      rooms.insertOne({
        roomId,
        clientIds: [
          {
            _id: client.id
          }
        ],
        clientNames: [
          {
            username
          }
        ],
        leaderId: client.id,
        leaderName: username,
        team1: [],
        team2: [],
        unassigned: [username],
        state: 'team-selection'
      })
    })

    client.on('join', async (username: string, code: string) => {
      let result = {
        full: false,
        duplicateUser: false,
        joined: false
      }
      const room = await rooms.findOne({ roomId: code })
      if (room) {
        if (room.clientNames.some((e: { username: string }) => e.username === username)) {
          result.duplicateUser = true
        }
        else if (room.clientNames.length == maxPlayers) {
          result.full = true
        }
        else {
          result.joined = true
          await rooms.updateOne(
            { roomId: room.roomId },
            {
              $set: {
                clientIds: [...room.clientIds, { _id: client.id }],
                clientNames: [...room.clientNames, { username }],
                unassigned: [...room.unassigned, username]
              }
            }
          )
        }
      }
      client.emit('join-reply', result)
    })

    client.on('updated-team-page', async (username: string) => {
      const room = await rooms.findOne({ clientNames: { username } })
      if (room) {
        const index = room.clientNames.findIndex((o: { username: string }) => o.username === username)
        await rooms.updateOne(
          { roomId: room.roomId },
          {
            $set: {
              clientIds: room.clientIds.map((idObj: { _id: string }, i: number) => {
                if (i === index) {
                  idObj._id = client.id
                }
                return idObj
              }),
              leaderId: room.leaderName === username ? client.id : room.leaderId,
            }
          }
        )
        client.join(room.roomId)
        io.to(room.roomId).emit('updated-teams', room.team1, room.team2, room.unassigned)
      }
    })

    client.on('switch-teams', async (username: string, teamOneRoster: string[], teamTwoRoster: string[], unassignedPlayers: string[]) => {
      const room = await rooms.findOne({ clientNames: { username } })
      if (room) {
        await rooms.updateOne(
          { roomId: room.roomId },
          {
            $set: {
              team1: teamOneRoster,
              team2: teamTwoRoster,
              unassigned: unassignedPlayers
            }
          }
        )
        io.to(room.roomId).emit('updated-teams', teamOneRoster, teamTwoRoster, unassignedPlayers)
      }
    })

    client.on('start-game', async (username: string) => {
      const room = await rooms.findOne({ clientNames: { username } })
      if (room) {
        await rooms.updateOne(
          { roomId: room.roomId },
          {
            $set: {
              state: "in-game"
            }
          }
        )
        io.to(room.roomId).emit('go-to-game')
      }
    })

    client.on('update-game-start', async (username: string) => {
      const room = await rooms.findOne({ clientNames: { username } })
      if (room) {
        const index = room.clientNames.findIndex((o: { username: string }) => o.username === username)
        await rooms.updateOne(
          { roomId: room.roomId },
          {
            $set: {
              clientIds: room.clientIds.map((idObj: { _id: string }, i: number) => {
                if (i === index) {
                  idObj._id = client.id
                }
                return idObj
              }),
              leaderId: room.leaderName === username ? client.id : room.leaderId,
            }
          }
        )
        client.join(room.roomId)
      }
    })

    // client.on('disconnecting', () => {
    //   console.log('inside disconnecting')
    //   console.log(client.id)
    //   console.log(client.rooms)
    // })

    async function leaveRoom() {
      const room = await rooms.findOne({ clientIds: { _id: client.id } })
      if (room) {
        if (room.leaderId === client.id) {
          // delete room from database
          await rooms.deleteOne({ roomId: room.roomId })
          client.to(room.roomId).emit('back-to-home')
        } else {
          // delete user from client arrays
          const index = room.clientIds.findIndex((idObj: { _id: string }) => idObj._id == client.id)
          const nameToDelete = room.clientNames[index].username
          const filteredTeam1 = room.team1.filter((player: string) => player != nameToDelete)
          const filteredTeam2 = room.team2.filter((player: string) => player != nameToDelete)
          const filteredUnassigned = room.unassigned.filter((player: string) => player != nameToDelete)
          await rooms.updateOne(
            { roomId: room.roomId },
            {
              $set: {
                clientIds: room.clientIds.filter((idObj: { _id: string }) => idObj._id != client.id),
                clientNames: room.clientNames.filter((nameObj: { username: string }) => nameObj.username != nameToDelete),
                team1: filteredTeam1,
                team2: filteredTeam2,
                unassigned: filteredUnassigned
              }
            }
          )
          io.to(room.roomId).emit('updated-teams', filteredTeam1, filteredTeam2, filteredUnassigned)
        }
      }
    }

    client.on('disconnect', () => {
      leaveRoom()
    })

    client.on('leave-room', () => {
      leaveRoom()
      client.emit('back-to-home')
    })
  })
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

