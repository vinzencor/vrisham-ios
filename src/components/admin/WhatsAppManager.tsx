import React, { useState } from 'react';
import { MessageCircle, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { sendWhatsAppMessageForOrder } from '../../services/whatsapp';

interface WhatsAppManagerProps {
  orderId?: string;
  className?: string;
}

export function WhatsAppManager({ orderId, className = '' }: WhatsAppManagerProps) {
  const [inputOrderId, setInputOrderId] = useState(orderId || '');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; messageId?: string } | null>(null);

  const handleSendMessage = async () => {
    if (!inputOrderId.trim() || sending) return;

    setSending(true);
    setResult(null);

    try {
      const response = await sendWhatsAppMessageForOrder(inputOrderId.trim());
      
      if (response.success) {
        setResult({
          success: true,
          message: 'WhatsApp message sent successfully!',
          messageId: response.messageId
        });
      } else {
        setResult({
          success: false,
          message: response.error || 'Failed to send WhatsApp message'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">WhatsApp Manager</h3>
          <p className="text-sm text-gray-600">Send order confirmation messages</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
            Order ID
          </label>
          <input
            type="text"
            id="orderId"
            value={inputOrderId}
            onChange={(e) => setInputOrderId(e.target.value)}
            placeholder="Enter Firestore order document ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            disabled={sending}
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!inputOrderId.trim() || sending}
          className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send WhatsApp Message
            </>
          )}
        </button>

        {result && (
          <div className={`p-3 rounded-lg flex items-start gap-3 ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
              {result.success && result.messageId && (
                <p className="text-xs text-green-600 mt-1">
                  Message ID: {result.messageId}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Usage Instructions:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Enter the Firestore document ID of the order</li>
          <li>• The system will fetch order details and send WhatsApp confirmation</li>
          <li>• Message status will be updated in the order document</li>
          <li>• Use this for manual resending or testing purposes</li>
        </ul>
      </div>
    </div>
  );
}

// Standalone page component for admin use
export function WhatsAppManagerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WhatsApp Manager</h1>
          <p className="text-gray-600">
            Send WhatsApp order confirmation messages manually
          </p>
        </div>
        
        <WhatsAppManager />
        
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">API Configuration</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Endpoint:</span>
              <span className="font-mono text-gray-900">https://api.interakt.ai/v1/public/message/</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Authentication:</span>
              <span className="font-mono text-gray-900">Basic Auth</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Template:</span>
              <span className="font-mono text-gray-900">order_confirmation</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Language:</span>
              <span className="font-mono text-gray-900">en</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
