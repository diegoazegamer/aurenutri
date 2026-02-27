import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';

export function AITest() {
    const [input, setInput] = useState('');
    const { sendMessage, isLoading, error, response } = useAI();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        await sendMessage(input);
    };

    return (
        <div className="p-6 bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 space-y-4 max-w-xl mx-auto">
            <h3 className="text-lg font-bold text-brand-ink dark:text-dark-ink">Testar Integração IA</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua mensagem para a IA..."
                    className="w-full h-32 p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-[#1DE9B6] resize-none text-brand-ink dark:text-dark-ink"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="px-6 py-3 bg-[#1DE9B6] text-white font-bold rounded-xl hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                    {isLoading ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
            </form>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                    {error}
                </div>
            )}

            {response && (
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                    <h4 className="text-xs font-bold text-brand-olive uppercase tracking-widest mb-2">Resposta da IA:</h4>
                    <p className="text-brand-ink dark:text-dark-ink whitespace-pre-wrap">{response}</p>
                </div>
            )}
        </div>
    );
}
