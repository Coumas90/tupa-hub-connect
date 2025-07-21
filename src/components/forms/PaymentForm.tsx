import { useState } from 'react';
import { sanitizeInput, sanitizeFormFields } from '@/utils/sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, User, Calendar, Lock } from 'lucide-react';
import { useToastNotifications } from '@/hooks/use-toast-notifications';

interface PaymentFormProps {
  onPaymentSuccess?: (paymentData: any) => void;
  amount: number;
}

export default function PaymentForm({ onPaymentSuccess, amount }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    postalCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toastNotifications = useToastNotifications();

  const validateForm = () => {
    if (!formData.cardNumber.trim()) {
      setError('Número de tarjeta requerido');
      return false;
    }
    if (!formData.cardName.trim()) {
      setError('Nombre en la tarjeta requerido');
      return false;
    }
    if (!formData.expiryDate.trim()) {
      setError('Fecha de vencimiento requerida');
      return false;
    }
    if (!formData.cvv.trim()) {
      setError('CVV requerido');
      return false;
    }
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sanitize all form fields before processing
      const sanitizedData = sanitizeFormFields(formData);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toastNotifications.showSuccess('Pago procesado exitosamente');
      onPaymentSuccess?.(sanitizedData);
    } catch (error: any) {
      console.error('Payment error:', error);
      setError('Error al procesar el pago. Intenta nuevamente.');
      toastNotifications.showError('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          <CreditCard className="h-6 w-6" />
          Información de Pago
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Monto a pagar: ${amount.toFixed(2)}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número de Tarjeta</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className="pl-10"
                disabled={loading}
                maxLength={19}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName">Nombre en la Tarjeta</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="cardName"
                type="text"
                placeholder="Juan Pérez"
                value={formData.cardName}
                onChange={(e) => handleInputChange('cardName', e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Vencimiento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/AA"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  maxLength={5}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingAddress">Dirección de Facturación</Label>
            <Input
              id="billingAddress"
              type="text"
              placeholder="Calle 123, Colonia Centro"
              value={formData.billingAddress}
              onChange={(e) => handleInputChange('billingAddress', e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                type="text"
                placeholder="Ciudad de México"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input
                id="postalCode"
                type="text"
                placeholder="12345"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                disabled={loading}
                maxLength={10}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando pago...
              </>
            ) : (
              `Pagar $${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}