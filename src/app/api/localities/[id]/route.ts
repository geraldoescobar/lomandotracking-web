import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';

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
    const { name, departmentId, isActive } = await request.json();

    if (!name || !departmentId) {
      return NextResponse.json({ error: 'Nombre y departamento son requeridos' }, { status: 400 });
    }

    await pool.execute(
      'UPDATE localities SET name = ?, department_id = ?, is_active = ? WHERE id = ?',
      [name, departmentId, isActive !== false, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe esa localidad en ese departamento' }, { status: 409 });
    }
    console.error('Error updating locality:', error);
    return NextResponse.json({ error: 'Error al actualizar localidad' }, { status: 500 });
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

    // Soft delete - just deactivate
    await pool.execute(
      'UPDATE localities SET is_active = 0 WHERE id = ?', [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting locality:', error);
    return NextResponse.json({ error: 'Error al eliminar localidad' }, { status: 500 });
  }
}
