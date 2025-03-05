import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cep = searchParams.get('cep') || '13053143'
    const restaurantAddress = 'Rua orlando bortoletti, 54 - Jardim Marisa, Campinas - SP, 13053216'

    // Teste direto da API de cálculo de distância
    const distanceResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/calculate-distance?origin=${encodeURIComponent(restaurantAddress)}&destination=${encodeURIComponent(cep)}`
    )
    const distanceData = await distanceResponse.json()

    // Teste da API de debug de entrega
    const deliveryResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/debug-delivery?destination=${encodeURIComponent(cep)}`
    )
    const deliveryData = await deliveryResponse.json()

    return NextResponse.json({
      cep,
      restaurantAddress,
      distanceTest: distanceData,
      deliveryTest: deliveryData,
      timestamp: new Date().toISOString(),
      message: 'Esta API é apenas para debug e não deve ser usada em produção'
    })
  } catch (error) {
    console.error('❌ Erro na API de debug do hook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de debug' },
      { status: 500 }
    )
  }
}