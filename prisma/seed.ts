import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  // 1. Admin User
  const password = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wmferro.com' },
    update: {},
    create: {
      email: 'admin@wmferro.com',
      name: 'Administrador',
      password,
      role: 'ADMIN',
    },
  })
  console.log('Admin user seeded:', admin.email)

  // 2. Company Info (Singleton)
  await prisma.companyInfo.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      name: 'WM Ferro e Aço',
      tradeName: 'WM Ferro',
      cnpj: '00.000.000/0001-00',
      email: 'contato@wmferro.com',
      phone: '(11) 99999-9999',
      address: 'Av. Industrial, 1000',
      city: 'São Paulo',
      state: 'SP',
    }
  })
  console.log('Company info seeded')

  // 3. Products
  const products = [
    // --- AÇO CA-60 (Rolos/Barras Finas) ---
    {
      code: 'CA60-42-KG',
      name: 'Aço CA-60 4.2mm (Rolo)',
      unit: 'KG',
      basePrice: 9.50,
      steelType: 'CA-60',
      category: 'VERGALHAO'
    },
    {
      code: 'CA60-50-KG',
      name: 'Aço CA-60 5.0mm (Rolo)',
      unit: 'KG',
      basePrice: 9.20,
      steelType: 'CA-60',
      category: 'VERGALHAO'
    },
    
    // --- AÇO CA-50 (Barras 12m) ---
    {
      code: 'CA50-63-BAR',
      name: 'Vergalhão CA-50 6.3mm (Barra 12m)',
      unit: 'BARRA',
      basePrice: 28.50, // ~3kg * price
      steelType: 'CA-50',
      category: 'VERGALHAO'
    },
    {
      code: 'CA50-80-BAR',
      name: 'Vergalhão CA-50 8.0mm (Barra 12m)',
      unit: 'BARRA',
      basePrice: 45.90,
      steelType: 'CA-50',
      category: 'VERGALHAO'
    },
    {
      code: 'CA50-100-BAR',
      name: 'Vergalhão CA-50 10.0mm (Barra 12m)',
      unit: 'BARRA',
      basePrice: 72.00,
      steelType: 'CA-50',
      category: 'VERGALHAO'
    },
    {
      code: 'CA50-125-BAR',
      name: 'Vergalhão CA-50 12.5mm (Barra 12m)',
      unit: 'BARRA',
      basePrice: 112.50,
      steelType: 'CA-50',
      category: 'VERGALHAO'
    },
    {
      code: 'CA50-160-BAR',
      name: 'Vergalhão CA-50 16.0mm (Barra 12m)',
      unit: 'BARRA',
      basePrice: 185.00,
      steelType: 'CA-50',
      category: 'VERGALHAO'
    },
    {
      code: 'CA50-200-BAR',
      name: 'Vergalhão CA-50 20.0mm (Barra 12m)',
      unit: 'BARRA',
      basePrice: 290.00,
      steelType: 'CA-50',
      category: 'VERGALHAO'
    },
    {
      code: 'CA50-250-BAR',
      name: 'Vergalhão CA-50 25.0mm (Barra 12m)',
      unit: 'BARRA',
      basePrice: 450.00,
      steelType: 'CA-50',
      category: 'VERGALHAO'
    },

    // --- ESTRIBOS (Prontos) ---
    {
      code: 'EST-7X14',
      name: 'Estribo 7x14cm (4.2mm)',
      unit: 'UN',
      basePrice: 0.85,
      steelType: 'CA-60',
      category: 'ESTRIBO'
    },
    {
      code: 'EST-7X17',
      name: 'Estribo 7x17cm (4.2mm)',
      unit: 'UN',
      basePrice: 0.95,
      steelType: 'CA-60',
      category: 'ESTRIBO'
    },
    {
      code: 'EST-7X22',
      name: 'Estribo 7x22cm (4.2mm)',
      unit: 'UN',
      basePrice: 1.10,
      steelType: 'CA-60',
      category: 'ESTRIBO'
    },
    {
      code: 'EST-7X27',
      name: 'Estribo 7x27cm (4.2mm)',
      unit: 'UN',
      basePrice: 1.25,
      steelType: 'CA-60',
      category: 'ESTRIBO'
    },
    {
      code: 'EST-10X15',
      name: 'Estribo 10x15cm (4.2mm)',
      unit: 'UN',
      basePrice: 0.95,
      steelType: 'CA-60',
      category: 'ESTRIBO'
    },
     {
      code: 'EST-10X20',
      name: 'Estribo 10x20cm (4.2mm)',
      unit: 'UN',
      basePrice: 1.15,
      steelType: 'CA-60',
      category: 'ESTRIBO'
    },
     {
      code: 'EST-15X15',
      name: 'Estribo 15x15cm (4.2mm)',
      unit: 'UN',
      basePrice: 1.10,
      steelType: 'CA-60',
      category: 'ESTRIBO'
    },

    // --- COLUNAS PRONTAS (Montadas) ---
    {
      code: 'COL-7X14-8MM-3M',
      name: 'Coluna 7x14 c/ 4 ferros 8mm (3m)',
      unit: 'UN',
      basePrice: 65.00,
      steelType: 'CA-50',
      category: 'COLUNA'
    },
    {
      code: 'COL-7X14-8MM-4M',
      name: 'Coluna 7x14 c/ 4 ferros 8mm (4m)',
      unit: 'UN',
      basePrice: 86.00,
      steelType: 'CA-50',
      category: 'COLUNA'
    },
    {
      code: 'COL-7X14-8MM-6M',
      name: 'Coluna 7x14 c/ 4 ferros 8mm (6m)',
      unit: 'UN',
      basePrice: 129.00,
      steelType: 'CA-50',
      category: 'COLUNA'
    },

    // --- TRELIÇAS (Preço por Metro) ---
    {
      code: 'TRELICA-H8',
      name: 'Treliça H8 (Metro)',
      unit: 'M',
      basePrice: 12.50,
      steelType: 'CA-60',
      category: 'TRELICA'
    },
    {
      code: 'TRELICA-H12',
      name: 'Treliça H12 (Metro)',
      unit: 'M',
      basePrice: 16.80,
      steelType: 'CA-60',
      category: 'TRELICA'
    },
    {
      code: 'TRELICA-H16',
      name: 'Treliça H16 (Metro)',
      unit: 'M',
      basePrice: 22.00,
      steelType: 'CA-60',
      category: 'TRELICA'
    },
    {
      code: 'TRELICA-H20',
      name: 'Treliça H20 (Metro)',
      unit: 'M',
      basePrice: 28.50,
      steelType: 'CA-60',
      category: 'TRELICA'
    },
    {
      code: 'TRELICA-H25',
      name: 'Treliça H25 (Metro)',
      unit: 'M',
      basePrice: 35.00,
      steelType: 'CA-60',
      category: 'TRELICA'
    },

    // --- SAPATAS PRONTAS (Opcional) ---
    {
      code: 'SAP-60X60',
      name: 'Sapata Pronta 60x60cm (Gaiola)',
      unit: 'UN',
      basePrice: 85.00,
      steelType: 'CA-50',
      category: 'SAPATA'
    },
    {
      code: 'SAP-80X80',
      name: 'Sapata Pronta 80x80cm (Gaiola)',
      unit: 'UN',
      basePrice: 140.00,
      steelType: 'CA-50',
      category: 'SAPATA'
    },
    
    // --- MALHA POP (Para Lajes) ---
    {
      code: 'MALHA-15X15-LEVE',
      name: 'Malha Pop 15x15 Leve (2x3m)',
      unit: 'UN',
      basePrice: 45.00,
      steelType: 'CA-60',
      category: 'MALHA'
    },
    {
      code: 'MALHA-15X15-MED',
      name: 'Malha Pop 15x15 Média (2x3m)',
      unit: 'UN',
      basePrice: 65.00,
      steelType: 'CA-60',
      category: 'MALHA'
    },
    {
      code: 'MALHA-10X10-PESADA',
      name: 'Malha Pop 10x10 Pesada (2x3m)',
      unit: 'UN',
      basePrice: 95.00,
      steelType: 'CA-60',
      category: 'MALHA'
    },
    {
      code: 'COL-7X14-10MM-3M',
      name: 'Coluna 7x14 c/ 4 ferros 10mm (3m)',
      unit: 'UN',
      basePrice: 95.00,
      steelType: 'CA-50',
      category: 'COLUNA'
    },
     {
      code: 'COL-7X14-10MM-6M',
      name: 'Coluna 7x14 c/ 4 ferros 10mm (6m)',
      unit: 'UN',
      basePrice: 190.00,
      steelType: 'CA-50',
      category: 'COLUNA'
    },

    // --- TELAS SOLDADAS (Malhas) ---
    {
      code: 'TELA-Q61',
      name: 'Tela Soldada Q61 (15x15) 3.4mm - 2.45x6m',
      unit: 'UN',
      basePrice: 180.00,
      steelType: 'CA-60',
      category: 'TELA'
    },
    {
      code: 'TELA-Q92',
      name: 'Tela Soldada Q92 (15x15) 4.2mm - 2.45x6m',
      unit: 'UN',
      basePrice: 260.00,
      steelType: 'CA-60',
      category: 'TELA'
    },
    {
      code: 'TELA-Q138',
      name: 'Tela Soldada Q138 (10x10) 4.2mm - 2.45x6m',
      unit: 'UN',
      basePrice: 390.00,
      steelType: 'CA-60',
      category: 'TELA'
    },
     {
      code: 'TELA-Q196',
      name: 'Tela Soldada Q196 (10x10) 5.0mm - 2.45x6m',
      unit: 'UN',
      basePrice: 550.00,
      steelType: 'CA-60',
      category: 'TELA'
    },

    // --- TRELIÇAS ---
    {
      code: 'TRELICA-H8',
      name: 'Treliça H8 (Barra 12m)',
      unit: 'BARRA',
      basePrice: 65.00,
      steelType: 'CA-60',
      category: 'TRELICA'
    },
    {
      code: 'TRELICA-H12',
      name: 'Treliça H12 (Barra 12m)',
      unit: 'BARRA',
      basePrice: 85.00,
      steelType: 'CA-60',
      category: 'TRELICA'
    },
    {
      code: 'TRELICA-TB8',
      name: 'Treliça TB-8 (Barra 12m)',
      unit: 'BARRA',
      basePrice: 75.00,
      steelType: 'CA-60',
      category: 'TRELICA'
    },

    // --- ARAMES E PREGOS ---
    {
      code: 'ARAME-RECOZIDO-KG',
      name: 'Arame Recozido BWG 18 (Torcido)',
      unit: 'KG',
      basePrice: 12.00,
      steelType: 'ARAME',
      category: 'ARAME'
    },
    {
      code: 'PREGO-18X27',
      name: 'Prego 18x27 (com cabeça)',
      unit: 'KG',
      basePrice: 15.00,
      steelType: 'PREGO',
      category: 'PREGO'
    },
    {
      code: 'PREGO-17X21',
      name: 'Prego 17x21 (com cabeça)',
      unit: 'KG',
      basePrice: 15.00,
      steelType: 'PREGO',
      category: 'PREGO'
    },

    // --- NOVOS PRODUTOS (SAPATAS / ESPAÇADORES / ETC) ---
    {
      code: 'SAPATA-60X60',
      name: 'Sapata Pronta 60x60cm (Ferro 8mm)',
      unit: 'UN',
      basePrice: 45.00,
      steelType: 'CA-50',
      category: 'SAPATA'
    },
    {
      code: 'SAPATA-80X80',
      name: 'Sapata Pronta 80x80cm (Ferro 10mm)',
      unit: 'UN',
      basePrice: 85.00,
      steelType: 'CA-50',
      category: 'SAPATA'
    },
    {
      code: 'ESPACADOR-PLASTICO-25',
      name: 'Espaçador Plástico 25mm (Cento)',
      unit: 'CENTO',
      basePrice: 25.00,
      steelType: 'PLASTICO',
      category: 'ACESSORIO'
    },
    {
      code: 'ESPACADOR-PLASTICO-30',
      name: 'Espaçador Plástico 30mm (Cento)',
      unit: 'CENTO',
      basePrice: 30.00,
      steelType: 'PLASTICO',
      category: 'ACESSORIO'
    },
    {
        code: 'BROCA-25X3M',
        name: 'Broca Perfurada 25cm x 3m (Armação)',
        unit: 'UN',
        basePrice: 110.00,
        steelType: 'CA-50',
        category: 'COLUNA'
    }
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { code: p.code },
      update: {
        category: p.category,
        name: p.name,
        basePrice: p.basePrice
      },
      create: p,
    })
  }
  console.log(`Seeded ${products.length} products`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
