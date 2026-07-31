import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

export type StandardProvider = 'google' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'openrouter';

export interface CustomProviderConfig {
    id: string;
    name: string;
    endpoint: string;
    apiKey: string;
    model: string;
}

export interface ProviderKeys {
    google: { apiKey: string; model: string };
    openai: { apiKey: string; model: string };
    anthropic: { apiKey: string; model: string };
    groq: { apiKey: string; model: string };
    deepseek: { apiKey: string; model: string };
    openrouter: { apiKey: string; model: string };
    omniroute: { apiKey: string; model: string; endpoint?: string };
}

const DEFAULT_KEYS: ProviderKeys = {
    google: { apiKey: '', model: 'gemini-1.5-flash' },
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    anthropic: { apiKey: '', model: 'claude-3-5-haiku-20241022' },
    groq: { apiKey: '', model: 'llama-3.3-70b-versatile' },
    deepseek: { apiKey: '', model: 'deepseek-chat' },
    openrouter: { apiKey: '', model: 'google/gemini-2.0-flash-exp:free' },
    omniroute: { apiKey: '', model: 'auto', endpoint: 'http://localhost:8000/v1/chat/completions' },
};

export const AISettings: React.FC = () => {
    const [activeProviderId, setActiveProviderId] = useState<string>('google');
    const [providerKeys, setProviderKeys] = useState<ProviderKeys>(DEFAULT_KEYS);
    const [customProviders, setCustomProviders] = useState<CustomProviderConfig[]>([]);

    // State for creating or editing custom provider modal/inputs
    const [newCustomName, setNewCustomName] = useState('');
    const [newCustomEndpoint, setNewCustomEndpoint] = useState('');
    const [newCustomApiKey, setNewCustomApiKey] = useState('');
    const [newCustomModel, setNewCustomModel] = useState('');
    const [showAddCustomModal, setShowAddCustomModal] = useState(false);

    const [showApiKey, setShowApiKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [debugOutput, setDebugOutput] = useState('');

    // Load configurations from localStorage
    useEffect(() => {
        const active = localStorage.getItem('aiActiveProviderId') || 'google';
        setActiveProviderId(active);

        // Load standard keys dictionary
        const savedKeysStr = localStorage.getItem('aiProviderKeys');
        if (savedKeysStr) {
            try {
                const parsed = JSON.parse(savedKeysStr);
                setProviderKeys(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error(e);
            }
        } else {
            // Migration check from old single key stores
            const oldKey = localStorage.getItem('geminiApiKey') || localStorage.getItem('aiApiKey') || '';
            const oldModel = localStorage.getItem('geminiModel') || localStorage.getItem('aiModel') || 'gemini-1.5-flash';
            if (oldKey) {
                setProviderKeys(prev => ({
                    ...prev,
                    google: { apiKey: oldKey, model: oldModel }
                }));
            }
        }

        // Load custom providers array
        const savedCustomStr = localStorage.getItem('aiCustomProviders');
        if (savedCustomStr) {
            try {
                setCustomProviders(JSON.parse(savedCustomStr));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    // Update standard key field
    const handleKeyChange = (providerId: keyof ProviderKeys, keyVal: string) => {
        setProviderKeys(prev => ({
            ...prev,
            [providerId]: { ...prev[providerId], apiKey: keyVal }
        }));
    };

    // Update standard model field
    const handleModelChange = (providerId: keyof ProviderKeys, modelVal: string) => {
        setProviderKeys(prev => ({
            ...prev,
            [providerId]: { ...prev[providerId], model: modelVal }
        }));
    };

    // Add new Custom API Provider
    const handleAddCustomProvider = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomName.trim() || !newCustomEndpoint.trim()) {
            alert('Please enter a Provider Name and API Endpoint URL');
            return;
        }

        const newCustom: CustomProviderConfig = {
            id: `custom_${Date.now()}`,
            name: newCustomName.trim(),
            endpoint: newCustomEndpoint.trim(),
            apiKey: newCustomApiKey.trim(),
            model: newCustomModel.trim() || 'default-model'
        };

        const updated = [...customProviders, newCustom];
        setCustomProviders(updated);
        setActiveProviderId(newCustom.id);
        
        setNewCustomName('');
        setNewCustomEndpoint('');
        setNewCustomApiKey('');
        setNewCustomModel('');
        setShowAddCustomModal(false);
    };

    // Remove Custom API Provider
    const handleRemoveCustomProvider = (id: string) => {
        if (confirm('Are you sure you want to delete this custom API provider?')) {
            const updated = customProviders.filter(p => p.id !== id);
            setCustomProviders(updated);
            if (activeProviderId === id) {
                setActiveProviderId('google');
            }
        }
    };

    // Update Custom Provider fields dynamically
    const handleUpdateCustomField = (id: string, field: keyof CustomProviderConfig, val: string) => {
        setCustomProviders(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
    };

    // Test active connection
    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestStatus('idle');
        setTestMessage('');

        try {
            const isCustom = activeProviderId.startsWith('custom_');
            
            if (isCustom) {
                const target = customProviders.find(p => p.id === activeProviderId);
                if (!target) throw new Error('Custom provider not found');
                if (!target.endpoint) throw new Error('Endpoint URL is missing');

                const response = await fetch(target.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(target.apiKey ? { 'Authorization': `Bearer ${target.apiKey}` } : {})
                    },
                    body: JSON.stringify({
                        model: target.model,
                        messages: [{ role: 'user', content: 'Hello' }],
                        max_tokens: 10
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    setTestStatus('success');
                    setTestMessage(`✅ ${target.name} Connection successful!`);
                } else {
                    throw new Error(data.error?.message || data.message || `HTTP ${response.status}`);
                }
            } else {
                const targetKeyConfig = providerKeys[activeProviderId as keyof ProviderKeys];
                if (!targetKeyConfig.apiKey.trim()) {
                    throw new Error(`Please enter an API key for ${activeProviderId.toUpperCase()}`);
                }

                if (activeProviderId === 'google') {
                    const genAI = new GoogleGenerativeAI(targetKeyConfig.apiKey.trim());
                    const model = genAI.getGenerativeModel({ model: targetKeyConfig.model });
                    const result = await model.generateContent("Hello");
                    const text = await result.response.text();
                    if (text) {
                        setTestStatus('success');
                        setTestMessage('✅ Google Gemini Connection successful!');
                    }
                } else if (['openai', 'groq', 'deepseek', 'openrouter', 'omniroute'].includes(activeProviderId)) {
                    let baseUrl = 'https://api.openai.com/v1/chat/completions';
                    if (activeProviderId === 'groq') baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
                    if (activeProviderId === 'deepseek') baseUrl = 'https://api.deepseek.com/chat/completions';
                    if (activeProviderId === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
                    if (activeProviderId === 'omniroute') baseUrl = providerKeys.omniroute.endpoint || 'http://localhost:8000/v1/chat/completions';

                    const response = await fetch(baseUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${targetKeyConfig.apiKey.trim()}`,
                            ...(activeProviderId === 'openrouter' ? { 'HTTP-Referer': window.location.origin } : {})
                        },
                        body: JSON.stringify({
                            model: targetKeyConfig.model,
                            messages: [{ role: 'user', content: 'Hello' }],
                            max_tokens: 10
                        })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        setTestStatus('success');
                        setTestMessage(`✅ ${activeProviderId.toUpperCase()} Connection successful!`);
                    } else {
                        throw new Error(data.error?.message || data.message || `HTTP ${response.status}`);
                    }
                } else if (activeProviderId === 'anthropic') {
                    const response = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': targetKeyConfig.apiKey.trim(),
                            'anthropic-version': '2023-06-01'
                        },
                        body: JSON.stringify({
                            model: targetKeyConfig.model,
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
            }
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(`❌ Connection failed: ${error.message || 'Invalid configuration'}`);
        } finally {
            setIsTesting(false);
        }
    };

    // Save configuration to localStorage
    const handleSave = () => {
        setIsSaving(true);

        localStorage.setItem('aiActiveProviderId', activeProviderId);
        localStorage.setItem('aiProviderKeys', JSON.stringify(providerKeys));
        localStorage.setItem('aiCustomProviders', JSON.stringify(customProviders));

        // Backward compatibility sync for legacy callers
        if (activeProviderId === 'google') {
            localStorage.setItem('geminiApiKey', providerKeys.google.apiKey);
            localStorage.setItem('geminiModel', providerKeys.google.model);
        }

        setTimeout(() => {
            setIsSaving(false);
            alert('✅ All Provider API Keys & Settings Saved Successfully!');
        }, 400);
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary via-pink-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <i className="fas fa-brain text-white text-2xl"></i>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Multi-Provider AI & Key Management</h2>
                                <p className="text-white/80 text-sm">Set individual API keys & models for Google, OpenAI, Claude, Groq, DeepSeek, and Unlimited Custom Providers</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddCustomModal(true)}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-white/30"
                        >
                            <i className="fas fa-plus-circle"></i>
                            Add Custom Provider
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Provider Tabs Selector */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Select Active AI Provider
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {[
                                { id: 'google', name: 'Google Gemini', icon: 'fa-brands fa-google', color: 'text-blue-500' },
                                { id: 'openai', name: 'OpenAI (ChatGPT)', icon: 'fas fa-bolt', color: 'text-emerald-500' },
                                { id: 'anthropic', name: 'Anthropic Claude', icon: 'fas fa-brain', color: 'text-amber-600' },
                                { id: 'groq', name: 'Groq (Llama)', icon: 'fas fa-rocket', color: 'text-orange-500' },
                                { id: 'deepseek', name: 'DeepSeek AI', icon: 'fas fa-microchip', color: 'text-indigo-500' },
                                { id: 'openrouter', name: 'OpenRouter', icon: 'fas fa-network-wired', color: 'text-purple-500' },
                                { id: 'omniroute', name: 'OmniRoute Proxy', icon: 'fas fa-route', color: 'text-teal-500' },
                            ].map((p) => {
                                const hasKey = !!providerKeys[p.id as keyof ProviderKeys]?.apiKey;
                                const isActive = activeProviderId === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { setActiveProviderId(p.id); setTestStatus('idle'); }}
                                        className={`p-3 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                                            isActive 
                                                ? 'border-primary bg-pink-50/60 dark:bg-pink-900/30 shadow-md ring-2 ring-primary/20' 
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {hasKey && (
                                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500" title="Key Configured"></span>
                                        )}
                                        <i className={`${p.icon} ${p.color} text-xl mb-2`}></i>
                                        <span className="text-xs font-bold text-gray-800 dark:text-white">{p.name}</span>
                                    </button>
                                );
                            })}

                            {/* Dynamic Custom Providers */}
                            {customProviders.map((cp) => {
                                const isActive = activeProviderId === cp.id;
                                return (
                                    <div
                                        key={cp.id}
                                        className={`p-3 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                                            isActive 
                                                ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-900/30 shadow-md ring-2 ring-purple-500/20' 
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => { setActiveProviderId(cp.id); setTestStatus('idle'); }}
                                            className="w-full text-left"
                                        >
                                            <i className="fas fa-server text-purple-600 text-xl mb-2"></i>
                                            <span className="text-xs font-bold text-gray-800 dark:text-white block truncate">{cp.name}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCustomProvider(cp.id)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xs"
                                            title="Delete Custom Provider"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Active Provider Configuration Box */}
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                            <h3 className="font-bold text-gray-800 dark:text-white capitalize flex items-center gap-2">
                                <i className="fas fa-sliders-h text-primary"></i>
                                {activeProviderId.startsWith('custom_') 
                                    ? `Custom Provider: ${customProviders.find(p => p.id === activeProviderId)?.name}` 
                                    : `${activeProviderId.toUpperCase()} Configuration`}
                            </h3>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 rounded-full">
                                Active Model Engine
                            </span>
                        </div>

                        {/* Standard Provider Configurations */}
                        {!activeProviderId.startsWith('custom_') && (
                            <>
                                {/* API Key Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        {activeProviderId.toUpperCase()} Dedicated API Key
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                type={showApiKey ? "text" : "password"}
                                                value={providerKeys[activeProviderId as keyof ProviderKeys]?.apiKey || ''}
                                                onChange={(e) => handleKeyChange(activeProviderId as keyof ProviderKeys, e.target.value)}
                                                placeholder={`Enter secret API key for ${activeProviderId}...`}
                                                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-sm focus:border-primary transition-all"
                                            />
                                            <button
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <i className={`fas ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Model Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Selected Model
                                    </label>
                                    {activeProviderId === 'google' && (
                                        <>
                                            <select
                                                value={providerKeys.google.model}
                                                onChange={(e) => handleModelChange('google', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                                            >
                                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended - Fast & Free Unlimited)</option>
                                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Powerful)</option>
                                                <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</option>
                                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Requires Paid API Quota)</option>
                                            </select>
                                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5 font-medium">
                                                ⚠️ Note: <strong>Gemini 2.0 Flash</strong> requires a paid Google Cloud billing account (Free keys will throw a 429 quota error). For free keys, select <strong>Gemini 1.5 Flash</strong>.
                                            </p>
                                        </>
                                    )}

                                    {activeProviderId === 'openai' && (
                                        <select
                                            value={providerKeys.openai.model}
                                            onChange={(e) => handleModelChange('openai', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                                        >
                                            <option value="gpt-4o-mini">GPT-4o Mini (Fast & Low Cost)</option>
                                            <option value="gpt-4o">GPT-4o (High Performance)</option>
                                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                        </select>
                                    )}

                                    {activeProviderId === 'anthropic' && (
                                        <select
                                            value={providerKeys.anthropic.model}
                                            onChange={(e) => handleModelChange('anthropic', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                                        >
                                            <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                                            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                                            <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                                        </select>
                                    )}

                                    {activeProviderId === 'groq' && (
                                        <select
                                            value={providerKeys.groq.model}
                                            onChange={(e) => handleModelChange('groq', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                                        >
                                            <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                                            <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                                            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                                        </select>
                                    )}

                                    {activeProviderId === 'deepseek' && (
                                        <select
                                            value={providerKeys.deepseek.model}
                                            onChange={(e) => handleModelChange('deepseek', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm"
                                        >
                                            <option value="deepseek-chat">DeepSeek V3 Chat</option>
                                            <option value="deepseek-reasoner">DeepSeek R1 Reasoner</option>
                                        </select>
                                    )}

                                    {activeProviderId === 'openrouter' && (
                                        <input
                                            type="text"
                                            value={providerKeys.openrouter.model}
                                            onChange={(e) => handleModelChange('openrouter', e.target.value)}
                                            placeholder="e.g. google/gemini-2.0-flash-exp:free or meta-llama/llama-3.3-70b-instruct:free"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-sm"
                                        />
                                    )}

                                    {activeProviderId === 'omniroute' && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                    OmniRoute Local/Proxy Server Endpoint URL
                                                </label>
                                                <input
                                                    type="text"
                                                    value={providerKeys.omniroute.endpoint || 'http://localhost:8000/v1/chat/completions'}
                                                    onChange={(e) => setProviderKeys(prev => ({
                                                        ...prev,
                                                        omniroute: { ...prev.omniroute, endpoint: e.target.value }
                                                    }))}
                                                    placeholder="http://localhost:8000/v1/chat/completions"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                    Target Model / Route Key
                                                </label>
                                                <input
                                                    type="text"
                                                    value={providerKeys.omniroute.model}
                                                    onChange={(e) => handleModelChange('omniroute', e.target.value)}
                                                    placeholder="auto, gpt-4o, llama-3, or custom route"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Custom Provider Dynamic Configuration */}
                        {activeProviderId.startsWith('custom_') && (
                            <div className="space-y-3">
                                {(() => {
                                    const cp = customProviders.find(p => p.id === activeProviderId);
                                    if (!cp) return null;
                                    return (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                    Provider Display Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={cp.name}
                                                    onChange={(e) => handleUpdateCustomField(cp.id, 'name', e.target.value)}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                    API Base / Chat Completion URL Endpoint
                                                </label>
                                                <input
                                                    type="text"
                                                    value={cp.endpoint}
                                                    onChange={(e) => handleUpdateCustomField(cp.id, 'endpoint', e.target.value)}
                                                    placeholder="https://api.your-llm-server.com/v1/chat/completions"
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm font-mono"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                        Dedicated API Key (Optional)
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={cp.apiKey}
                                                        onChange={(e) => handleUpdateCustomField(cp.id, 'apiKey', e.target.value)}
                                                        placeholder="sk-..."
                                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                                        Model Identifier
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={cp.model}
                                                        onChange={(e) => handleUpdateCustomField(cp.id, 'model', e.target.value)}
                                                        placeholder="custom-llama-3"
                                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm font-mono"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Test Connection Button */}
                        <div className="pt-2 flex justify-end">
                            <button
                                onClick={handleTestConnection}
                                disabled={isTesting}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                                {isTesting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plug"></i>}
                                Test Selected Connection
                            </button>
                        </div>
                    </div>

                    {/* Test Result Message */}
                    {testStatus !== 'idle' && (
                        <div className={`p-4 rounded-xl border-2 ${
                            testStatus === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 text-green-800 dark:text-green-300'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-800 dark:text-red-300'
                        }`}>
                            <p className="font-semibold text-sm">{testMessage}</p>
                        </div>
                    )}

                    {/* Save Settings Bar */}
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-3 bg-gradient-to-r from-primary to-pink-600 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
                        >
                            {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            Save All API Keys & Custom Providers
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Custom Provider Modal */}
            {showAddCustomModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleAddCustomProvider} className="bg-white dark:bg-surface-dark rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <i className="fas fa-plus-circle text-primary"></i>
                                Add New Custom API Provider
                            </h3>
                            <button type="button" onClick={() => setShowAddCustomModal(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Provider Name (e.g. My Private Ollama / Local Server)
                            </label>
                            <input
                                type="text"
                                required
                                value={newCustomName}
                                onChange={(e) => setNewCustomName(e.target.value)}
                                placeholder="e.g. Clinic Internal LLM"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Chat Completion URL Endpoint
                            </label>
                            <input
                                type="url"
                                required
                                value={newCustomEndpoint}
                                onChange={(e) => setNewCustomEndpoint(e.target.value)}
                                placeholder="https://api.your-company.com/v1/chat/completions"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 font-mono text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Dedicated API Key (Optional)
                            </label>
                            <input
                                type="password"
                                value={newCustomApiKey}
                                onChange={(e) => setNewCustomApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 font-mono text-xs"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                                Model ID (Optional)
                            </label>
                            <input
                                type="text"
                                value={newCustomModel}
                                onChange={(e) => setNewCustomModel(e.target.value)}
                                placeholder="e.g. llama3-70b"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAddCustomModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-sm bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-hover"
                            >
                                Create Provider
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
