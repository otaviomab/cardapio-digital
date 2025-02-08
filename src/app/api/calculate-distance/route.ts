import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origem e destino são obrigatórios' },
        { status: 400 }
      )
    }

    // Faz a requisição para a API do Google
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
        origin
      )}&destinations=${encodeURIComponent(
        destination
      )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    // Verifica se a resposta é válida
    if (
      !data.rows?.[0]?.elements?.[0]?.distance?.value ||
      data.rows[0].elements[0].status === 'ZERO_RESULTS'
    ) {
      return NextResponse.json(
        { error: 'Não foi possível calcular a distância' },
        { status: 400 }
      )
    }

    // Retorna a distância em quilômetros
    const distanceInMeters = data.rows[0].elements[0].distance.value
    const distanceInKm = distanceInMeters / 1000

    return NextResponse.json({ distance: distanceInKm })
  } catch (error) {
    console.error('Erro ao calcular distância:', error)
    return NextResponse.json(
      { error: 'Erro ao calcular distância' },
      { status: 500 }
    )
  }
} 