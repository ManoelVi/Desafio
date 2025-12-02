import {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrder,
  deleteOrder
} from '../repositories/orderRepository.js';

function mapRequestToOrderModel(body) {
  if (!body) {
    throw new Error('Body is required');
  }

  const { numeroPedido, valorTotal, dataCriacao, items } = body;

  if (!numeroPedido || valorTotal == null || !dataCriacao || !Array.isArray(items)) {
    const err = new Error('Invalid payload: missing required fields');
    err.statusCode = 400;
    throw err;
  }

  const mapped = {
    orderId: numeroPedido,
    value: Number(valorTotal),
    creationDate: new Date(dataCriacao),
    items: items.map((item) => {
      if (!item.idItem || item.quantidadeItem == null || item.valorItem == null) {
        const err = new Error('Invalid item payload');
        err.statusCode = 400;
        throw err;
      }

      return {
        productId: parseInt(item.idItem, 10),
        quantity: Number(item.quantidadeItem),
        price: Number(item.valorItem)
      };
    })
  };

  if (Number.isNaN(mapped.value)) {
    const err = new Error('valorTotal must be a number');
    err.statusCode = 400;
    throw err;
  }

  if (mapped.items.some(i => Number.isNaN(i.productId))) {
    const err = new Error('idItem must be numeric');
    err.statusCode = 400;
    throw err;
  }

  if (mapped.items.some(i => Number.isNaN(i.quantity) || Number.isNaN(i.price))) {
    const err = new Error('quantidadeItem and valorItem must be numeric');
    err.statusCode = 400;
    throw err;
  }

  return mapped;
}

function mapOrderModelToResponse(orderModel) {
  return {
    orderId: orderModel.orderId,
    value: Number(orderModel.value),
    creationDate: typeof orderModel.creationDate === 'string'
      ? orderModel.creationDate
      : orderModel.creationDate.toISOString(),
    items: orderModel.items || []
  };
}

export async function createOrderHandler(req, res) {
  try {
    console.log('Body recebido:', req.body);

    const orderModel = mapRequestToOrderModel(req.body);
    const saved = await createOrder(orderModel);

    const response = mapOrderModelToResponse(saved);

    return res.status(201).json(response);
  } catch (err) {
    console.error('Error creating order:', err);
    const status = err.statusCode || 500;
    return res.status(status).json({
      message: err.statusCode ? err.message : 'Internal server error'
    });
  }
}


export async function getOrderHandler(req, res) {
  try {
    const { orderId } = req.params;

    const order = await getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const response = mapOrderModelToResponse(order);
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error getting order:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function listOrdersHandler(req, res) {
  try {
    const orders = await getAllOrders();
    const response = orders.map(o => mapOrderModelToResponse(o));
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error listing orders:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function updateOrderHandler(req, res) {
  try {
    const { orderId } = req.params;
    const orderModel = mapRequestToOrderModel(req.body);

    const updated = await updateOrder(orderId, orderModel);
    if (!updated) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const response = mapOrderModelToResponse(updated);

    return res.status(200).json(response);
  } catch (err) {
    console.error('Error updating order:', err);
    const status = err.statusCode || 500;
    return res.status(status).json({
      message: err.statusCode ? err.message : 'Internal server error'
    });
  }
}

export async function deleteOrderHandler(req, res) {
  try {
    const { orderId } = req.params;
    const deleted = await deleteOrder(orderId);

    if (!deleted) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting order:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
