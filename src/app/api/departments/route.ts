import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const [rows] = await pool.execute(
      'SELECT id, name FROM departments WHERE is_active = 1 ORDER BY name'
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Error fetching departments' }, { status: 500 });
  }
}
