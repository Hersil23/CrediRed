import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleError(err: any) {
  console.error(err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e: { message?: string }) => e.message || '');
    return NextResponse.json({ message: messages.join(', ') }, { status: 400 });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return NextResponse.json({ message: `Ya existe un registro con ese ${field}` }, { status: 400 });
  }

  if (err.name === 'CastError') {
    return NextResponse.json({ message: 'ID inválido' }, { status: 400 });
  }

  return NextResponse.json(
    { message: err.message || 'Error interno del servidor' },
    { status: err.statusCode || 500 }
  );
}
