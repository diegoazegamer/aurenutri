interface AIRequest {
    message: string;
}

interface AIResponse {
    response: string;
}

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'https://aurenutri.vercel.app/api/ai';

export const aiService = {
    async sendMessage(message: string): Promise<string> {
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error(`Erro na comunicação com a IA: ${response.statusText}`);
        }

        const data: AIResponse = await response.json();
        return data.response;
    }
};
