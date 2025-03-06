import { NextResponse } from 'next/server'
import { calculateDistance } from '@/services/distanceService'
import { 
  InvalidParametersError, 
  DistanceCalculationError, 
  GoogleApiError, 
  AddressNotFoundError,
  AppError
} from '@/services/errors'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')

    console.log('🧭 API CALCULATE-DISTANCE - Solicitação recebida:', {
      origin,
      destination
    })

    if (!origin || !destination) {
      console.log('❌ Erro: Origem ou destino ausentes')
      return NextResponse.json(
        { error: 'Origem e destino são obrigatórios' },
        { status: 400 }
      )
    }

    // Usa o serviço centralizado para calcular a distância
    const roundedDistance = await calculateDistance(origin, destination)
    
    return NextResponse.json({ distance: roundedDistance })
  } catch (error) {
    console.error('❌ Erro ao calcular distância:', error)
    
    // Tratamento específico para cada tipo de erro
    if (error instanceof InvalidParametersError) {
      return NextResponse.json(
        { error: error.message, errorType: error.name },
        { status: 400 }
      )
    } else if (error instanceof AddressNotFoundError) {
      return NextResponse.json(
        { error: error.message, errorType: error.name },
        { status: 404 }
      )
    } else if (error instanceof GoogleApiError) {
      return NextResponse.json(
        { error: error.message, errorType: error.name, status: error.status },
        { status: 502 } // Bad Gateway - erro no serviço externo
      )
    } else if (error instanceof DistanceCalculationError) {
      return NextResponse.json(
        { error: error.message, errorType: error.name },
        { status: 422 } // Unprocessable Entity - não foi possível processar
      )
    } else if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, errorType: error.name },
        { status: 500 }
      )
    } else {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao calcular distância' },
        { status: 500 }
      )
    }
  }
} 