import { CheckCircle2 } from 'lucide-react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import Link from 'next/link'

interface PageProps {
  params: {
    orderId: string
  }
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { orderId } = params
  
  // Conecta ao MongoDB
  const client = await clientPromise
  const db = client.db('cardapio_digital')
  
  // Busca o pedido específico
  const order = await db.collection('orders').findOne({
    _id: new ObjectId(orderId)
  })

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Pedido não encontrado</h1>
          <p className="mt-2 text-gray-600">O pedido que você procura não existe ou não está disponível.</p>
        </div>
      </div>
    )
  }

  // Busca todos os pedidos do mesmo dia para gerar o número sequencial
  const orderDate = new Date(order.createdAt)
  const startOfDay = new Date(orderDate.setHours(0, 0, 0, 0))
  const endOfDay = new Date(orderDate.setHours(23, 59, 59, 999))

  const ordersFromSameDay = await db.collection('orders')
    .find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .sort({ createdAt: 1 })
    .toArray()

  // Função para gerar o número do pedido
  const generateOrderNumber = () => {
    // Encontra a posição do pedido atual
    const orderPosition = ordersFromSameDay.findIndex(o => 
      o._id.toString() === orderId
    ) + 1

    // Formata o número do pedido: número sequencial do dia
    return orderPosition.toString().padStart(2, '0')
  }

  // Define o status do pedido
  const status = {
    label: order.status === 'pending' ? 'Pendente' :
           order.status === 'confirmed' ? 'Confirmado' :
           order.status === 'preparing' ? 'Em preparação' :
           order.status === 'ready' ? 'Pronto' :
           order.status === 'out_for_delivery' ? 'Saiu para entrega' :
           order.status === 'delivered' ? 'Entregue' :
           order.status === 'completed' ? 'Finalizado' :
           order.status === 'rejected' ? 'Recusado' : 'Cancelado'
  }

  // Formata o preço em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Mapeamento dos métodos de pagamento
  const paymentMethods = {
    credit_card: 'Cartão de Crédito',
    debit_card: 'Cartão de Débito',
    pix: 'PIX',
    cash: 'Dinheiro',
    meal_voucher: 'Vale-Refeição',
    // Compatibilidade com formatos antigos
    credit: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    wallet: 'Vale-Refeição'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pedido #{generateOrderNumber()}
          </h2>
          <p className="text-sm text-gray-500">
            {status.label}
          </p>
        </div>
      </div>
      
      {/* Detalhes do Pedido */}
      <div className="mt-8 space-y-6">
        {/* Informações do Cliente */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900">Informações do Cliente</h3>
          <div className="mt-4 space-y-2">
            <p><span className="font-medium">Nome:</span> {order.customer?.name || 'Não informado'}</p>
            <p><span className="font-medium">Telefone:</span> {order.customer?.phone || 'Não informado'}</p>
            {order.customer?.email && <p><span className="font-medium">Email:</span> {order.customer.email}</p>}
            
            <p>
              <span className="font-medium">Método de Entrega:</span> {' '}
              {order.deliveryMethod === 'delivery' ? 'Entrega' : 'Retirada'}
            </p>
            
            {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
              <div className="mt-2">
                <p className="font-medium">Endereço de Entrega:</p>
                <p className="text-gray-700">
                  {order.deliveryAddress.street}, {order.deliveryAddress.number}
                  {order.deliveryAddress.complement && ` - ${order.deliveryAddress.complement}`}
                </p>
                <p className="text-gray-700">
                  {order.deliveryAddress.neighborhood}, {order.deliveryAddress.city}/{order.deliveryAddress.state}
                </p>
                <p className="text-gray-700">
                  CEP: {order.deliveryAddress.zipCode}
                </p>
              </div>
            )}
            
            <p>
              <span className="font-medium">Método de Pagamento:</span> {' '}
              {paymentMethods[order.paymentMethod] || order.paymentMethod || 'Não informado'}
              {order.paymentMethod === 'cash' && order.change && (
                <span className="ml-1 text-gray-600">(Troco para {formatCurrency(parseFloat(order.change))})</span>
              )}
            </p>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900">Itens do Pedido</h3>
          <div className="mt-4 space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.quantity}x {item.name}
                    </p>
                    
                    {/* Informações de Meia a Meia */}
                    {item.isHalfHalf && item.halfHalf && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 rounded-full bg-krato-500"></div>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Primeira metade:</span> {item.halfHalf.firstHalf.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-3 w-3 rounded-full bg-krato-700"></div>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Segunda metade:</span> {item.halfHalf.secondHalf.name}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Adicionais da primeira metade */}
                    {item.isHalfHalf && item.halfHalf && item.halfHalf.firstHalf.additions?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Adicionais (Primeira metade):</p>
                        {item.halfHalf.firstHalf.additions.map((addition, idx) => (
                          <p key={`first-half-add-${idx}`} className="text-sm text-gray-600">
                            + {addition.name}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Adicionais da segunda metade */}
                    {item.isHalfHalf && item.halfHalf && item.halfHalf.secondHalf.additions?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Adicionais (Segunda metade):</p>
                        {item.halfHalf.secondHalf.additions.map((addition, idx) => (
                          <p key={`second-half-add-${idx}`} className="text-sm text-gray-600">
                            + {addition.name}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Adicionais normais (não meio a meio) */}
                    {!item.isHalfHalf && item.additions && item.additions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Adicionais:</p>
                        {item.additions.map((addition, idx) => (
                          <p key={`addition-${idx}`} className="text-sm text-gray-600">
                            + {addition.name}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {/* Observações */}
                    {(item.observations || item.observation) && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Observação:</span> {item.observations || item.observation}
                      </p>
                    )}
                  </div>
                  
                  <p className="font-medium text-gray-900">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="mt-4 border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">Subtotal:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(order.subtotal || order.total - (order.deliveryFee || 0))}
                </span>
              </div>
              
              {order.deliveryFee > 0 && (
                <div className="flex justify-between mt-2">
                  <span className="text-gray-700">Taxa de entrega:</span>
                  <span className="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
                </div>
              )}
              
              <div className="flex justify-between mt-2">
                <span className="font-medium text-gray-900">Total:</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Link 
        href="/"
        className="mt-8 inline-block rounded-lg bg-krato-500 px-4 py-2 text-sm font-medium text-white hover:bg-krato-600"
      >
        Voltar para o início
      </Link>
    </div>
  )
} 