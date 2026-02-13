import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/lib/models/Client';
import Sale from '@/lib/models/Sale';
import { getAuthUser, unauthorized, checkStatus } from '@/lib/middleware/auth';
import { handleError } from '@/lib/middleware/errorHandler';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { id } = await params;
    const client = await Client.findOne({ _id: id, owner: user._id });
    if (!client) return NextResponse.json({ message: 'Cliente no encontrado' }, { status: 404 });

    const sales = await Sale.find({ client: client._id }).sort({ createdAt: -1 });
    return NextResponse.json({ client, sales });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { id } = await params;
    const { name, cedula, phone } = await req.json();
    const client = await Client.findOne({ _id: id, owner: user._id });
    if (!client) return NextResponse.json({ message: 'Cliente no encontrado' }, { status: 404 });

    if (name) client.name = name;
    if (cedula) client.cedula = cedula;
    if (phone) client.phone = phone;
    await client.save();

    return NextResponse.json({ client });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await getAuthUser(req);
    if (!user) return unauthorized();
    const statusCheck = await checkStatus(user);
    if (statusCheck) return statusCheck;

    const { id } = await params;
    const client = await Client.findOne({ _id: id, owner: user._id });
    if (!client) return NextResponse.json({ message: 'Cliente no encontrado' }, { status: 404 });

    const pendingSales = await Sale.countDocuments({ client: client._id, status: { $in: ['pendiente', 'vencido'] } });
    if (pendingSales > 0) {
      return NextResponse.json({ message: 'No se puede eliminar: el cliente tiene deudas pendientes' }, { status: 400 });
    }

    await Client.findByIdAndDelete(client._id);
    return NextResponse.json({ message: 'Cliente eliminado' });
  } catch (error) {
    return handleError(error);
  }
}
