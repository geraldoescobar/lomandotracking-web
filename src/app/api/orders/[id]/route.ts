import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows]: any = await pool.execute(
      `SELECT 
        o.*,
        c.CustomerName,
        c.CustomerLastname,
        c.CustomerPhone,
        c.CustomerEmail,
        os.OrderStatusName,
        os.OrderStatusOrder
      FROM \`Order\` o
      LEFT JOIN Customer c ON o.CustomerId = c.CustomerId
      LEFT JOIN OrderStatus os ON o.OrderCurrentStatusId = os.OrderStatusId
      WHERE o.OrderId = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = rows[0];

    const [steps]: any = await pool.execute(
      `SELECT 
        os.*,
        s.OrderStatusName as StepStatusName,
        d.DriverName,
        d.DriverPhone,
        a.AddressStreet,
        a.AddressNumber,
        a.AddressCity,
        r.RegionName
      FROM OrderStep os
      LEFT JOIN OrderStatus s ON os.OrderStepCurrentStatusId = s.OrderStatusId
      LEFT JOIN Driver d ON os.DriverId = d.DriverId
      LEFT JOIN Address a ON os.AddressId = a.AddressId
      LEFT JOIN Region r ON os.OrderStepRegionId = r.RegionId
      WHERE os.OrderId = ?
      ORDER BY os.OrderStepOrder`,
      [id]
    );

    order.steps = steps;

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Error fetching order' }, { status: 500 });
  }
}
