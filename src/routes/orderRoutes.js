import { Router } from 'express';
import {
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
  updateOrderHandler,
  deleteOrderHandler
} from '../controllers/orderController.js';

const router = Router();

// Criar novo pedido
router.post('/order', createOrderHandler);

// Obter pedido por ID
router.get('/order/:orderId', getOrderHandler);

// Listar todos os pedidos
router.get('/order/list', listOrdersHandler);

// Atualizar pedido
router.put('/order/:orderId', updateOrderHandler);

// Deletar pedido
router.delete('/order/:orderId', deleteOrderHandler);

export default router;
