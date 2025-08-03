import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { supabase } from '../lib/supabase';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import ResendConfirmationEmail from '../components/ResendConfirmationEmail';

function EmailConfirmation() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const handleEmailConfirmation = async () => {
            const token = searchParams.get('token');
            const type = searchParams.get('type');

            if (token && type === 'signup') {
                try {
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: token,
                        type: 'signup'
                    });

                    if (error) {
                        setStatus('error');
                        setMessage('Erreur lors de la confirmation de l\'email. Veuillez réessayer.');
                    } else {
                        setStatus('success');
                        setMessage('Votre email a été confirmé avec succès ! Vous pouvez maintenant vous connecter.');
                    }
                } catch (error) {
                    setStatus('error');
                    setMessage('Une erreur s\'est produite. Veuillez réessayer.');
                }
            } else {
                setStatus('info');
                setMessage('Vérifiez votre boîte email et cliquez sur le lien de confirmation pour activer votre compte.');
            }
        };

        handleEmailConfirmation();
    }, [searchParams]);

    const getIcon = () => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-16 h-16 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-16 h-16 text-red-500" />;
            default:
                return <Mail className="w-16 h-16 text-orange-500" />;
        }
    };

    const getTitle = () => {
        switch (status) {
            case 'success':
                return 'Email confirmé !';
            case 'error':
                return 'Erreur de confirmation';
            default:
                return 'Confirmation d\'email requise';
        }
    };

    const getDescription = () => {
        switch (status) {
            case 'success':
                return 'Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter et commencer à utiliser BENDZA.';
            case 'error':
                return 'Une erreur s\'est produite lors de la confirmation de votre email. Veuillez réessayer ou contacter le support.';
            default:
                return 'Nous avons envoyé un email de confirmation à votre adresse. Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-black flex items-center justify-center p-4"
        >
            <Helmet>
                <title>Confirmation d'email - BENDZA</title>
                <meta name="description" content="Confirmez votre email pour activer votre compte BENDZA" />
            </Helmet>

            <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 text-center">
                <div className="flex justify-center mb-6">
                    {getIcon()}
                </div>

                <h1 className="text-2xl font-bold text-white mb-4">
                    {getTitle()}
                </h1>

                <p className="text-gray-300 mb-6">
                    {getDescription()}
                </p>

                {status === 'loading' && (
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                )}

                <div className="space-y-3">
                    {status === 'success' && (
                        <Link
                            to="/login"
                            className="block w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            Se connecter
                        </Link>
                    )}

                    {status === 'error' && (
                        <>
                            <Link
                                to="/register"
                                className="block w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Réessayer l'inscription
                            </Link>
                            <Link
                                to="/login"
                                className="block w-full px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-500 font-semibold rounded-lg hover:bg-orange-500 hover:text-white transition-colors"
                            >
                                Aller à la connexion
                            </Link>
                        </>
                    )}

                    {status === 'info' && (
                        <>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                J'ai confirmé mon email
                            </button>
                            <Link
                                to="/login"
                                className="block w-full px-6 py-3 bg-transparent border-2 border-orange-500 text-orange-500 font-semibold rounded-lg hover:bg-orange-500 hover:text-white transition-colors"
                            >
                                Aller à la connexion
                            </Link>
                        </>
                    )}

                    <Link
                        to="/"
                        className="block w-full px-6 py-3 bg-transparent border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Retour à l'accueil
                    </Link>
                </div>

                {status === 'info' && (
                    <>
                        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                            <h3 className="text-sm font-semibold text-white mb-2">Conseils :</h3>
                            <ul className="text-xs text-gray-400 space-y-1 text-left">
                                <li>• Vérifiez votre dossier spam/pourriels</li>
                                <li>• Assurez-vous d'avoir saisi la bonne adresse email</li>
                                <li>• Le lien de confirmation expire après 24h</li>
                            </ul>
                        </div>
                        <div className="mt-6">
                            <ResendConfirmationEmail />
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default EmailConfirmation; 