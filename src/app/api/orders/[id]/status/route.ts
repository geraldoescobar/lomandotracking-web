import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statusId, userId, observation } = body;

    if (!statusId) {
      return NextResponse.json({ error: 'statusId is required' }, { status: 400 });
    }

    const [currentOrder]: any = await pool.execute(
      'SELECT status_id FROM orders WHERE id = ?',
      [id]
    );

    if (!currentOrder || currentOrder.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatusId = currentOrder[0].status_id;

    await pool.execute(
      'UPDATE orders SET status_id = ? WHERE id = ?',
      [statusId, id]
    );

    await pool.execute(
      `INSERT INTO order_tracking (order_id, from_status_id, to_status_id, observation, created_at, created_by)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [id, previousStatusId, statusId, observation || '', userId || 'system']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Error updating order status' }, { status: 500 });
  }
}
