import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { createAddressSchema, getValidationError } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const [rows] = await pool.execute(
      `SELECT id, street, number, apartment, city, notes, is_favorite, latitude, longitude
       FROM address_book
       WHERE customer_id = ?
       ORDER BY is_favorite DESC, created_at DESC`,
      [customerId]
    );

    return NextResponse.json(rows || []);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Error fetching addresses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const parsed = createAddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: getValidationError(parsed) }, { status: 400 });
    }

    const { customerId, street, number, apartment, city, notes, latitude, longitude, saveAddress } = parsed.data;

    let addressId = null;

    if (saveAddress) {
      const [result]: any = await pool.execute(
        `INSERT INTO address_book (customer_id, street, number, apartment, city, notes, latitude, longitude, is_favorite)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
        [customerId, street, number || null, apartment || null, city, notes || null, latitude || null, longitude || null]
      );
      addressId = result.insertId;
    }

    return NextResponse.json({ addressId, success: true });
  } catch (error) {
    console.error('Error saving address:', error);
    return NextResponse.json({ error: 'Error saving address' }, { status: 500 });
  }
}
