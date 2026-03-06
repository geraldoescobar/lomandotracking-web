import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const search = request.nextUrl.searchParams.get('search') || '';
    const departmentId = request.nextUrl.searchParams.get('departmentId');

    let query = `
      SELECT l.id, l.name, l.department_id AS departmentId, d.name AS departmentName
      FROM localities l
      JOIN departments d ON d.id = l.department_id
      WHERE l.is_active = 1
    `;
    const params: any[] = [];

    if (departmentId) {
      query += ' AND l.department_id = ?';
      params.push(departmentId);
    }

    if (search) {
      query += ' AND l.name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY d.name, l.name LIMIT 50';

    const [rows] = await pool.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching localities:', error);
    return NextResponse.json({ error: 'Error fetching localities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const { name, departmentId } = await request.json();

    if (!name || !departmentId) {
      return NextResponse.json({ error: 'Nombre y departamento requeridos' }, { status: 400 });
    }

    const [result]: any = await pool.execute(
      'INSERT INTO localities (name, department_id) VALUES (?, ?)',
      [name, departmentId]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Esa localidad ya existe en ese departamento' }, { status: 409 });
    }
    console.error('Error creating locality:', error);
    return NextResponse.json({ error: 'Error creating locality' }, { status: 500 });
  }
}
