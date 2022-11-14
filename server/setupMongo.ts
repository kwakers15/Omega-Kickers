import { MongoClient, ObjectId } from 'mongodb'

// Connection URL
const url = 'mongodb://localhost:27017'
const client = new MongoClient(url)

const defaultConfig = {
  ballSpeed: 5,
  playerSpeed: 5,
  obstacles: false,
  keepers: false
}

async function main() {
  await client.connect()
  console.log('Connected successfully to MongoDB')

  const db = client.db("omega-kickers")

  // add data
  console.log("inserting default config", await db.collection("config").insertOne(defaultConfig as any))

  process.exit(0)
}

main()