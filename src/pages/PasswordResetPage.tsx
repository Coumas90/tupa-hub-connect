import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PasswordResetModal from '@/components/auth/PasswordResetModal';

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      setModalOpen(true);
    } else {
      // No token, redirect to login
      navigate('/auth');
    }
  }, [token, navigate]);

  const handleModalClose = () => {
    setModalOpen(false);
    navigate('/auth');
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-cream/5 to-warm-gold/5 flex items-center justify-center">
      <PasswordResetModal 
        token={token} 
        open={modalOpen} 
        onOpenChange={handleModalClose}
      />
    </div>
  );
}