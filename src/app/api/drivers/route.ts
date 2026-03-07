import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

    let query = `
      SELECT d.id, d.name, d.phone, d.email, d.vehicle_info,
             u.id as userId, u.email as userEmail, u.is_active as isActive
      FROM drivers d
      INNER JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ' AND (d.name LIKE ? OR d.phone LIKE ? OR d.email LIKE ?)';
      const p = `%${search}%`;
      params.push(p, p, p);
    }

    query += ' ORDER BY d.name ASC LIMIT 100';

    const [rows] = await pool.execute(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Error al obtener cadetes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const body = await request.json();
    const { name, phone, email, vehicleInfo, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 });
    }

    // Check if email already exists
    const [existing]: any = await pool.execute(
      'SELECT id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `INSERT INTO users (id, email, name, phone, role, password_hash, is_active)
         VALUES (?, ?, ?, ?, 'driver', ?, TRUE)`,
        [userId, email, name, phone || '', passwordHash]
      );

      const [result]: any = await conn.execute(
        `INSERT INTO drivers (user_id, name, phone, email, vehicle_info)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, name, phone || '', email, vehicleInfo || '']
      );

      await conn.commit();

      return NextResponse.json({ id: result.insertId, userId }, { status: 201 });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error('Error creating driver:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe un registro con esos datos' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear cadete' }, { status: 500 });
  }
}
