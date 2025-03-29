import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Por favor, defina a variável de ambiente MONGODB_URI')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, use uma variável global para preservar o valor
  // entre recarregamentos causados por Hot Reloading.
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // Em produção, é melhor não usar uma variável global.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Função para conectar ao banco de dados
export async function connectToDatabase() {
  const client = await clientPromise
  const db = client.db('cardapio_digital')
  return { client, db }
}

export default clientPromise 