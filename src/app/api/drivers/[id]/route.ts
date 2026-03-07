import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const { id } = await params;

    const [rows]: any = await pool.execute(
      `SELECT d.id, d.name, d.phone, d.email, d.vehicle_info,
              u.id as userId, u.email as userEmail, u.is_active as isActive
       FROM drivers d
       INNER JOIN users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Cadete no encontrado' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching driver:', error);
    return NextResponse.json({ error: 'Error al obtener cadete' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, vehicleInfo, isActive, password } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 });
    }

    // Get the user_id for this driver
    const [driver]: any = await pool.execute(
      'SELECT user_id FROM drivers WHERE id = ?', [id]
    );
    if (!driver || driver.length === 0) {
      return NextResponse.json({ error: 'Cadete no encontrado' }, { status: 404 });
    }

    const userId = driver[0].user_id;

    // Check email uniqueness (excluding current user)
    const [existing]: any = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe otro usuario con ese email' }, { status: 409 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        await conn.execute(
          `UPDATE users SET email = ?, name = ?, phone = ?, is_active = ?, password_hash = ? WHERE id = ?`,
          [email, name, phone || '', isActive !== false, passwordHash, userId]
        );
      } else {
        await conn.execute(
          `UPDATE users SET email = ?, name = ?, phone = ?, is_active = ? WHERE id = ?`,
          [email, name, phone || '', isActive !== false, userId]
        );
      }

      await conn.execute(
        `UPDATE drivers SET name = ?, phone = ?, email = ?, vehicle_info = ? WHERE id = ?`,
        [name, phone || '', email, vehicleInfo || '', id]
      );

      await conn.commit();

      return NextResponse.json({ success: true });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error: any) {
    console.error('Error updating driver:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe un registro con esos datos' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al actualizar cadete' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const { id } = await params;

    // Check if driver has assigned steps
    const [assigned]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM order_steps WHERE assigned_driver_id = ?', [id]
    );

    const driver_: any = await pool.execute(
      'SELECT user_id FROM drivers WHERE id = ?', [id]
    );
    const driverRows = driver_[0];
    if (!driverRows || driverRows.length === 0) {
      return NextResponse.json({ error: 'Cadete no encontrado' }, { status: 404 });
    }

    if (assigned[0].count > 0) {
      // Soft delete: deactivate user instead of deleting
      await pool.execute(
        'UPDATE users SET is_active = FALSE WHERE id = ?',
        [driverRows[0].user_id]
      );
      return NextResponse.json({ success: true, softDeleted: true });
    }

    // Hard delete if no assignments
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM drivers WHERE id = ?', [id]);
      await conn.execute('DELETE FROM users WHERE id = ?', [driverRows[0].user_id]);
      await conn.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: 'Error al eliminar cadete' }, { status: 500 });
  }
}
