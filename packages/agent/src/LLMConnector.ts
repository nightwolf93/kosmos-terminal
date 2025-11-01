import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // required but unused
});

export class LLMConnector {
  async explainCommand(command: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'llama3', // Assumes llama3 model is available in Ollama
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that explains shell commands. Be concise and clear.',
          },
          {
            role: 'user',
            content: `Explain the following shell command: ${command}`,
          },
        ],
      });

      return completion.choices[0]?.message?.content || 'Sorry, I could not explain this command.';
    } catch (error) {
      console.error('Error communicating with LLM:', error);
      return 'An error occurred while trying to explain the command.';
    }
  }
}
