import { NextResponse } from 'next/server';
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
      'SELECT id, name, lastname, phone, email FROM customers WHERE id = ?',
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 });
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
    const { name, lastname, phone, email } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const [existing]: any = await pool.execute(
      'SELECT id FROM customers WHERE id = ?', [id]
    );
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    await pool.execute(
      `UPDATE customers SET name = ?, lastname = ?, phone = ?, email = ? WHERE id = ?`,
      [name, lastname || '', phone || '', email || '', id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
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

    // Check if customer has orders
    const [orders]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = ?', [id]
    );

    if (orders[0].count > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un cliente que tiene pedidos asociados' },
        { status: 409 }
      );
    }

    await pool.execute('DELETE FROM customers WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
  }
}
