import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProvider = 'google' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'openrouter' | 'custom';

export const AISettings: React.FC = () => {
    const [provider, setProvider] = useState<AIProvider>('google');
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
    const [customEndpoint, setCustomEndpoint] = useState('');
    
    const [showApiKey, setShowApiKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [debugOutput, setDebugOutput] = useState('');

    // Load configuration on mount
    useEffect(() => {
        const savedProvider = (localStorage.getItem('aiProvider') as AIProvider) || 'google';
        const savedKey = localStorage.getItem('aiApiKey') || localStorage.getItem('geminiApiKey') || '';
        const savedModel = localStorage.getItem('aiModel') || localStorage.getItem('geminiModel') || 'gemini-1.5-flash';
        const savedEndpoint = localStorage.getItem('aiCustomEndpoint') || '';

        setProvider(savedProvider);
        setApiKey(savedKey);
        setSelectedModel(savedModel);
        setCustomEndpoint(savedEndpoint);
    }, []);

    // Update default model when provider changes
    const handleProviderChange = (newProvider: AIProvider) => {
        setProvider(newProvider);
        setTestStatus('idle');
        setTestMessage('');
        
        switch (newProvider) {
            case 'google':
                setSelectedModel('gemini-1.5-flash');
                break;
            case 'openai':
                setSelectedModel('gpt-4o-mini');
                break;
            case 'anthropic':
                setSelectedModel('claude-3-5-haiku-20241022');
                break;
            case 'groq':
                setSelectedModel('llama-3.3-70b-versatile');
                break;
            case 'deepseek':
                setSelectedModel('deepseek-chat');
                break;
            case 'openrouter':
                setSelectedModel('google/gemini-2.0-flash-exp:free');
                break;
            case 'custom':
                setSelectedModel('custom-model');
                setCustomEndpoint('https://api.your-server.com/v1/chat/completions');
                break;
        }
    };

    const handleTestConnection = async () => {
        if (!apiKey.trim()) {
            setTestStatus('error');
            setTestMessage('Please enter an API key first');
            return;
        }

        setIsTesting(true);
        setTestStatus('idle');
        setTestMessage('');

        try {
            if (provider === 'google') {
                const genAI = new GoogleGenerativeAI(apiKey.trim());
                const model = genAI.getGenerativeModel({ model: selectedModel });
                const result = await model.generateContent("Hello");
                const text = await result.response.text();
                if (text) {
                    setTestStatus('success');
                    setTestMessage('✅ Google Gemini Connection successful!');
                }
            } else if (['openai', 'groq', 'deepseek', 'openrouter', 'custom'].includes(provider)) {
                let baseUrl = 'https://api.openai.com/v1/chat/completions';
                if (provider === 'groq') baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
                if (provider === 'deepseek') baseUrl = 'https://api.deepseek.com/chat/completions';
                if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
                if (provider === 'custom') baseUrl = customEndpoint;

                const response = await fetch(baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey.trim()}`,
                        ...(provider === 'openrouter' ? { 'HTTP-Referer': window.location.origin } : {})
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: [{ role: 'user', content: 'Hello' }],
                        max_tokens: 10
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    setTestStatus('success');
                    setTestMessage(`✅ ${provider.toUpperCase()} Connection successful!`);
                } else {
                    throw new Error(data.error?.message || data.message || `HTTP ${response.status}`);
                }
            } else if (provider === 'anthropic') {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey.trim(),
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        max_tokens: 10,
                        messages: [{ role: 'user', content: 'Hello' }]
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    setTestStatus('success');
                    setTestMessage('✅ Anthropic Claude Connection successful!');
                } else {
                    throw new Error(data.error?.message || `HTTP ${response.status}`);
                }
            }
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(`❌ Connection failed: ${error.message || 'Invalid configuration'}`);
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('aiProvider', provider);
        localStorage.setItem('aiApiKey', apiKey.trim());
        localStorage.setItem('aiModel', selectedModel);
        localStorage.setItem('aiCustomEndpoint', customEndpoint);

        // Backward compatibility fallback for Gemini
        localStorage.setItem('geminiApiKey', apiKey.trim());
        localStorage.setItem('geminiModel', selectedModel);

        setTimeout(() => {
            setIsSaving(false);
            alert(`✅ AI Settings saved! Active Provider: ${provider.toUpperCase()}`);
        }, 400);
    };

    const handleAutoDetectGoogleModels = async () => {
        if (!apiKey.trim()) {
            setDebugOutput('Please enter Google Gemini API key first');
            return;
        }
        setDebugOutput('Fetching model catalog...');
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
            const data = await response.json();
            setDebugOutput(JSON.stringify(data, null, 2));
            if (data.models) {
                setTestMessage(`Found ${data.models.length} available models!`);
            }
        } catch (error: any) {
            setDebugOutput(`Error: ${error.message}`);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-pink-600 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <i className="fas fa-robot text-white text-2xl"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">AI Provider & Chatbot Settings</h2>
                            <p className="text-white/80 text-sm">Configure Google, OpenAI, Claude, Groq, DeepSeek, OpenRouter or Custom API</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Provider Select Grid */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Select AI Provider
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { id: 'google', name: 'Google Gemini', icon: 'fa-brands fa-google', color: 'text-blue-500' },
                                { id: 'openai', name: 'OpenAI (ChatGPT)', icon: 'fas fa-bolt', color: 'text-emerald-500' },
                                { id: 'anthropic', name: 'Anthropic Claude', icon: 'fas fa-brain', color: 'text-amber-600' },
                                { id: 'groq', name: 'Groq (Fast Llama)', icon: 'fas fa-rocket', color: 'text-orange-500' },
                                { id: 'deepseek', name: 'DeepSeek AI', icon: 'fas fa-microchip', color: 'text-indigo-500' },
                                { id: 'openrouter', name: 'OpenRouter (All)', icon: 'fas fa-network-wired', color: 'text-purple-500' },
                                { id: 'custom', name: 'Custom OpenAI-API', icon: 'fas fa-server', color: 'text-gray-600' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleProviderChange(p.id as AIProvider)}
                                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                                        provider === p.id 
                                            ? 'border-primary bg-pink-50/50 dark:bg-pink-900/20 shadow-sm' 
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className={`${p.icon} ${p.color} text-xl mb-2`}></i>
                                    <span className="text-xs font-bold text-gray-800 dark:text-white">{p.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Select / Custom Model Name
                        </label>
                        
                        {provider === 'google' && (
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary transition-all cursor-pointer"
                            >
                                <optgroup label="🌟 Free Tier Supported">
                                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended - Fast & Free)</option>
                                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
                                    <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</option>
                                </optgroup>
                                <optgroup label="⚡ Tiered / Paid Models">
                                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                                </optgroup>
                            </select>
                        )}

                        {provider === 'openai' && (
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary transition-all cursor-pointer"
                            >
                                <option value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</option>
                                <option value="gpt-4o">GPT-4o (Omni High Reasoning)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </select>
                        )}

                        {provider === 'anthropic' && (
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary transition-all cursor-pointer"
                            >
                                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast & Accurate)</option>
                                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (State of the Art)</option>
                                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                            </select>
                        )}

                        {provider === 'groq' && (
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary transition-all cursor-pointer"
                            >
                                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Versatile)</option>
                                <option value="llama-3.1-8b-instant">Llama 3.1 8B (Instant Speed)</option>
                                <option value="mixtral-8x7b-32768">Mixtral 8x7b</option>
                            </select>
                        )}

                        {provider === 'deepseek' && (
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary transition-all cursor-pointer"
                            >
                                <option value="deepseek-chat">DeepSeek-V3 Chat</option>
                                <option value="deepseek-reasoner">DeepSeek-R1 Reasoner</option>
                            </select>
                        )}

                        {provider === 'openrouter' && (
                            <input
                                type="text"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                placeholder="e.g. google/gemini-2.0-flash-exp:free or meta-llama/llama-3.3-70b-instruct:free"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary transition-all font-mono text-sm"
                            />
                        )}

                        {provider === 'custom' && (
                            <input
                                type="text"
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                placeholder="Enter custom model identifier (e.g. mistral-7b, local-llm)"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary transition-all"
                            />
                        )}
                    </div>

                    {/* Custom Endpoint URL (For Custom OpenAI compatible API) */}
                    {provider === 'custom' && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Custom Server API Endpoint URL
                            </label>
                            <input
                                type="text"
                                value={customEndpoint}
                                onChange={(e) => setCustomEndpoint(e.target.value)}
                                placeholder="https://your-api.com/v1/chat/completions"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary transition-all font-mono text-sm"
                            />
                        </div>
                    )}

                    {/* API Key Input */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                {provider.toUpperCase()} API Key
                            </label>
                            {provider === 'google' && (
                                <button
                                    type="button"
                                    onClick={handleAutoDetectGoogleModels}
                                    className="text-xs text-primary font-bold hover:underline"
                                >
                                    🔍 Auto-detect Google Key Models
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={`Enter your ${provider} secret API key...`}
                                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary transition-all font-mono text-sm"
                                />
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <i className={`fas ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            <button
                                onClick={handleTestConnection}
                                disabled={isTesting || !apiKey.trim()}
                                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                            >
                                {isTesting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plug"></i>}
                                Test
                            </button>
                        </div>
                    </div>

                    {/* Status Message */}
                    {testStatus !== 'idle' && (
                        <div className={`p-4 rounded-xl border-2 ${
                            testStatus === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 text-green-800 dark:text-green-300'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-800 dark:text-red-300'
                        }`}>
                            <p className="font-semibold text-sm">{testMessage}</p>
                        </div>
                    )}

                    {/* Debug Console Output */}
                    {debugOutput && (
                        <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto font-mono max-h-36 overflow-y-auto">
                            {debugOutput}
                        </pre>
                    )}

                    {/* Save Action */}
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !apiKey.trim()}
                            className="px-8 py-3 bg-gradient-to-r from-primary to-pink-600 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
                        >
                            {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            Save Active Provider Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
