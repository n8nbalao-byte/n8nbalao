import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const company = await prisma.companyInfo.findUnique({
    where: { id: "singleton" },
  });

  return NextResponse.json(company || null);
}

export async function PUT(request: Request) {
  const data = await request.json();

  const updated = await prisma.companyInfo.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      name: data.name || null,
      tradeName: data.tradeName || null,
      cnpj: data.cnpj || null,
      logoUrl: data.logoUrl || null,
      email: data.email || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      website: data.website || null,
      openaiApiKey: data.openaiApiKey || null,
      geminiApiKey: data.geminiApiKey || null,
      groqApiKey: data.groqApiKey || null,
    },
    update: {
      name: data.name || null,
      tradeName: data.tradeName || null,
      cnpj: data.cnpj || null,
      logoUrl: data.logoUrl || null,
      email: data.email || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      zipCode: data.zipCode || null,
      instagram: data.instagram || null,
      facebook: data.facebook || null,
      website: data.website || null,
      openaiApiKey: data.openaiApiKey || null,
      geminiApiKey: data.geminiApiKey || null,
      groqApiKey: data.groqApiKey || null,
    },
  });

  return NextResponse.json(updated);
}

