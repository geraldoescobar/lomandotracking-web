import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { authenticateRequest, authorizeRoles } from '@/lib/auth';
import { createOrderSchema, getValidationError } from '@/lib/validation';

function generateOrderCode(lastId: number): string {
  const orderNum = String(lastId + 1).padStart(8, '0');
  return `D${orderNum}0000`;
}

function generateStepCode(orderCode: string, stepOrder: number, packageQty: number): string {
  const base = orderCode.substring(0, 9);
  return `${base}${String(stepOrder * 100 + packageQty).padStart(4, '0')}`;
}

export async function POST(request: Request) {
  try {
    const authResult = authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const roleCheck = authorizeRoles(authResult, 'manager');
    if (roleCheck) return roleCheck;

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: getValidationError(parsed) }, { status: 400 });
    }

    const { customerId, description, notes, type, originStep, destinationSteps } = parsed.data;

    const [lastOrder]: any = await pool.execute(
      'SELECT MAX(id) as lastId FROM orders'
    );
    const newOrderCode = generateOrderCode(lastOrder[0]?.lastId || 0);

    const [orderResult]: any = await pool.execute(
      `INSERT INTO orders (code, description, customer_id, type, status_id, notes, created_by)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [newOrderCode, description, customerId, type, notes, authResult.userId]
    );

    const orderId = orderResult.insertId;

    const originStepCode = generateStepCode(newOrderCode, 1, 0);

    await pool.execute(
      `INSERT INTO order_steps (order_id, step_type, step_order, address, contact_name, contact_phone, notes, package_qty, status_id, code)
       VALUES (?, 'origin', 1, ?, ?, ?, ?, 0, 1, ?)`,
      [
        orderId,
        originStep.address,
        originStep.contactName,
        originStep.contactPhone,
        originStep.notes,
        originStepCode
      ]
    );

    for (let i = 0; i < destinationSteps.length; i++) {
      const dest = destinationSteps[i];
      const stepOrder = i + 2;
      const stepCode = generateStepCode(newOrderCode, stepOrder, dest.packageQty);

      await pool.execute(
        `INSERT INTO order_steps (order_id, step_type, step_order, address, contact_name, contact_phone, notes, package_qty, status_id, code)
         VALUES (?, 'destination', ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          orderId,
          stepOrder,
          dest.address,
          dest.contactName,
          dest.contactPhone,
          dest.notes,
          dest.packageQty,
          stepCode
        ]
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderCode: newOrderCode
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Error creating order' }, { status: 500 });
  }
}
