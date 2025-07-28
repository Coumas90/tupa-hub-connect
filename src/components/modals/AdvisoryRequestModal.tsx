import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import AdvisoryRequestForm from '@/components/forms/AdvisoryRequestForm';

interface AdvisoryRequestModalProps {
  cafeId: string;
  children?: React.ReactNode;
}

export default function AdvisoryRequestModal({ cafeId, children }: AdvisoryRequestModalProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-gradient-to-r from-warm-primary to-warm-earth hover:from-warm-earth hover:to-warm-primary">
            <Calendar className="h-4 w-4 mr-2" />
            Programar Asesoría
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Solicitar Asesoría</DialogTitle>
          <DialogDescription>
            Completa el formulario para solicitar una asesoría con TUPÁ
          </DialogDescription>
        </DialogHeader>
        <AdvisoryRequestForm cafeId={cafeId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}