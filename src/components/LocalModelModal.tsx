import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Cpu,
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  Activity,
  HardDrive,
} from 'lucide-react';
import { LocalModelConfig } from '../types/yuna';
import { saveLocalModelConfig } from '../services/storage';

interface LocalModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LocalModelConfig;
  onSave: (config: LocalModelConfig) => void;
}

export const LocalModelModal: React.FC<LocalModelModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  if (!isOpen) return null;

  const [formConfig, setFormConfig] = useState<LocalModelConfig>({ ...config });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message: string;
  } | null>(null);

  const presets = [
    {
      name: 'Local Whisper API (FastAPI / Docker)',
      url: 'http://localhost:8000/v1/audio/transcriptions',
      model: 'whisper-1',
    },
    {
      name: 'Whisper.cpp Local Server',
      url: 'http://localhost:8080/inference',
      model: 'whisper.cpp-korean',
    },
    {
      name: 'LocalAI / LM Studio Audio Gateway',
      url: 'http://localhost:1234/v1/audio/transcriptions',
      model: 'whisper-large-v3-turbo',
    },
    {
      name: 'Ollama Audio Endpoint',
      url: 'http://localhost:11434/api/generate',
      model: 'whisper',
    },
  ];

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/yuna/test-local-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointUrl: formConfig.endpointUrl }),
      });

      const data = await res.json();
      if (data.reachable) {
        setTestResult({
          success: true,
          latencyMs: data.latencyMs,
          message: `Endpoint active! Response latency: ${data.latencyMs}ms`,
        });
        setFormConfig((prev) => ({
          ...prev,
          isTested: true,
          latencyMs: data.latencyMs,
          testedAt: Date.now(),
        }));
      } else {
        setTestResult({
          success: false,
          latencyMs: data.latencyMs,
          message: `Could not reach ${formConfig.endpointUrl}. Make sure your local server is running.`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveLocalModelConfig(formConfig);
    onSave(formConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Local Speech Recognition Models</h2>
            <p className="text-xs text-stone-400">Private, on-device voice processing for Korean audio.</p>
          </div>
        </div>

        {/* Engine Mode Selection */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-semibold text-stone-300 block uppercase tracking-wider">
            Speech Recognition Engine
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Mode 1: Browser Web Speech */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                formConfig.mode === 'browser'
                  ? 'bg-amber-950/30 border-amber-500/40 text-white'
                  : 'bg-stone-800/40 border-stone-700/60 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <input
                type="radio"
                name="stt_mode"
                checked={formConfig.mode === 'browser'}
                onChange={() => setFormConfig({ ...formConfig, mode: 'browser' })}
                className="mt-1 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Browser Native (Web Speech API)</span>
                  <span className="text-[11px] text-emerald-400 font-medium">Zero-setup</span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Uses device-native Korean speech recognition with zero cloud audio uploading.
                </p>
              </div>
            </label>

            {/* Mode 2: Custom Local Model */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                formConfig.mode === 'local_endpoint'
                  ? 'bg-amber-950/30 border-amber-500/40 text-white'
                  : 'bg-stone-800/40 border-stone-700/60 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <input
                type="radio"
                name="stt_mode"
                checked={formConfig.mode === 'local_endpoint'}
                onChange={() => setFormConfig({ ...formConfig, mode: 'local_endpoint' })}
                className="mt-1 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Custom Local Model (Whisper / Ollama)</span>
                  <span className="text-[11px] text-sky-400 font-medium">100% Private</span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Route voice audio directly to a locally hosted Whisper or Ollama speech server.
                </p>
              </div>
            </label>

            {/* Mode 3: Cloud Gemini Transcribe */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                formConfig.mode === 'cloud'
                  ? 'bg-amber-950/30 border-amber-500/40 text-white'
                  : 'bg-stone-800/40 border-stone-700/60 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <input
                type="radio"
                name="stt_mode"
                checked={formConfig.mode === 'cloud'}
                onChange={() => setFormConfig({ ...formConfig, mode: 'cloud' })}
                className="mt-1 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Cloud Enhanced (Gemini 3.5 Transcribe)</span>
                  <span className="text-[11px] text-amber-400 font-medium">High Accuracy</span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  High sensitivity transcription via Gemini server proxy.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Local Endpoint Details (When Mode = local_endpoint) */}
        {formConfig.mode === 'local_endpoint' && (
          <div className="space-y-3.5 mb-5 p-3.5 bg-stone-950/60 border border-stone-800 rounded-xl">
            {/* Quick Presets */}
            <div>
              <span className="text-xs text-stone-400 block mb-1.5">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setFormConfig({
                        ...formConfig,
                        endpointUrl: preset.url,
                        modelName: preset.model,
                      })
                    }
                    className="text-[11px] px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-md transition-colors cursor-pointer"
                  >
                    {preset.name.split(' ')[0]} ({preset.model})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-stone-300 block mb-1 font-medium">
                Local Endpoint URL
              </label>
              <input
                type="text"
                value={formConfig.endpointUrl}
                onChange={(e) => setFormConfig({ ...formConfig, endpointUrl: e.target.value })}
                placeholder="http://localhost:8000/v1/audio/transcriptions"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-stone-300 block mb-1 font-medium">
                Model Name
              </label>
              <input
                type="text"
                value={formConfig.modelName}
                onChange={(e) => setFormConfig({ ...formConfig, modelName: e.target.value })}
                placeholder="whisper-1 or korean-whisper"
                className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Test Connection Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !formConfig.endpointUrl}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg disabled:opacity-50 transition-colors cursor-pointer font-medium"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTesting ? 'Testing Ping...' : 'Ping & Test Local Endpoint'}</span>
              </button>

              {testResult && (
                <div
                  className={`mt-2 p-2 rounded-lg text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                      : 'bg-rose-950/40 text-rose-300 border border-rose-800/40'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Privacy Assurance Card */}
        <div className="p-3 bg-stone-800/40 border border-stone-800 rounded-xl flex items-start gap-2.5 text-xs text-stone-400 mb-5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-stone-300">Privacy Guarantee: </span>
            <span>
              When using Browser Native or Local Model endpoints, voice audio recordings stay 100% on your local machine and never touch external cloud servers.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition-colors cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
