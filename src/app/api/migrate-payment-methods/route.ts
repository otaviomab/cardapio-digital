import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    
    // Mapeamento de métodos de pagamento antigos para novos
    const paymentMethodMapping = {
      'credit': 'credit_card',
      'debit': 'debit_card',
      'wallet': 'meal_voucher'
    }
    
    let totalUpdated = 0
    let totalFound = 0
    
    // 1. Migrar pedidos com payment.method (estrutura antiga)
    const oldStructureOrders = await db.collection('orders').find({
      'payment.method': { $in: Object.keys(paymentMethodMapping) }
    }).toArray()
    
    totalFound += oldStructureOrders.length
    console.log(`Encontrados ${oldStructureOrders.length} pedidos com estrutura antiga para migração`)
    
    // Atualiza cada pedido com estrutura antiga
    if (oldStructureOrders.length > 0) {
      const oldStructurePromises = oldStructureOrders.map(async (order) => {
        const oldMethod = order.payment.method
        const newMethod = paymentMethodMapping[oldMethod as keyof typeof paymentMethodMapping]
        
        if (newMethod) {
          return db.collection('orders').updateOne(
            { _id: order._id },
            { $set: { 'payment.method': newMethod } }
          )
        }
        
        return null
      })
      
      const oldStructureResults = await Promise.all(oldStructurePromises)
      const oldStructureUpdated = oldStructureResults.filter(Boolean).length
      totalUpdated += oldStructureUpdated
      
      console.log(`Atualizados ${oldStructureUpdated} pedidos com estrutura antiga`)
    }
    
    // 2. Migrar pedidos com paymentMethod (estrutura nova)
    const newStructureOrders = await db.collection('orders').find({
      'paymentMethod': { $in: Object.keys(paymentMethodMapping) }
    }).toArray()
    
    totalFound += newStructureOrders.length
    console.log(`Encontrados ${newStructureOrders.length} pedidos com estrutura nova para migração`)
    
    // Atualiza cada pedido com estrutura nova
    if (newStructureOrders.length > 0) {
      const newStructurePromises = newStructureOrders.map(async (order) => {
        const oldMethod = order.paymentMethod
        const newMethod = paymentMethodMapping[oldMethod as keyof typeof paymentMethodMapping]
        
        if (newMethod) {
          return db.collection('orders').updateOne(
            { _id: order._id },
            { $set: { 'paymentMethod': newMethod } }
          )
        }
        
        return null
      })
      
      const newStructureResults = await Promise.all(newStructurePromises)
      const newStructureUpdated = newStructureResults.filter(Boolean).length
      totalUpdated += newStructureUpdated
      
      console.log(`Atualizados ${newStructureUpdated} pedidos com estrutura nova`)
    }
    
    // Detalhes da migração por tipo de método
    const migrationDetails = {
      credit_to_credit_card: 0,
      debit_to_debit_card: 0,
      wallet_to_meal_voucher: 0
    }
    
    // Conta quantos de cada tipo foram migrados
    for (const order of [...oldStructureOrders, ...newStructureOrders]) {
      const method = order.payment?.method || order.paymentMethod
      if (method === 'credit') migrationDetails.credit_to_credit_card++
      if (method === 'debit') migrationDetails.debit_to_debit_card++
      if (method === 'wallet') migrationDetails.wallet_to_meal_voucher++
    }
    
    return NextResponse.json({
      success: true,
      message: `Migração concluída. ${totalUpdated} pedidos atualizados.`,
      details: {
        found: totalFound,
        updated: totalUpdated,
        byType: migrationDetails
      }
    })
  } catch (error) {
    console.error('Erro na migração de métodos de pagamento:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao migrar métodos de pagamento',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 