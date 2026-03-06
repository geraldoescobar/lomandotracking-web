import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { createAddressSchema, getValidationError } from '@/lib/validation';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const body = await request.json();
    const parsed = createAddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: getValidationError(parsed) }, { status: 400 });
    }

    const { name, street, number, city, province, additionalInfo, latitude, longitude } = parsed.data as any;

    await pool.execute(
      `UPDATE address_book SET name = ?, street = ?, number = ?, city = ?, province = ?, apartment = ?, latitude = ?, longitude = ?, updated_at = NOW()
       WHERE id = ?`,
      [name || null, street, number || null, city, province || null, additionalInfo || null, latitude || null, longitude || null, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Error updating address' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    await pool.execute('DELETE FROM address_book WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Error deleting address' }, { status: 500 });
  }
}
