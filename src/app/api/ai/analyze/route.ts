
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const history = formData.get('history') as string; // JSON string
    const promptText = formData.get('prompt') as string;
    const provider = (formData.get('provider') as string) || 'gemini';

    // Get Company Info for API Keys
    const companyInfo = await prisma.companyInfo.findUnique({ where: { id: 'singleton' } });
    
    // Fetch Products
    const products = await prisma.product.findMany({
        select: { id: true, name: true, unit: true, basePrice: true }
    });
    const productsJson = JSON.stringify(products);

    let systemPrompt = `
      Você é um assistente de vendas especialista em engenharia estrutural para a empresa WM Ferro.
      Seu objetivo é analisar o pedido do usuário (imagem e/ou texto) e sugerir produtos para adicionar ao carrinho.
      
      Produtos Disponíveis:
      ${productsJson}
      
      Instruções:
      1. Analise a imagem (se fornecida) e o histórico da conversa.
      2. Identifique elementos estruturais (Vigas, Colunas, Lajes, Fundações) e suas dimensões/armaduras se visíveis.
      3. Sugira itens específicos da lista "Produtos Disponíveis". Se não houver correspondência exata, sugira o mais próximo ou use uma descrição genérica clara.
      4. Se o usuário pedir uma alteração (ex: "mude para 10mm"), atualize as sugestões.
      5. Retorne a resposta ESTRITAMENTE em formato JSON válido, sem markdown.
      
      Formato de Saída (JSON):
      {
        "message": "Resposta conversacional ao vendedor explicando o que você encontrou e sugeriu. Seja técnico mas acessível.",
        "suggestedItems": [
           {
             "productId": "id_da_lista_ou_null",
             "description": "Descrição clara para o carrinho (ex: Vergalhão CA-50 10mm)",
             "quantity": numero,
             "unitPrice": preco_unitario_estimado (use o do produto se disponivel),
             "reason": "Por que este item foi adicionado"
           }
        ]
      }
    `;

    // --- GOOGLE GEMINI ---
    if (provider === 'gemini') {
        const apiKey = companyInfo?.geminiApiKey || process.env.GEMINI_API_KEY;

        if (!apiKey) {
          return NextResponse.json({ error: 'Chave de API Gemini não configurada.' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        const modelsToTry = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-1.5-flash-001',
            'gemini-1.5-pro-001',
            'gemini-pro-vision', // Fallback for vision
            'gemini-pro' // Fallback for text-only if image is null
        ];

        let result = null;
        let lastError = null;
        let usedModel = "";

        // Prepare prompts once
        let userPrompt = "";
        if (promptText) {
            userPrompt += `Mensagem do Usuário: ${promptText}\n`;
        }
        
        if (history) {
            const historyObj = JSON.parse(history);
            const recentHistory = historyObj.slice(-10);
            const historyText = recentHistory.map((msg: any) => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`).join('\n');
            userPrompt += `\nHistórico da Conversa:\n${historyText}`;
        }

        const parts: any[] = [systemPrompt, userPrompt];
        
        if (image) {
            const bytes = await image.arrayBuffer();
            const base64Data = Buffer.from(bytes).toString('base64');
            parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: image.type
                }
            });
        }

        // Try models sequentially
        for (const modelName of modelsToTry) {
            // Skip text-only models if we have an image
            if (image && modelName === 'gemini-pro') continue;
            // Skip vision-only models if we DON'T have an image (gemini-pro-vision requires image)
            if (!image && modelName === 'gemini-pro-vision') continue;

            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                console.log(`Attempting Gemini model: ${modelName}`);
                result = await model.generateContent(parts);
                usedModel = modelName;
                console.log(`Success with Gemini model: ${modelName}`);
                break; // Success!
            } catch (e: any) {
                console.warn(`Failed with model ${modelName}:`, e.message);
                lastError = e;
                // If error is NOT 404/Not Found, maybe we should stop? 
                // But often 400 or 500 can be model specific too.
                // 404 is definitely "model not found".
                // We continue to next model.
            }
        }

        if (!result) {
            throw new Error(`All Gemini models failed. Last error: ${lastError?.message || "Unknown error"}`);
        }

        const response = await result.response;
        const text = response.text();
        
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const jsonResponse = JSON.parse(cleanText);
            return NextResponse.json(jsonResponse);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", text);
            return NextResponse.json({ 
                message: "Não consegui processar a resposta da IA corretamente (JSON inválido).",
                suggestedItems: []
            });
        }
    } 
    // --- GROQ ---
    else if (provider === 'groq') {
        const apiKey = companyInfo?.groqApiKey || process.env.GROQ_API_KEY;

        if (!apiKey) {
             return NextResponse.json({ error: 'Chave de API Groq não configurada.' }, { status: 500 });
        }
        
        const messages: any[] = [
            { role: "system", content: systemPrompt }
        ];
        
        // Process history
        if (history) {
            const historyObj = JSON.parse(history);
            const recentHistory = historyObj.slice(-10);
            recentHistory.forEach((msg: any) => {
                messages.push({ role: msg.role, content: msg.content });
            });
        }
        
        // Add current user message with image if present
        const currentUserContent: any[] = [];
        if (promptText) {
            currentUserContent.push({ type: "text", text: promptText });
        }

        if (image) {
            const bytes = await image.arrayBuffer();
            const base64Data = Buffer.from(bytes).toString('base64');
            currentUserContent.push({
                type: "image_url",
                image_url: {
                    url: `data:${image.type};base64,${base64Data}`
                }
            });
        } else if (!promptText && !image) {
             currentUserContent.push({ type: "text", text: "Analise o contexto anterior." });
        }
        
        if (currentUserContent.length > 0) {
            messages.push({ role: "user", content: currentUserContent });
        }

        // Groq Models
        const visionModels = [
             "meta-llama/llama-4-maverick-17b-128e-instruct",
             "meta-llama/llama-4-scout-17b-16e-instruct"
        ];
        const textModels = [
             "llama-3.3-70b-versatile",
             "llama-3.1-8b-instant"
        ];
        
        const modelsToTry = image ? visionModels : textModels;
        
        let result = null;
        let lastError = null;
        
        for (const modelName of modelsToTry) {
             try {
                 console.log(`Attempting Groq model: ${modelName}`);
                 const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: messages,
                        temperature: 0.2,
                        response_format: { type: "json_object" }
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error?.message || response.statusText);
                }
                
                result = await response.json();
                console.log(`Success with Groq model: ${modelName}`);
                break;
             } catch (e: any) {
                 console.warn(`Failed with Groq model ${modelName}:`, e.message);
                 lastError = e;
             }
        }
        
        if (!result) {
             throw new Error(lastError?.message || "All Groq models failed.");
        }

        const text = result.choices?.[0]?.message?.content || "{}";

        try {
            const jsonResponse = JSON.parse(text);
            return NextResponse.json(jsonResponse);
        } catch (e) {
             console.error("Failed to parse JSON from Groq:", text);
             return NextResponse.json({ 
                message: "Não consegui processar a resposta da IA corretamente.",
                suggestedItems: []
            });
        }
    }
    // --- OPENAI (GPT-4) ---
    else {
        const apiKey = companyInfo?.openaiApiKey || process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Chave de API OpenAI não configurada.' }, { status: 500 });
        }

        const messages: any[] = [
            { role: "system", content: systemPrompt }
        ];

        // Process history
        if (history) {
            const historyObj = JSON.parse(history);
            const recentHistory = historyObj.slice(-10);
            recentHistory.forEach((msg: any) => {
                messages.push({ role: msg.role, content: msg.content });
            });
        }

        // Add current user message with image if present
        const currentUserContent: any[] = [];
        if (promptText) {
            currentUserContent.push({ type: "text", text: promptText });
        }

        if (image) {
            const bytes = await image.arrayBuffer();
            const base64Data = Buffer.from(bytes).toString('base64');
            currentUserContent.push({
                type: "image_url",
                image_url: {
                    url: `data:${image.type};base64,${base64Data}`
                }
            });
        } else if (!promptText && !image) {
             // Edge case: empty submit? usually prevented by frontend
             currentUserContent.push({ type: "text", text: "Analise o contexto anterior." });
        }
        
        if (currentUserContent.length > 0) {
            messages.push({ role: "user", content: currentUserContent });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o", // Using gpt-4o for vision capabilities
                messages: messages,
                temperature: 0.2,
                response_format: { type: "json_object" } // Enforce JSON
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Erro na API da OpenAI");
        }

        const json = await response.json();
        const text = json.choices?.[0]?.message?.content || "{}";

        try {
            const jsonResponse = JSON.parse(text);
            return NextResponse.json(jsonResponse);
        } catch (e) {
             console.error("Failed to parse JSON from OpenAI:", text);
             return NextResponse.json({ 
                message: "Não consegui processar a resposta da IA corretamente.",
                suggestedItems: []
            });
        }
    }

  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message || "Erro interno na análise de IA" }, { status: 500 });
  }
}
