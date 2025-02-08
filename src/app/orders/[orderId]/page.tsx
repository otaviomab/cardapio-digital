const generateOrderNumber = (order: Order) => {
  const orderDate = new Date(order.createdAt)
  
  // Agrupa pedidos do mesmo dia
  const ordersFromSameDay = orders.filter(o => {
    const date = new Date(o.createdAt)
    return date.toDateString() === orderDate.toDateString()
  })

  // Ordena os pedidos do dia por data de criação
  ordersFromSameDay.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  // Encontra a posição do pedido atual
  const orderPosition = ordersFromSameDay.findIndex(o => o._id === order._id) + 1

  // Formata o número do pedido: ID + número sequencial do dia
  return orderPosition.toString().padStart(2, '0')
}

<div className="flex items-center gap-2">
  <CheckCircle2 className="h-5 w-5 text-green-500" />
  <div>
    <h2 className="text-lg font-semibold text-gray-900">
      Pedido #{generateOrderNumber(order)}
    </h2>
    <p className="text-sm text-gray-500">
      {status.label}
    </p>
  </div>
</div> 