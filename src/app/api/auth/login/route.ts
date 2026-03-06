import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signToken } from '@/lib/auth';
import { loginSchema, getValidationError } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: getValidationError(parsed) }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const [users]: any = await pool.execute(
      'SELECT id, email, name, lastname, phone, role, password_hash FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const user = users[0];

    // Support both bcrypt hashes and legacy plain text passwords
    let passwordValid = false;
    if (user.password_hash.startsWith('$2')) {
      passwordValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Legacy: plain text comparison (migrate on successful login)
      passwordValid = password === user.password_hash;
      if (passwordValid) {
        const hashed = await bcrypt.hash(password, 10);
        await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, user.id]);
      }
    }

    if (!passwordValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

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
      token,
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
