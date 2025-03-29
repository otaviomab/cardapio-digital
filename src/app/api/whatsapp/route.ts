import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface CreateInstanceResponse {
  qrcode?: {
    pairingCode?: string;
    base64?: string;
  };
  instance?: {
    status: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autorização
    const authHeader = request.headers.get('Authorization');
    let isAuthorized = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Verificar o token usando Supabase
      const token = authHeader.substring(7);
      const supabase = createRouteHandlerClient({ cookies });
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (user && !error) {
          isAuthorized = true;
          console.log('API whatsapp: Usuário autenticado via token');
        } else {
          console.error('API whatsapp: Erro na autenticação via token:', error);
        }
      } catch (authError) {
        console.error('API whatsapp: Erro ao verificar token:', authError);
      }
    }
    
    // Verificar por autenticação via cookies caso o token falhe
    if (!isAuthorized) {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        isAuthorized = true;
        console.log('API whatsapp: Usuário autenticado via cookies');
      } else {
        console.error('API whatsapp: Erro na autenticação via cookies:', error);
      }
    }
    
    // Retornar erro se não autorizado
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Obter os dados da requisição
    const body = await request.json();
    
    console.log('API whatsapp: Recebendo solicitação:', body);
    
    if (!body.instanceName) {
      return NextResponse.json({ error: 'Nome da instância é obrigatório' }, { status: 400 });
    }
    
    // Preparar payload para a API externa
    const apiPayload: {
      instanceName: string;
      qrcode: boolean;
      integration: string;
      number?: string;
    } = {
      instanceName: body.instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    };

    // Adicionar número apenas se fornecido
    if (body.phoneNumber) {
      apiPayload.number = body.phoneNumber;
    }
    
    console.log('API whatsapp: Enviando requisição para API externa:', apiPayload);
    
    // Fazer requisição para a API externa
    const response = await fetch('https://api.krato.ai/webhook/createInstance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });
    
    // Obter a resposta da API
    const apiResponse = await response.json();
    
    console.log('API whatsapp: Resposta recebida:', apiResponse);
    
    // Retornar diretamente a resposta da API
    return NextResponse.json({
      success: true,
      qrcode: apiResponse[0]?.qrcode ? {
        pairingCode: apiResponse[0].qrcode.pairingCode || '',
        // Remover o prefixo se existir para evitar duplicação no frontend
        base64: apiResponse[0].qrcode.base64 ? 
          apiResponse[0].qrcode.base64.replace('data:image/png;base64,', '') : ''
      } : null,
      instance: apiResponse[0]?.instance
    });
  } catch (error) {
    console.error('API whatsapp: Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar requisição',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 