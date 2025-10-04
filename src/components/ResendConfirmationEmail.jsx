import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { supabase } from '../lib/supabase';
import { Mail, CheckCircle } from 'lucide-react';

function ResendConfirmationEmail() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleResend = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir votre adresse email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`
        }
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setSent(true);
        toast({
          title: "Email envoyé",
          description: "Un nouvel email de confirmation a été envoyé à votre adresse"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center p-6 bg-gray-900 rounded-lg">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Email envoyé !
        </h3>
        <p className="text-gray-300 mb-4">
          Un nouvel email de confirmation a été envoyé à {email}
        </p>
        <Button
          onClick={() => setSent(false)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Renvoyer un autre email
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg">
      <div className="flex items-center mb-4">
        <Mail className="w-6 h-6 text-orange-500 mr-2" />
        <h3 className="text-lg font-semibold text-white">
          Renvoyer l'email de confirmation
        </h3>
      </div>
      
      <form onSubmit={handleResend} className="space-y-4">
        <div>
          <label htmlFor="resend-email" className="block text-sm font-medium text-gray-300 mb-1">
            Adresse email
          </label>
          <Input
            id="resend-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {loading ? 'Envoi...' : 'Renvoyer l\'email'}
        </Button>
      </form>
    </div>
  );
}

export default ResendConfirmationEmail; 