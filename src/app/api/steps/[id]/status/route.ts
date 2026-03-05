import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statusId, userId, observation, receiverName, receiverDocument } = body;

    if (!statusId) {
      return NextResponse.json({ error: 'statusId requerido' }, { status: 400 });
    }

    const [currentStep]: any = await pool.execute(
      'SELECT order_id, status_id FROM order_steps WHERE id = ?',
      [id]
    );

    if (!currentStep || currentStep.length === 0) {
      return NextResponse.json({ error: 'Step no encontrado' }, { status: 404 });
    }

    const orderId = currentStep[0].order_id;
    const previousStatusId = currentStep[0].status_id;

    await pool.execute(
      'UPDATE order_steps SET status_id = ? WHERE id = ?',
      [statusId, id]
    );

    await pool.execute(
      `INSERT INTO order_tracking (order_id, step_id, from_status_id, to_status_id, observation, receiver_name, receiver_document, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [orderId, id, previousStatusId, statusId, observation || '', receiverName || '', receiverDocument || '', userId || 'system']
    );

    const [steps]: any = await pool.query(
      'SELECT status_id FROM order_steps WHERE order_id = ?',
      [orderId]
    );

    let newOrderStatus = 1;
    const hasInProgress = steps.some((s: any) => s.status_id === 3);
    const hasTraveling = steps.some((s: any) => s.status_id === 3);
    const allFinal = steps.every((s: any) => s.status_id >= 5);
    const allDelivered = steps.every((s: any) => s.status_id === 5);

    if (allDelivered) {
      newOrderStatus = 4;
    } else if (allFinal) {
      newOrderStatus = 5;
    } else if (hasInProgress || hasTraveling) {
      newOrderStatus = 3;
    } else if (steps.some((s: any) => s.status_id >= 2)) {
      newOrderStatus = 2;
    }

    await pool.execute(
      'UPDATE orders SET status_id = ? WHERE id = ?',
      [newOrderStatus, orderId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating step status:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
