import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statusId, observation, userId } = body;

    if (!statusId) {
      return NextResponse.json({ error: 'statusId is required' }, { status: 400 });
    }

    const [currentOrder]: any = await pool.execute(
      'SELECT OrderCurrentStatusId FROM `Order` WHERE OrderId = ?',
      [id]
    );

    if (!currentOrder || currentOrder.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousStatusId = currentOrder[0].OrderCurrentStatusId;

    await pool.execute(
      'UPDATE `Order` SET OrderCurrentStatusId = ? WHERE OrderId = ?',
      [statusId, id]
    );

    await pool.execute(
      `INSERT INTO Tracking (TrackingId, OrderId, TrackingPreviousStatusId, TrackingNextStatusId, TrackingObservation, TrackingTimestamp, TrackingUser)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [Date.now(), id, previousStatusId, statusId, observation || '', userId || 'system']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Error updating order status' }, { status: 500 });
  }
}
