import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const user = authResult;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const [orders]: any = await pool.execute(
      `SELECT
        o.id as orderId,
        o.code as orderCode,
        o.description,
        o.status_id as statusId,
        os.name as statusName,
        os.display_order as statusOrder,
        o.created_at,
        c.id as customerId,
        c.name as customerName,
        c.lastname as customerLastname,
        c.phone as customerPhone,
        c.email as customerEmail
      FROM orders o
      INNER JOIN customers c ON o.customer_id = c.id
      INNER JOIN order_statuses os ON o.status_id = os.id
      WHERE o.code = ?`,
      [code]
    );

    if (orders && orders.length > 0) {
      const order = orders[0];

      const [allSteps]: any = await pool.query(
        `SELECT
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
          os.assigned_driver_id,
          d.name as driverName
        FROM order_steps os
        INNER JOIN order_step_statuses oss ON os.status_id = oss.id
        LEFT JOIN drivers d ON os.assigned_driver_id = d.id
        WHERE os.order_id = ?
        ORDER BY os.step_order`,
        [order.orderId]
      );
      let steps = allSteps;
      let driverSteps: any[] = [];

      if (user.role === 'driver') {
        const [ds]: any = await pool.query(
          `SELECT id FROM drivers WHERE user_id = ?`,
          [user.userId]
        );
        if (ds.length > 0) {
          const driverId = ds[0].id;
          driverSteps = allSteps.filter((s: any) => s.assigned_driver_id === driverId || s.assigned_driver_id === null);
          // Driver only sees origin + their assigned steps
          steps = allSteps.filter((s: any) => s.step_type === 'origin' || s.assigned_driver_id === driverId || s.assigned_driver_id === null);
        }
      }

      const [tracking]: any = await pool.query(
        `SELECT ot.*, oss_from.name as fromStatus, oss_to.name as toStatus
         FROM order_tracking ot
         LEFT JOIN order_step_statuses oss_from ON ot.from_status_id = oss_from.id
         LEFT JOIN order_step_statuses oss_to ON ot.to_status_id = oss_to.id
         WHERE ot.order_id = ?
         ORDER BY ot.created_at DESC`,
        [order.orderId]
      );

      return NextResponse.json({
        type: 'order',
        order,
        steps,
        driverSteps,
        tracking
      });
    }

    const [steps]: any = await pool.execute(
      `SELECT
        os.id as stepId,
        os.order_id,
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
        o.code as orderCode,
        o.description as orderDescription,
        c.name as customerName,
        c.lastname as customerLastname
      FROM order_steps os
      INNER JOIN order_step_statuses oss ON os.status_id = oss.id
      INNER JOIN orders o ON os.order_id = o.id
      INNER JOIN customers c ON o.customer_id = c.id
      WHERE os.code = ?`,
      [code]
    );

    if (!steps || steps.length === 0) {
      return NextResponse.json({ error: 'No se encontró ningún pedido con ese código' }, { status: 404 });
    }

    return NextResponse.json({
      type: 'step',
      step: steps[0]
    });

  } catch (error) {
    console.error('Error scanning:', error);
    return NextResponse.json({ error: 'Error al buscar' }, { status: 500 });
  }
}
