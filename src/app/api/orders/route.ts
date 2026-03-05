import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;
    const { searchParams } = new URL(request.url);
    const statusId = searchParams.get('statusId');
    const limit = searchParams.get('limit') || '50';

    let query = '';
    const params: any[] = [];

    if (user.role === 'driver') {
      query = `
        SELECT DISTINCT
          o.id as orderId,
          o.code as orderCode,
          o.description,
          o.type,
          o.status_id,
          os.name as statusName,
          os.display_order as statusOrder,
          o.created_at,
          c.id as customerId,
          c.name as customerName,
          c.lastname as customerLastname,
          c.phone as customerPhone
        FROM orders o
        INNER JOIN order_steps ostep ON o.id = ostep.order_id
        INNER JOIN drivers d ON ostep.assigned_driver_id = d.id
        INNER JOIN customers c ON o.customer_id = c.id
        INNER JOIN order_statuses os ON o.status_id = os.id
        WHERE d.user_id = ?
      `;
      params.push(user.userId);

      if (statusId) {
        query += ' AND o.status_id = ?';
        params.push(statusId);
      }

      query += ' ORDER BY o.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

    } else if (user.role === 'customer') {
      query = `
        SELECT
          o.id as orderId,
          o.code as orderCode,
          o.description,
          o.type,
          o.status_id,
          os.name as statusName,
          os.display_order as statusOrder,
          o.created_at,
          c.id as customerId,
          c.name as customerName,
          c.lastname as customerLastname,
          c.phone as customerPhone
        FROM orders o
        INNER JOIN customers c ON o.customer_id = c.id
        INNER JOIN order_statuses os ON o.status_id = os.id
        WHERE c.user_id = ?
      `;
      params.push(user.userId);

      if (statusId) {
        query += ' AND o.status_id = ?';
        params.push(statusId);
      }

      query += ' ORDER BY o.created_at DESC LIMIT ?';
      params.push(parseInt(limit));

    } else {
      query = `
        SELECT
          o.id as orderId,
          o.code as orderCode,
          o.description,
          o.type,
          o.status_id,
          os.name as statusName,
          os.display_order as statusOrder,
          o.created_at,
          c.id as customerId,
          c.name as customerName,
          c.lastname as customerLastname,
          c.phone as customerPhone
        FROM orders o
        INNER JOIN customers c ON o.customer_id = c.id
        INNER JOIN order_statuses os ON o.status_id = os.id
        WHERE 1=1
      `;

      if (statusId) {
        query += ' AND o.status_id = ?';
        params.push(statusId);
      }

      query += ' ORDER BY o.created_at DESC LIMIT ?';
      params.push(parseInt(limit));
    }

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows || []);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
  }
}
