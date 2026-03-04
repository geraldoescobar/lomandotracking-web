import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const statusId = searchParams.get('statusId');
    const limit = searchParams.get('limit') || '50';

    let query = `
      SELECT 
        o.*,
        c.CustomerName,
        c.CustomerLastname,
        c.CustomerPhone,
        os.OrderStatusName,
        os.OrderStatusOrder
      FROM \`Order\` o
      LEFT JOIN Customer c ON o.CustomerId = c.CustomerId
      LEFT JOIN OrderStatus os ON o.OrderCurrentStatusId = os.OrderStatusId
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (customerId) {
      query += ' AND o.CustomerId = ?';
      params.push(customerId);
    }

    if (statusId) {
      query += ' AND o.OrderCurrentStatusId = ?';
      params.push(statusId);
    }

    query += ' ORDER BY o.OrderCreatedAt DESC LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await pool.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
  }
}
