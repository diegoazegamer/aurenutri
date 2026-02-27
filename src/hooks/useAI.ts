import { useState } from 'react';
import { aiService } from '../services/ai.service';

export function useAI() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<string | null>(null);

    const sendMessage = async (message: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const aiResponse = await aiService.sendMessage(message);
            setResponse(aiResponse);
            return aiResponse;
        } catch (err: any) {
            const errorMessage = err.message || 'Ocorreu um erro ao comunicar com a IA.';
            setError(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        sendMessage,
        isLoading,
        error,
        response,
    };
}
