import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;
    const { id } = await params;

    const orderQuery = `
      SELECT
        o.id as orderId,
        o.code as orderCode,
        o.description,
        o.type,
        o.status_id,
        o.notes,
        o.created_at,
        os.name as statusName,
        os.display_order as statusOrder,
        c.id as customerId,
        c.name as customerName,
        c.lastname as customerLastname,
        c.phone as customerPhone,
        c.email as customerEmail
      FROM orders o
      INNER JOIN customers c ON o.customer_id = c.id
      INNER JOIN order_statuses os ON o.status_id = os.id
      WHERE o.id = ?
    `;

    const [orderRows]: any = await pool.query(orderQuery, [id]);

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderRows[0];

    let stepsQuery = '';
    const stepsParams: any[] = [id];

    if (user.role === 'driver') {
      stepsQuery = `
        SELECT
          os.id as stepId,
          os.step_type,
          os.step_order,
          os.address,
          os.contact_name,
          os.contact_phone,
          os.notes,
          os.package_qty,
          os.code as stepCode,
          oss.id as statusId,
          oss.name as statusName,
          oss.display_order as statusOrder,
          d.id as driverId,
          d.name as driverName,
          os.arrived_at
        FROM order_steps os
        INNER JOIN order_step_statuses oss ON os.status_id = oss.id
        LEFT JOIN drivers d ON os.assigned_driver_id = d.id
        WHERE os.order_id = ? AND os.assigned_driver_id = (
          SELECT id FROM drivers WHERE user_id = ?
        )
        ORDER BY os.step_order
      `;
      stepsParams.push(user.userId);
    } else {
      stepsQuery = `
        SELECT
          os.id as stepId,
          os.step_type,
          os.step_order,
          os.address,
          os.contact_name,
          os.contact_phone,
          os.notes,
          os.package_qty,
          os.code as stepCode,
          oss.id as statusId,
          oss.name as statusName,
          oss.display_order as statusOrder,
          d.id as driverId,
          d.name as driverName,
          os.arrived_at
        FROM order_steps os
        INNER JOIN order_step_statuses oss ON os.status_id = oss.id
        LEFT JOIN drivers d ON os.assigned_driver_id = d.id
        WHERE os.order_id = ?
        ORDER BY os.step_order
      `;
    }

    const [steps]: any = await pool.query(stepsQuery, stepsParams);
    order.steps = steps;

    const [tracking]: any = await pool.query(
      `SELECT
        ot.id,
        ot.observation,
        ot.receiver_name,
        ot.receiver_document,
        ot.created_at,
        oss_from.name as fromStatus,
        oss_to.name as toStatus
      FROM order_tracking ot
      LEFT JOIN order_step_statuses oss_from ON ot.from_status_id = oss_from.id
      LEFT JOIN order_step_statuses oss_to ON ot.to_status_id = oss_to.id
      WHERE ot.order_id = ?
      ORDER BY ot.created_at DESC`,
      [id]
    );
    order.tracking = tracking;

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Error fetching order' }, { status: 500 });
  }
}

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
    const { description, notes, steps } = body;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Update order-level fields
      if (description !== undefined || notes !== undefined) {
        const fields: string[] = [];
        const values: any[] = [];

        if (description !== undefined) {
          fields.push('description = ?');
          values.push(description);
        }
        if (notes !== undefined) {
          fields.push('notes = ?');
          values.push(notes);
        }

        if (fields.length > 0) {
          values.push(id);
          await conn.execute(
            `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
            values
          );
        }
      }

      // Update individual steps
      if (steps && Array.isArray(steps)) {
        for (const step of steps) {
          if (!step.stepId) continue;

          const stepFields: string[] = [];
          const stepValues: any[] = [];

          if (step.address !== undefined) {
            stepFields.push('address = ?');
            stepValues.push(step.address);
          }
          if (step.contact_name !== undefined) {
            stepFields.push('contact_name = ?');
            stepValues.push(step.contact_name);
          }
          if (step.contact_phone !== undefined) {
            stepFields.push('contact_phone = ?');
            stepValues.push(step.contact_phone);
          }
          if (step.notes !== undefined) {
            stepFields.push('notes = ?');
            stepValues.push(step.notes);
          }
          if (step.package_qty !== undefined) {
            stepFields.push('package_qty = ?');
            stepValues.push(step.package_qty);
          }

          if (stepFields.length > 0) {
            stepValues.push(step.stepId);
            await conn.execute(
              `UPDATE order_steps SET ${stepFields.join(', ')} WHERE id = ?`,
              stepValues
            );
          }
        }
      }

      await conn.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 });
  }
}
