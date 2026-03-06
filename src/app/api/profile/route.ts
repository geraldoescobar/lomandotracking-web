import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const [users]: any = await pool.execute(
      'SELECT id, email, name, lastname, phone, role FROM users WHERE id = ?',
      [authResult.userId]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { name, lastname, phone } = await request.json();

    await pool.execute(
      'UPDATE users SET name = ?, lastname = ?, phone = ? WHERE id = ?',
      [name || '', lastname || '', phone || '', authResult.userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Error updating profile' }, { status: 500 });
  }
}
