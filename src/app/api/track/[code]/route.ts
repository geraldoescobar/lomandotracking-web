import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Public tracking only allows step codes (individual packages).
    // Order-level detail requires authentication.
    const [steps]: any = await pool.execute(
      `SELECT
        s.id as stepId,
        s.code as stepCode,
        s.step_type,
        s.address,
        s.contact_name,
        s.contact_phone,
        s.package_qty,
        oss.name as statusName,
        oss.display_order as statusOrder,
        o.code as orderCode,
        o.description as orderDescription,
        os.name as orderStatusName,
        os.display_order as orderStatusOrder
      FROM order_steps s
      INNER JOIN order_step_statuses oss ON s.status_id = oss.id
      INNER JOIN orders o ON s.order_id = o.id
      INNER JOIN order_statuses os ON o.status_id = os.id
      WHERE s.code = ?`,
      [code]
    );

    if (steps && steps.length > 0) {
      return NextResponse.json({ type: 'step', ...steps[0] });
    }

    return NextResponse.json({ error: 'No se encontró ningún envío con ese código' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    return NextResponse.json({ error: 'Error fetching tracking' }, { status: 500 });
  }
}
