import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const [users]: any = await pool.execute(
      'SELECT id, email, name, lastname, phone, role FROM users WHERE email = ? AND password_hash = ? AND is_active = TRUE',
      [email, password]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const user = users[0];

    let profile = null;
    if (user.role === 'driver') {
      const [drivers]: any = await pool.execute(
        'SELECT id, name, phone, email, vehicle_info FROM drivers WHERE user_id = ?',
        [user.id]
      );
      if (drivers.length > 0) {
        profile = drivers[0];
      }
    } else if (user.role === 'customer') {
      const [customers]: any = await pool.execute(
        'SELECT id, name, lastname, email, phone, company_id FROM customers WHERE user_id = ?',
        [user.id]
      );
      if (customers.length > 0) {
        profile = customers[0];
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastname: user.lastname,
        phone: user.phone,
        role: user.role,
      },
      profile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}
