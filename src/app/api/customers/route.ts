import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = `SELECT id, name, lastname, phone, email FROM customers WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR lastname LIKE ? OR phone LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY name ASC LIMIT 100';

    const [rows] = await pool.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const body = await request.json();
    const { name, lastname, phone, email } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO customers (id, name, lastname, phone, email)
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, lastname || '', phone || '', email || '']
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe un cliente con esos datos' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}
