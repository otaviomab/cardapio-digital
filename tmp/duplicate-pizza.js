// Script para duplicar produtos da categoria Pizza 4 Pedaços para Pizza 8 Pedaços e Pizza 12 Pedaços
const { MongoClient, ObjectId } = require("mongodb");

async function main() {
  // Conexão com o MongoDB
  const uri = "mongodb://cardapio_user:cardapio123@localhost:27017/cardapio_digital";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Conectado ao MongoDB");

    const db = client.db("cardapio_digital");
    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");

    // IDs das categorias
    const sourceCategoryId = "67bc892ab9d02a1241c71c64"; // Pizza 4 Pedaços
    const targetCategoryIds = [
      "67c8a570f5798221479520da", // Pizza 8 Pedaços
      "67c8a591f5798221479520db"  // Pizza 12 Pedaços
    ];

    // Buscar produtos da categoria de origem
    const sourceProducts = await productsCollection.find({ 
      categoryId: sourceCategoryId,
      restaurantId: "db34c9be-14a0-40f2-b28b-aeb8b0cf8196" 
    }).toArray();

    console.log(`Encontrados ${sourceProducts.length} produtos na categoria "Pizza 4 Pedaços"`);

    // Para cada categoria destino
    for (const targetCategoryId of targetCategoryIds) {
      // Buscar o nome da categoria para exibir no log
      const targetCategory = await categoriesCollection.findOne({ _id: new ObjectId(targetCategoryId) });
      console.log(`\nDuplicando produtos para a categoria "${targetCategory.name}" (${targetCategoryId})`);

      // Duplicar cada produto
      let duplicatedCount = 0;
      for (const product of sourceProducts) {
        // Criar uma cópia do produto com um novo ID e a nova categoria
        const newProduct = {
          ...product,
          _id: new ObjectId(), // Gera um novo ID
          categoryId: targetCategoryId, // Atribui à nova categoria
          createdAt: new Date().toISOString(), // Atualiza a data de criação
          updatedAt: new Date() // Atualiza a data de modificação
        };

        // Inserir o novo produto
        await productsCollection.insertOne(newProduct);
        duplicatedCount++;

        console.log(`- Produto duplicado: ${product.name}`);
      }

      console.log(`\nTotal de ${duplicatedCount} produtos duplicados para a categoria "${targetCategory.name}"`);
    }

    console.log("\nProcesso de duplicação concluído com sucesso!");

  } catch (error) {
    console.error("Erro durante a execução:", error);
  } finally {
    await client.close();
    console.log("Conexão com o MongoDB fechada");
  }
}

main().catch(console.error); 