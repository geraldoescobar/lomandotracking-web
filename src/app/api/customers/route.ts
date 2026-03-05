import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = 'SELECT CustomerId, CustomerName, CustomerLastname, CustomerPhone, CustomerEmail FROM Customer WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (CustomerName LIKE ? OR CustomerLastname LIKE ? OR CustomerCI LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' LIMIT 50';

    const [rows] = await pool.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Error fetching customers' }, { status: 500 });
  }
}
