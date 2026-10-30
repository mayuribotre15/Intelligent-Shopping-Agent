import React, { useState, useRef, useEffect } from 'react';
import { agentAPI } from '../services/api';
import { useShoppingStore } from '../store/store';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  'What are the best noise-cancelling headphones under $300?',
  'Compare Sony WH-1000XM5 vs Apple AirPods Pro 2',
  'Should I buy the Sony headphones now or wait for a discount?',
  'Analyse the reviews for Sony WH-1000XM5',
  'What are the sustainability scores for these headphones?',
  'Show me the best deals across all platforms for wireless earbuds',
  'Recommend the best value-for-money Bluetooth headphones',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 14,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', marginRight: 10,
          background: 'linear-gradient(135deg, #1a56db, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>🤖</div>
      )}
      <div style={{
        maxWidth: '75%',
        background: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
        color: isUser ? '#fff' : 'var(--color-text)',
        border: isUser ? 'none' : '1px solid var(--color-border)',
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        padding: '12px 16px',
        fontSize: 13,
        lineHeight: 1.6,
        boxShadow: 'var(--shadow-sm)',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
        {msg.timestamp && (
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
            {new Date(msg.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', marginLeft: 10,
          background: '#e2e8f0', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 14, flexShrink: 0,
        }}>👤</div>
      )}
    </div>
  );
}

export default function Agent() {
  const [input, setInput] = useState('');
  const { chatHistory, agentLoading, addMessage, setAgentLoading } = useShoppingStore();
  const endRef = useRef();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, agentLoading]);

  async function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    addMessage({ role: 'user', content: msg, timestamp: new Date().toISOString() });
    setAgentLoading(true);

    try {
      const res = await agentAPI.query({ message: msg });
      const reply = res.data.message || JSON.stringify(res.data, null, 2);
      addMessage({
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        meta: {
          intent: res.data.intent,
          confidence: res.data.confidence,
          source: res.data.source,
          disclaimer: res.data.review_disclaimer || res.data.price_stats?.data_disclaimer,
        },
      });
    } catch {
      addMessage({
        role: 'assistant',
        content: 'I encountered an issue processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      });
      toast.error('Agent request failed.');
    } finally {
      setAgentLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>🤖 Shopping AI Agent</h1>
          <span className="ai-chip">Llama 3.3 70B · IBM watsonx.ai</span>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>
          Ask me anything about products, prices, reviews, comparisons, or shopping advice.
        </p>
      </div>

      {/* Ethics banner */}
      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
        padding: '8px 14px', fontSize: 12, color: '#92400e', marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        ⚠️ <strong>Responsible AI:</strong> I provide information to assist your decision. I will never fabricate prices, reviews, or predictions. All AI insights carry explicit uncertainty levels.
      </div>

      {/* Quick prompts */}
      {chatHistory.length === 0 && (
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-muted)' }}>💡 Try asking:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div style={{
        flex: 1, overflowY: 'auto',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12, padding: 20,
        marginBottom: 14,
      }}>
        {chatHistory.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-muted)', paddingTop: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
            <p style={{ fontWeight: 600 }}>Your Intelligent Shopping Agent</p>
            <p style={{ fontSize: 12 }}>Ask about products, deals, price trends, reviews, or get personalised recommendations.</p>
          </div>
        )}
        {chatHistory.map((msg, i) => <Message key={i} msg={msg} />)}
        {agentLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-muted)', fontSize: 13 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a56db, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🤖</div>
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="spinner" />
              Analysing with IBM watsonx.ai…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about products, prices, reviews, or recommendations…"
          disabled={agentLoading}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 10,
            border: '1.5px solid var(--color-border)', fontSize: 14,
            outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage()}
          disabled={agentLoading || !input.trim()}
          style={{ minWidth: 80 }}
        >
          {agentLoading ? <span className="spinner" /> : '↑ Send'}
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 6, textAlign: 'center' }}>
        Powered by IBM watsonx.ai · Llama 3.3 70B Instruct · Responsible AI practices applied
      </div>
    </div>
  );
}
