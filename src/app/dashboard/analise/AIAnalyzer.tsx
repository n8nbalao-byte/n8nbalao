
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Send, Bot, ShoppingCart, Check, Loader2, ArrowRight, FileText, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AIAnalyzerProps {
  clients: { id: string, name: string }[];
}

interface SuggestedItem {
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  reason: string;
}

export default function AIAnalyzer({ clients }: AIAnalyzerProps) {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [suggestedItems, setSuggestedItems] = useState<SuggestedItem[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [isCreatingSale, setIsCreatingSale] = useState(false);
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'groq'>('gemini');
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !image) || isLoading) return;

    const userMessage = input;
    setInput('');
    
    // Add user message to UI
    const newMessages = [...messages, { role: 'user' as const, content: userMessage || (image ? "Analise esta imagem em anexo." : "") }];
    setMessages(newMessages);
    setIsLoading(true);

    const formData = new FormData();
    if (image) formData.append('image', image);
    formData.append('prompt', userMessage);
    formData.append('history', JSON.stringify(messages));
    formData.append('provider', provider);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || errorJson.message || "Erro desconhecido na API");
        } catch (e) {
            throw new Error(errorText || "Erro na requisição");
        }
      }

      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      
      if (data.suggestedItems && Array.isArray(data.suggestedItems) && data.suggestedItems.length > 0) {
        setSuggestedItems(prev => [...prev, ...data.suggestedItems]);
        // Auto-select new items
        const newIndices = new Set(selectedIndices);
        const startIndex = suggestedItems.length;
        data.suggestedItems.forEach((_: any, i: number) => newIndices.add(startIndex + i));
        setSelectedIndices(newIndices);
      }
      
      // Keep the image in preview until user clears it or sends another?
      // Usually clear to indicate it was sent.
      setImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || "Erro desconhecido";
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Erro: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemSelection = (index: number) => {
    const newIndices = new Set(selectedIndices);
    if (newIndices.has(index)) {
      newIndices.delete(index);
    } else {
      newIndices.add(index);
    }
    setSelectedIndices(newIndices);
  };

  const handleCreateSale = async () => {
    if (selectedIndices.size === 0) return;
    if (!selectedClientId) {
        alert("Selecione um cliente para continuar.");
        return;
    }

    setIsCreatingSale(true);
    
    const itemsToSale = Array.from(selectedIndices).map(index => {
        const item = suggestedItems[index];
        return {
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            price: item.unitPrice || 0,
            observation: item.reason
        };
    });

    try {
        const res = await fetch("/api/vendas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                clientId: selectedClientId,
                items: itemsToSale,
                deliveryDate: new Date().toISOString(), // Default to today
                deliveryNotes: "Gerado via Análise de IA"
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Erro ao criar venda");
        }

        const sale = await res.json();
        router.push(`/vendas/${sale.id}`);

    } catch (error: any) {
       alert(error.message || "Erro ao criar venda");
       setIsCreatingSale(false);
    }
  };

  const removeItem = (indexToRemove: number) => {
    setSuggestedItems(prev => prev.filter((_, i) => i !== indexToRemove));
    const newIndices = new Set();
    Array.from(selectedIndices).forEach(i => {
        if (i < indexToRemove) newIndices.add(i);
        else if (i > indexToRemove) newIndices.add(i - 1);
    });
    setSelectedIndices(newIndices);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Chat Area */}
      <div className="lg:col-span-2 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Header with Model Selector */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
           <div className="flex items-center gap-2">
             <Bot size={20} className="text-indigo-600" />
             <span className="font-medium text-slate-700">Assistente</span>
           </div>
           <div className="flex bg-slate-100 p-1 rounded-lg">
             <button
               onClick={() => setProvider('gemini')}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                 provider === 'gemini' 
                   ? 'bg-white text-indigo-600 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               Google Gemini
             </button>
             <button
               onClick={() => setProvider('openai')}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                 provider === 'openai' 
                   ? 'bg-white text-emerald-600 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               OpenAI GPT-4o
             </button>
             <button
               onClick={() => setProvider('groq')}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                 provider === 'groq' 
                   ? 'bg-white text-orange-600 shadow-sm' 
                   : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               Groq (Free)
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Bot size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium text-slate-600">Assistente de Engenharia WM Ferro</p>
              <p className="text-sm max-w-md mt-2">
                Envie uma imagem do projeto, rascunho ou descreva o que precisa. 
                A IA irá analisar e sugerir os materiais ideais.
              </p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 shadow-sm text-slate-800 rounded-tl-none'
              }`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                <Loader2 className="animate-spin text-indigo-600" size={16} />
                <span className="text-sm text-slate-500">Analisando...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          {previewUrl && (
            <div className="mb-2 relative inline-block">
              <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded border border-slate-200" />
              <button 
                onClick={() => { setImage(null); setPreviewUrl(null); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-lg border transition-colors ${
                image ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title="Anexar imagem"
            >
              <Upload size={20} />
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Descreva o projeto ou faça perguntas sobre a imagem..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !image)}
              className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* Cart/Suggestions Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShoppingCart size={18} className="text-indigo-600" />
            Itens Sugeridos
          </h2>
          <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
            {selectedIndices.size} selecionados
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {suggestedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
              <FileText size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Nenhum item sugerido ainda.</p>
            </div>
          ) : (
            suggestedItems.map((item, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedIndices.has(index)
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-indigo-200'
                }`}
                onClick={() => toggleItemSelection(index)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{item.description}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.reason}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    selectedIndices.has(index) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                  }`}>
                    {selectedIndices.has(index) && <Check size={12} className="text-white" />}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/50">
                   <div className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                     Qtd: {item.quantity}
                   </div>
                   <div className="text-xs font-medium text-slate-700">
                     {item.unitPrice > 0 ? `R$ ${item.unitPrice.toFixed(2)}` : 'Preço sob consulta'}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Cliente</label>
            <select 
                className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
            >
                {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                ))}
            </select>
          </div>
          
          <button
            onClick={handleCreateSale}
            disabled={selectedIndices.size === 0 || !selectedClientId || isCreatingSale}
            className="w-full bg-slate-900 text-white p-3 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium"
          >
            {isCreatingSale ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Criando...
                </>
            ) : (
                <>
                  Criar Venda
                  <ArrowRight size={18} />
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
