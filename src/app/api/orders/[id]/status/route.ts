import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { updateOrderStatusSchema, getValidationError } from '@/lib/validation';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager', 'driver');
    if (roleCheck) return roleCheck;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateOrderStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: getValidationError(parsed) }, { status: 400 });
    }

    const { statusId, observation } = parsed.data;

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
      [id, previousStatusId, statusId, observation, authResult.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Error updating order status' }, { status: 500 });
  }
}
