
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

interface AIChatProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  userName?: string;
  isLoggedIn: boolean;
  onLoginRedirect: () => void;
}

export const AIChat: React.FC<AIChatProps> = ({
  products,
  onProductClick,
  userName,
  isLoggedIn,
  onLoginRedirect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isLoggedIn]);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && !chatSession && isLoggedIn && userName) {
      const initChat = async () => {
        try {
          // Create a condensed context string to save tokens but provide enough info
          const productContext = products.map(p =>
            `ID:${p.id} | ${p.name} | ₹${p.price} | ${p.category} | ${p.brand}`
          ).join('\n');

          const systemInstruction = `You are "Alphadentbot", a helpful and professional dental sales assistant for Alpha Dentkart. 
            You are chatting with a dentist named ${userName}.
            
            Your goal is to understand their clinical needs and recommend products from the following catalog:
            ---
            ${productContext}
            ---
            
            Rules:
            1. Be concise, polite, and helpful.
            2. If you recommend a product, you MUST format it using this specific markdown link style: [Product Name](product:ID). 
               Example: "I highly recommend the [3M Filtek Z250](product:1) for that procedure."
            3. Only recommend products listed in the catalog above.
            4. If the user asks about something unrelated to dentistry or your products, politely steer them back to dental supplies.
            5. If the user asks for a price, quote the price from the catalog.
            `;

          const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
          const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
              systemInstruction: systemInstruction,
            }
          });
          setChatSession(chat);

          // Add initial greeting
          setMessages([{
            role: 'model',
            text: `Hello Dr. ${userName.split(' ')[0]}! I'm Alphadentbot. How can I assist you with your dental supplies today?`
          }]);
        } catch (e) {
          console.error("Failed to init chat", e);
          setMessages([{ role: 'model', text: "System: Unable to connect to AI service. Please check your API key." }]);
        }
      };
      initChat();
    }
  }, [isOpen, products, userName, chatSession, isLoggedIn]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    if (!chatSession) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await chatSession.sendMessage({ message: userMsg });
      const text = result.text;
      setMessages(prev => [...prev, { role: 'model', text: text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I apologize, but I'm having trouble retrieving a response right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse text to render clickable product links
  const renderMessageText = (text: string) => {
    // Regex to match [Name](product:ID)
    const regex = /\[(.*?)\]\(product:(\d+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(<span key={lastIndex}>{text.substring(lastIndex, match.index)}</span>);
      }

      const productName = match[1];
      const productId = parseInt(match[2]);
      const product = products.find(p => p.id === productId);

      // Add clickable button
      parts.push(
        <button
          key={match.index}
          onClick={() => product && onProductClick(product)}
          className="inline-flex items-center gap-1 text-primary font-semibold hover:underline bg-primary/5 px-1 rounded mx-0.5"
          title="View Product Details"
        >
          <i className="fas fa-external-link-alt text-[10px]"></i>
          {productName}
        </button>
      );

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-gray-800 rotate-90' : 'bg-gradient-to-r from-primary to-pink-600 animate-bounce'}`}
      >
        {isOpen ? (
          <i className="fas fa-times text-white text-xl"></i>
        ) : (
          <i className="fas fa-robot text-white text-2xl"></i>
        )}
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-36 right-4 lg:bottom-24 lg:right-6 z-40 w-[90vw] sm:w-[380px] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`} style={{ height: '500px', maxHeight: '60vh' }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-pink-600 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <i className="fas fa-robot text-white text-lg"></i>
          </div>
          <div>
            <h3 className="font-bold text-white">Alphadentbot AI</h3>
            <p className="text-white/80 text-xs flex items-center gap-1">
              <span className={`w-2 h-2 ${isLoggedIn ? 'bg-green-400' : 'bg-yellow-400'} rounded-full animate-pulse`}></span> {isLoggedIn ? 'Online' : 'Restricted'}
            </p>
          </div>
        </div>

        {isLoggedIn ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none shadow-sm'
                    }`}>
                    {renderMessageText(msg.text)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-700 shadow-sm flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products..."
                className="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fas fa-paper-plane text-sm"></i>
              </button>
            </form>
          </>
        ) : (
          /* Login Prompt */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/50 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center animate-pulse">
              <i className="fas fa-lock text-gray-400 text-3xl"></i>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Login Required</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Please sign in to chat with Alphadentbot and get personalized product recommendations.
              </p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                onLoginRedirect();
              }}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-pink-700 transition-colors shadow-lg"
            >
              Sign In to Chat
            </button>
          </div>
        )}
      </div>
    </>
  );
};
