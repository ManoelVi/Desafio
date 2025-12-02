import pool from '../db.js';

export async function createOrder(order) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertOrderText = `
      INSERT INTO "Order" (orderId, value, creationDate)
      VALUES ($1, $2, $3)
    `;
    await client.query(insertOrderText, [
      order.orderId,
      order.value,
      order.creationDate
    ]);

    const insertItemText = `
      INSERT INTO "Items" (orderId, productId, quantity, price)
      VALUES ($1, $2, $3, $4)
    `;

    for (const item of order.items) {
      await client.query(insertItemText, [
        order.orderId,
        item.productId,
        item.quantity,
        item.price
      ]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return order;
}

export async function getOrderById(orderId) {
  const queryOrder = `
    SELECT o.orderId, o.value, o.creationDate,
           i.productId, i.quantity, i.price
    FROM "Order" o
    LEFT JOIN "Items" i ON o.orderId = i.orderId
    WHERE o.orderId = $1
  `;

  const { rows } = await pool.query(queryOrder, [orderId]);

  if (rows.length === 0) {
    return null;
  }

  const first = rows[0];
  const order = {
    orderId: first.orderId,
    value: Number(first.value),
    creationDate: first.creationDate.toISOString(),
    items: rows
      .filter(r => r.productid !== null)
      .map(r => ({
        productId: r.productid,
        quantity: r.quantity,
        price: Number(r.price)
      }))
  };

  return order;
}

export async function getAllOrders() {
  const query = `
    SELECT o.orderId, o.value, o.creationDate,
           i.productId, i.quantity, i.price
    FROM "Order" o
    LEFT JOIN "Items" i ON o.orderId = i.orderId
    ORDER BY o.creationDate DESC, o.orderId
  `;

  const { rows } = await pool.query(query);

  const map = new Map();

  for (const r of rows) {
    if (!map.has(r.orderid)) {
      map.set(r.orderid, {
        orderId: r.orderid,
        value: Number(r.value),
        creationDate: r.creationdate.toISOString(),
        items: []
      });
    }

    if (r.productid !== null) {
      map.get(r.orderid).items.push({
        productId: r.productid,
        quantity: r.quantity,
        price: Number(r.price)
      });
    }
  }

  return Array.from(map.values());
}

export async function updateOrder(orderId, order) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateOrderText = `
      UPDATE "Order"
      SET value = $1, creationDate = $2
      WHERE orderId = $3
    `;
    const result = await client.query(updateOrderText, [
      order.value,
      order.creationDate,
      orderId
    ]);

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      'DELETE FROM "Items" WHERE orderId = $1',
      [orderId]
    );

    const insertItemText = `
      INSERT INTO "Items" (orderId, productId, quantity, price)
      VALUES ($1, $2, $3, $4)
    `;

    for (const item of order.items) {
      await client.query(insertItemText, [
        orderId,
        item.productId,
        item.quantity,
        item.price
      ]);
    }

    await client.query('COMMIT');

    return {
      ...order,
      orderId
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteOrder(orderId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM "Items" WHERE orderId = $1', [orderId]);
    const { rowCount } = await client.query(
      'DELETE FROM "Order" WHERE orderId = $1',
      [orderId]
    );

    await client.query('COMMIT');
    return rowCount > 0;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
