import { MongoClient } from 'mongodb'
import { createClient } from '@supabase/supabase-js'

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/cardapio_digital?authSource=admin'
const SUPABASE_URL = 'https://vvwihgsstdfoszepafgp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2d2loZ3NzdGRmb3N6ZXBhZmdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MjIyMTEsImV4cCI6MjA1NDI5ODIxMX0.orkmX9S4GRycZIQE_SilwIqD_Qxij2L85leHLLYYVs0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function cleanProducts() {
  try {
    console.log('Iniciando limpeza dos produtos...')
    
    const client = await MongoClient.connect(MONGODB_URI)
    const db = client.db('cardapio_digital')
    
    // Primeiro busca todos os produtos para pegar as imagens
    const products = await db.collection('products').find({}).toArray()
    console.log(`Encontrados ${products.length} produtos para deletar`)

    // Deleta as imagens do Supabase Storage
    for (const product of products) {
      if (product.image) {
        try {
          const imageUrl = new URL(product.image)
          const imagePath = imageUrl.pathname.split('/public/')[1]
          if (imagePath) {
            console.log(`Deletando imagem: ${imagePath}`)
            await supabase.storage
              .from('restaurant-images')
              .remove([imagePath])
          }
        } catch (error) {
          console.error('Erro ao deletar imagem do produto:', error)
        }
      }
    }

    // Deleta todos os produtos
    const result = await db.collection('products').deleteMany({})
    console.log(`${result.deletedCount} produtos foram deletados com sucesso!`)

    await client.close()
    process.exit(0)
  } catch (error) {
    console.error('Erro ao limpar produtos:', error)
    process.exit(1)
  }
}

cleanProducts() 