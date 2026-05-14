import React, { useState } from 'react';
import { Modal, Button, Input, Card } from '@/components/shared';
import { CreditCard, Lock, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  title: string;
  description: string;
}

export function PaymentModal({ isOpen, onClose, onSuccess, amount, title, description }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Basic validation mock
      const rawCard = cardNumber.replace(/\D/g, '');
      if (rawCard.length < 16) {
        throw new Error('Invalid card number: must be 16 digits');
      }

      const rawExpiry = expiry.replace(/\D/g, '');
      if (rawExpiry.length < 4) {
        throw new Error('Invalid expiry date');
      }
      const month = parseInt(rawExpiry.slice(0, 2), 10);
      const year = parseInt(`20${rawExpiry.slice(2, 4)}`, 10);
      const now = new Date();
      if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
        throw new Error('Card has expired');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join('-') || raw;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      const mm = raw.slice(0, 2);
      const yy = raw.slice(2, 4);
      let validMm = mm;
      if (parseInt(mm, 10) > 12) validMm = '12';
      else if (mm === '00') validMm = '01';
      raw = validMm + yy;
    }
    if (raw.length > 2) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 mb-2">{description}</p>
          <p className="text-3xl font-bold text-gray-900">${(amount / 100).toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="p-4 border-primary-100 bg-primary-50/30">
            <div className="flex items-center gap-2 text-primary-700 mb-4 text-sm font-medium">
              <Lock className="w-4 h-4" />
              Secure Payment via Stripe Mock
            </div>

            <div className="space-y-4">
              <Input
                label="Card Number"
                placeholder="4242-4242-4242-4242"
                value={cardNumber}
                onChange={handleCardChange}
                icon={<CreditCard className="w-5 h-5 text-gray-400" />}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry Date"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiryChange}
                  required
                />
                <Input
                  label="CVC"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  required
                />
              </div>
            </div>
          </Card>

          {error && (
            <div className="p-3 bg-danger-50 text-danger-700 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              icon={<ShieldCheck className="w-5 h-5" />}
            >
              Pay Now
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Your payment information is encrypted and never stored on our servers.
        </p>
      </div>
    </Modal>
  );
}
