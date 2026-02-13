import { NextResponse } from 'next/server';
import { getRates } from '@/lib/utils/exchangeRate';

export async function GET() {
  try {
    const rates = await getRates();
    return NextResponse.json({ rates });
  } catch {
    return NextResponse.json({ message: 'Error al obtener tasas de cambio' }, { status: 500 });
  }
}
