import http from "http"
import { Server } from "socket.io"

const server = http.createServer()
const io = new Server(server)
const port = 8091

// let config = {
//   numberOfDecks: 2,
//   rankLimit: 2
// }
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

// io.on('connection', client => {
//   function emitGameState() {
//     const counts = computePlayerCardCounts(gameState)
//     console.log(counts)
//     const playersWithOneOrFewerCards: string[] = []
//     for (const [index, count] of counts.entries()) {
//       if (count <= 1) {
//         playersWithOneOrFewerCards.push(gameState.playerNames[index])
//       }
//     }
//     client.emit(
//       "game-state",
//       gameState.currentTurnPlayerIndex,
//       gameState.phase,
//       gameState.playCount,
//       playersWithOneOrFewerCards
//     )
//   }

//   console.log("New client")
//   let playerIndex: number | null | "all" = null
//   client.on('player-index', n => {
//     playerIndex = n
//     console.log("playerIndex set", n)
//     client.join(String(n))
//     if (typeof playerIndex === "number") {
//       client.emit(
//         "all-cards",
//         filterCardsForPlayerPerspective(Object.values(gameState.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
//       )
//     } else {
//       client.emit(
//         "all-cards",
//         Object.values(gameState.cardsById),
//       )
//     }
//     emitGameState()
//   })

//   client.on('get-config', () => {
//     client.emit('get-config-reply', config)
//   })

//   client.on('update-config', (newConfig: Config) => {
//     let result = true
//     if (typeof newConfig.numberOfDecks !== 'number' || typeof newConfig.rankLimit !== 'number') {
//       result = false
//     } else {
//       config = { ...newConfig }
//     }
//     setTimeout(() => {
//       client.emit('update-config-reply', result)
//     }, 2000)
//   })

//   client.on("action", (action: Action) => {
//     if (typeof playerIndex === "number") {
//       const updatedCards = doAction(gameState, { ...action, playerIndex })
//       emitUpdatedCardsForPlayers(updatedCards)
//     } else {
//       // no actions allowed from "all"
//     }
//     io.to("all").emit(
//       "updated-cards",
//       Object.values(gameState.cardsById),
//     )
//     const counts = computePlayerCardCounts(gameState)
//     console.log(counts)
//     const playersWithOneOrFewerCards: string[] = []
//     for (const [index, count] of counts.entries()) {
//       if (count <= 1) {
//         playersWithOneOrFewerCards.push(gameState.playerNames[index])
//       }
//     }
//     io.emit(
//       "game-state",
//       gameState.currentTurnPlayerIndex,
//       gameState.phase,
//       gameState.playCount,
//       playersWithOneOrFewerCards
//     )
//   })

//   client.on("new-game", () => {
//     gameState = createEmptyGame(gameState.playerNames, config)
//     const updatedCards = Object.values(gameState.cardsById)
//     emitUpdatedCardsForPlayers(updatedCards, true)
//     io.to("all").emit(
//       "all-cards",
//       updatedCards,
//     )
//     emitGameState()
//   })
// })
server.listen(port)
console.log(`Game server listening on port ${port}`)