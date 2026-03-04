import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT OrderStatusId, OrderStatusName, OrderStatusOrder, OrderStatusIsFinal FROM OrderStatus ORDER BY OrderStatusOrder'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json({ error: 'Error fetching statuses' }, { status: 500 });
  }
}
