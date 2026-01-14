
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

interface IARequestMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const messagesStr = formData.get("messages") as string;
    const provider = (formData.get("provider") as string) || "gemini";
    const imageFile = formData.get("image") as File | null;

    // Fetch company info for API keys
    const company = await prisma.companyInfo.findUnique({
      where: { id: "singleton" },
    });

    let messages: IARequestMessage[] = [];
    if (messagesStr) {
      try {
        messages = JSON.parse(messagesStr);
      } catch (e) {
        console.error("Erro ao fazer parse das mensagens", e);
      }
    }

    let imageBase64 = "";
    let mimeType = "";
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString("base64");
      mimeType = imageFile.type;
    }

    const systemPrompt =
      "Você é um engenheiro de estruturas especializado em aço para construção civil. " +
      "Analise o projeto descrito (e a imagem, se fornecida) e indique barras, bitolas e quantidades aproximadas. " +
      "No final, forneça um resumo JSON estrito no formato: " +
      "`[{ \"descricao\": \"...\", \"quantidade\": 0 }]`." +
      "Se não houver imagem ou descrição suficiente, peça mais detalhes.";

    // --- GOOGLE GEMINI ---
    if (provider === "gemini") {
      const apiKey = company?.geminiApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ 
          mensagem: "Erro: Chave API do Google Gemini não configurada. Adicione em Configurações > Empresa ou no arquivo .env." 
        }, { status: 400 });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const promptParts: any[] = [systemPrompt];
      
      // Add conversation history
      messages.forEach(msg => {
          if (msg.role === "user") promptParts.push("\nUsuário: " + msg.content);
          if (msg.role === "assistant") promptParts.push("\nAssistente: " + msg.content);
      });

      if (imageBase64) {
        promptParts.push({
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || "image/jpeg",
          },
        });
      }

      // Final instruction to ensure JSON
      promptParts.push("\nResponda com a análise técnica e o JSON de itens no final.");

      const result = await model.generateContent(promptParts);
      const responseText = result.response.text();

      const { content, items } = parseResponse(responseText);
      return NextResponse.json({ mensagem: content, itens: items });
    }

    // --- OPENAI ---
    else {
      const apiKey = company?.openaiApiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ 
          mensagem: "Erro: Chave API da OpenAI não configurada. Adicione em Configurações > Empresa ou no arquivo .env." 
        }, { status: 400 });
      }

      // Prepare messages for OpenAI
      const openAiMessages: any[] = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ];

      // If there's an image, attach it to the last user message
      if (imageBase64) {
        // Find the last user message or add a new one
        const lastMsgIndex = openAiMessages.map(m => m.role).lastIndexOf("user");
        if (lastMsgIndex !== -1) {
            openAiMessages[lastMsgIndex].content = [
                { type: "text", text: openAiMessages[lastMsgIndex].content },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
            ];
        } else {
            openAiMessages.push({
                role: "user",
                content: [
                    { type: "text", text: "Analise esta imagem." },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
                ]
            });
        }
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // or gpt-4o if available/needed for vision
          messages: openAiMessages,
          temperature: 0.4,
          max_tokens: 1000
        }),
      });

      const json = await response.json();
      
      if (json.error) {
          throw new Error(json.error.message || "Erro na API da OpenAI");
      }

      const text = json.choices?.[0]?.message?.content || "";
      const { content, items } = parseResponse(text);
      
      return NextResponse.json({ mensagem: content, itens: items });
    }

  } catch (error: any) {
    console.error("Erro na rota de IA:", error);
    return NextResponse.json(
      { mensagem: `Ocorreu um erro ao processar sua solicitação: ${error.message}` },
      { status: 500 }
    );
  }
}

function parseResponse(text: string) {
  let items: { descricao: string; quantidade: number }[] = [];
  
  // Try to find JSON array in the text
  const match = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) {
        items = parsed.map((i: any) => ({
          descricao: i.descricao || "Item sugerido",
          quantidade: Number(i.quantidade) || 0,
        }));
      }
    } catch (e) {
      console.error("Erro ao parsear JSON da IA", e);
    }
  }

  return { content: text, items };
}
