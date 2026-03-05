import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function generateOrderCode(lastId: number): string {
  const num = String(lastId + 1).padStart(12, '0');
  return `D${num}`;
}

function generateStepCode(orderCode: string, stepOrder: number, packageQty: number): string {
  return `${orderCode.substring(0, 8)}${String(stepOrder * 100 + packageQty).padStart(4, '0')}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, userId, description, notes, type, originStep, destinationSteps } = body;

    if (!customerId || !originStep || !destinationSteps || destinationSteps.length === 0) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const [lastOrder]: any = await pool.execute(
      'SELECT MAX(id) as lastId FROM orders'
    );
    const newOrderCode = generateOrderCode(lastOrder[0]?.lastId || 0);

    const [orderResult]: any = await pool.execute(
      `INSERT INTO orders (code, description, customer_id, type, status_id, notes, created_by)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [newOrderCode, description || '', customerId, type || 'distribution', notes || '', userId || null]
    );

    const orderId = orderResult.insertId;

    const originStepCode = generateStepCode(newOrderCode, 1, originStep.packageQty || 1);
    
    await pool.execute(
      `INSERT INTO order_steps (order_id, step_type, step_order, address, contact_name, contact_phone, notes, package_qty, status_id, code)
       VALUES (?, 'origin', 1, ?, ?, ?, ?, ?, 1, ?)`,
      [
        orderId,
        originStep.address,
        originStep.contactName || '',
        originStep.contactPhone || '',
        originStep.notes || '',
        originStep.packageQty || 1,
        originStepCode
      ]
    );

    for (let i = 0; i < destinationSteps.length; i++) {
      const dest = destinationSteps[i];
      const stepOrder = i + 2;
      const stepCode = generateStepCode(newOrderCode, stepOrder, dest.packageQty || 1);
      
      await pool.execute(
        `INSERT INTO order_steps (order_id, step_type, step_order, address, contact_name, contact_phone, notes, package_qty, status_id, code)
         VALUES (?, 'destination', ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          orderId,
          stepOrder,
          dest.address,
          dest.contactName || '',
          dest.contactPhone || '',
          dest.notes || '',
          dest.packageQty || 1,
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
