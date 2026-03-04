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
        t.*,
        ps.OrderStatusName as PreviousStatusName,
        ns.OrderStatusName as NextStatusName
      FROM Tracking t
      LEFT JOIN OrderStatus ps ON t.TrackingPreviousStatusId = ps.OrderStatusId
      LEFT JOIN OrderStatus ns ON t.TrackingNextStatusId = ns.OrderStatusId
      WHERE t.OrderId = ?
      ORDER BY t.TrackingTimestamp DESC`,
      [id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching tracking:', error);
    return NextResponse.json({ error: 'Error fetching tracking' }, { status: 500 });
  }
}
