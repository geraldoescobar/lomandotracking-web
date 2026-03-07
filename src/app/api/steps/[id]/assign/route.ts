import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const { id } = await params;
    const body = await request.json();
    const { driverId } = body; // null to unassign

    // Verify step exists and get order_id
    const [steps]: any = await pool.execute(
      'SELECT order_id, step_type FROM order_steps WHERE id = ?', [id]
    );
    if (!steps || steps.length === 0) {
      return NextResponse.json({ error: 'Step no encontrado' }, { status: 404 });
    }

    if (steps[0].step_type === 'origin') {
      return NextResponse.json({ error: 'No se puede asignar cadete al paso de origen' }, { status: 400 });
    }

    const orderId = steps[0].order_id;

    // Verify driver exists if assigning
    if (driverId) {
      const [drivers]: any = await pool.execute(
        'SELECT id FROM drivers WHERE id = ?', [driverId]
      );
      if (!drivers || drivers.length === 0) {
        return NextResponse.json({ error: 'Cadete no encontrado' }, { status: 404 });
      }
    }

    // Update the step assignment
    await pool.execute(
      'UPDATE order_steps SET assigned_driver_id = ? WHERE id = ?',
      [driverId || null, id]
    );

    // Auto-update order status: if any destination has a driver assigned, set order to "Asignado" (2)
    // but only if order is still "Pendiente" (1)
    const [order]: any = await pool.execute(
      'SELECT status_id FROM orders WHERE id = ?', [orderId]
    );

    if (order[0].status_id === 1) {
      const [assignedSteps]: any = await pool.execute(
        `SELECT COUNT(*) as count FROM order_steps
         WHERE order_id = ? AND step_type != 'origin' AND assigned_driver_id IS NOT NULL`,
        [orderId]
      );

      if (assignedSteps[0].count > 0) {
        await pool.execute(
          'UPDATE orders SET status_id = 2 WHERE id = ?', [orderId]
        );

        // Log tracking
        await pool.execute(
          `INSERT INTO order_tracking (order_id, from_status_id, to_status_id, observation, created_at, created_by)
           VALUES (?, 1, 2, 'Cadete asignado', NOW(), ?)`,
          [orderId, authResult.userId]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning driver:', error);
    return NextResponse.json({ error: 'Error al asignar cadete' }, { status: 500 });
  }
}
