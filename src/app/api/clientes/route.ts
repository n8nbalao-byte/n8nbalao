import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clientes = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(request: Request) {
  const data = await request.json();

  const cliente = await prisma.client.create({
    data: {
      name: data.name,
      document: data.document,
      type: data.type,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}

