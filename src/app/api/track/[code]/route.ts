import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    const [orders]: any = await pool.execute(
      `SELECT 
        o.id as orderId,
        o.code as orderCode,
        o.description,
        os.name as statusName,
        os.display_order as statusOrder,
        o.created_at,
        c.name as customerName,
        c.lastname as customerLastname
      FROM orders o
      INNER JOIN customers c ON o.customer_id = c.id
      INNER JOIN order_statuses os ON o.status_id = os.id
      WHERE o.code = ?`,
      [code]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];

    const [steps]: any = await pool.execute(
      `SELECT 
        os.id as stepId,
        os.step_type,
        os.step_order,
        os.address,
        os.contact_name,
        os.contact_phone,
        oss.name as statusName,
        oss.display_order as statusOrder
      FROM order_steps os
      INNER JOIN order_step_statuses oss ON os.status_id = oss.id
      WHERE os.order_id = ?
      ORDER BY os.step_order`,
      [order.orderId]
    );

    order.steps = steps;

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching tracking:', error);
    return NextResponse.json({ error: 'Error fetching tracking' }, { status: 500 });
  }
}
