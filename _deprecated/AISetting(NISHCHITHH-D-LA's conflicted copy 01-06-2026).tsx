import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const AISettings: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-flash-latest'); // Default model
    const [showApiKey, setShowApiKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [debugOutput, setDebugOutput] = useState(''); // New debug state

    // Load API key and model from localStorage on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('geminiApiKey');
        const savedModel = localStorage.getItem('geminiModel');

        if (savedKey) {
            setApiKey(savedKey);
        }
        if (savedModel) {
            setSelectedModel(savedModel);
        }
    }, []);

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
            const genAI = new GoogleGenerativeAI(apiKey.trim());
            const model = genAI.getGenerativeModel({ model: selectedModel });

            // Test with a simple message
            const result = await model.generateContent("Hello");
            const text = await result.response.text();

            if (text) {
                setTestStatus('success');
                setTestMessage('✅ Connection successful! API key is valid.');
            }
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(`❌ Connection failed: ${error.message || 'Invalid API key'}`);
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('geminiApiKey', apiKey.trim());
        localStorage.setItem('geminiModel', selectedModel);

        setTimeout(() => {
            setIsSaving(false);
            alert('✅ API key saved successfully! The chatbot will use this key.');
        }, 500);
    };

    const handleListModels = async () => {
        if (!apiKey.trim()) {
            setDebugOutput('Please enter API key first');
            return;
        }
        setDebugOutput('Fetching models list directly from API...');
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
            const data = await response.json();
            setDebugOutput(JSON.stringify(data, null, 2));

            // Auto-select first available valid model if possible
            if (data.models && data.models.length > 0) {
                const validModels = data.models.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'));
                if (validModels.length > 0) {
                    setTestMessage(`Found ${validModels.length} compatible models!`);
                }
            }
        } catch (error: any) {
            setDebugOutput(`Error fetching models: ${error.message}`);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-pink-600 p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <i className="fas fa-robot text-white text-2xl"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">AI Chatbot Settings</h2>
                            <p className="text-white/80 text-sm">Configure Gemini API for customer chatbot</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <div className="flex gap-3">
                            <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-semibold mb-1">Get your Gemini API Key</p>
                                <p>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google AI Studio</a> to create a free API key for the chatbot.</p>
                            </div>
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Select AI Model
                        </label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                        >
                            <option value="gemini-flash-latest">Gemini Flash (Latest)</option>
                            <option value="gemini-pro-latest">Gemini Pro (Latest)</option>
                            <option value="gemini-2.0-flash-001">Gemini 2.0 Flash (Stable)</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Newest)</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            If connection fails with one model, try selecting a different one.
                        </p>
                    </div>

                    {/* API Key Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Gemini API Key
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Gemini API key..."
                                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    title={showApiKey ? "Hide API key" : "Show API key"}
                                >
                                    <i className={`fas ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            <button
                                onClick={handleTestConnection}
                                disabled={isTesting || !apiKey.trim()}
                                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                                {isTesting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-plug"></i>
                                        Test
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Your API key is stored locally in your browser and never sent to our servers.
                        </p>
                    </div>

                    {/* Test Status */}
                    {testStatus !== 'idle' && (
                        <div className={`p-4 rounded-xl border-2 ${testStatus === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                            }`}>
                            <p className="font-semibold">{testMessage}</p>
                        </div>
                    )}

                    {/* Debug Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <button
                            onClick={handleListModels}
                            className="text-xs text-gray-500 hover:text-primary underline mb-2"
                        >
                            (Debug) Fetch Available Models List
                        </button>
                        {debugOutput && (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-mono h-40 overflow-y-auto">
                                {debugOutput}
                            </pre>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !apiKey.trim()}
                            className="px-8 py-3 bg-gradient-to-r from-primary to-pink-600 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Usage Instructions */}
            <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <i className="fas fa-question-circle text-primary"></i>
                    How to use
                </h3>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex gap-2">
                        <span className="font-bold text-primary">1.</span>
                        <span>Get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a></span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-primary">2.</span>
                        <span>Paste your API key in the input field above</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-primary">3.</span>
                        <span>Click "Test" to verify the connection</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-primary">4.</span>
                        <span>Click "Save Settings" to activate the chatbot</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-primary">5.</span>
                        <span>Customers can now use the AI chatbot on your site!</span>
                    </li>
                </ol>
            </div>
        </div>
    );
};
