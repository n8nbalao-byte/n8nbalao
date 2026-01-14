import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const produtos = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(produtos);
}

export async function POST(request: Request) {
  const data = await request.json();

  let code = data.code;

  // Generate code if not provided or if we want to enforce the rule
  // Rule: 3 first letters of category + sequential number
  if (!code || true) { // Always generate as per user request
    const category = data.category ? data.category.toUpperCase() : "GERAL";
    const prefix = category.substring(0, 3);
    
    // Find last product with this prefix to determine sequence
    const lastProduct = await prisma.product.findFirst({
      where: {
        code: {
          startsWith: prefix
        }
      },
      orderBy: {
        code: 'desc'
      }
    });

    let nextNum = 1;
    if (lastProduct) {
      // Try to extract number from end of string
      const match = lastProduct.code.match(/(\d+)$/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }

    // Try to find a unique code
    let isUnique = false;
    while (!isUnique) {
      code = `${prefix}${String(nextNum).padStart(3, '0')}`;
      const existing = await prisma.product.findUnique({ where: { code } });
      if (!existing) {
        isUnique = true;
      } else {
        nextNum++;
      }
    }
  }

  const produto = await prisma.product.create({
    data: {
      code: code,
      name: data.name,
      unit: data.unit,
      basePrice: data.basePrice,
      category: data.category || null,
      steelType: data.steelType || null,
    },
  });

  return NextResponse.json(produto, { status: 201 });
}

