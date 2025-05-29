import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chatHistory, updateChatHistory, clearChatHistory, loadChatHistory } from '../shared/chatHistory';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  // gemini-2.0-pro-exp-02-05//-
  // gemini-2.0-flash//-
  // gemini-2.0-flash-thinking-exp-01-21//-
  //gemini-2.5-pro-preview-03-25 //-
  // gemini-2.5-pro-exp-03-25
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro-exp-03-25',
  systemInstruction: `Author name Risheendra MN. Email (risheendra2006@gmail.com) .and date is \\today and output in LaTeX format help me write latex documents
    Only output in LaTeX format. Provide raw LaTeX. 
    Put your responses in LaTeX document form and add comments if needed. 
    dont rewite the whole document if it is long just write the section that the use asked for and prompt user where to place it.
    Use Google Search when needed to find accurate and up-to-date information.
    `
});

// Initialize the chat variable
let chat: any;

export async function POST(req: NextRequest) {
  try {
    const { prompt, editorContent, compilationErrors, clearChat } = await req.json();

    if (clearChat) {
      await clearChatHistory();
      return NextResponse.json({ message: 'Chat history cleared' });
    }

    // Load the latest chat history
    await loadChatHistory();

    // Configure tools including Google Search
    const tools = [
      { googleSearch: {} }, 
    ];

    // Initialize the chat with the loaded history and tools
    chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        
      },
    });

    const fullPrompt = [
      `user prompt: ${prompt}\n`,
      `Current Editor content:\n${editorContent}`,
      `Compilation Log:\n${JSON.stringify(compilationErrors)}`,
    ];

    await updateChatHistory('user', fullPrompt.join('\n'));

    const result = await chat.sendMessage(fullPrompt,tools);
    const suggestion = result.response.text();
    console.log("fullPrompt", fullPrompt);
    await updateChatHistory('model', suggestion);

    console.log("Prompt", prompt);
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error in AI assist:', error);
    return NextResponse.json({ error: 'An error occurred while processing the request' }, { status: 500 });
  }
}

