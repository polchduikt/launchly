import React from 'react';
import { LegalLayout } from './LegalLayout';

export const AiTermsPage: React.FC = () => {
  return (
    <LegalLayout title="AI Supplementary Terms" effectiveDate="AUGUST 14, 2026">
      <p className="text-base font-medium text-slate-900 leading-relaxed">
        These AI Supplementary Terms (&quot;AI Terms&quot;) govern your use of artificial intelligence features, AI Assistant nodes, and automated AI chat responses within Launchly.
      </p>

      <h2 className="text-xl font-black text-slate-950 pt-4 border-t border-slate-200">
        1. AI Processing &amp; Sub-Processors
      </h2>
      <p>
        When you configure AI nodes in Launchly (e.g., ChatGPT, Claude, Gemini, DeepSeek), prompts and context provided by your flow schema or subscriber messages are processed by authorized third-party LLM providers (e.g., OpenAI, Anthropic, Google).
      </p>
      <ul className="list-square pl-6 space-y-2 text-slate-800 font-medium">
        <li><strong>No Training on Customer Data:</strong> Launchly requires LLM provider integrations to enforce policies that prohibit training public AI models on your proprietary prompt data or customer messages.</li>
        <li><strong>Data Security:</strong> AI API queries are transmitted via encrypted HTTPS TLS 1.3 connections.</li>
      </ul>

      <h2 className="text-xl font-black text-slate-950 pt-4 border-t border-slate-200">
        2. Customer Responsibilities &amp; AI Accuracy
      </h2>
      <p>
        AI models generate probabilistic responses. You are responsible for testing prompt prompts, verifying system instructions, and setting fallback actions for AI node execution. Launchly does not guarantee 100% factual accuracy of AI-generated responses.
      </p>
    </LegalLayout>
  );
};

export default AiTermsPage;
