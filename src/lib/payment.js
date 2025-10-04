// Service de paiement Airtel Money
const AIRTEL_MONEY_API_URL = import.meta.env.VITE_AIRTEL_MONEY_API_URL;

/**
 * Effectue un paiement via Airtel Money
 * @param {Object} paymentData - Données du paiement
 * @param {number} paymentData.amount - Montant en FCFA
 * @param {string} paymentData.mobileNumber - Numéro de téléphone
 * @returns {Promise<Object>} - Résultat du paiement
 */
export const processAirtelMoneyPayment = async (paymentData) => {
    try {
        if (!AIRTEL_MONEY_API_URL) {
            throw new Error('URL de l\'API Airtel Money non configurée');
        }


        // Paiement réel via API AirtelMoney
        const response = await fetch(AIRTEL_MONEY_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `amount=${paymentData.amount}&numero=${paymentData.mobileNumber}`
        });

        const responseText = await response.text();

        // Vérifier si la réponse contient "successfully processed" ou un JSON avec status_message
        let isSuccess = false;

        try {
            const jsonResponse = JSON.parse(responseText);
            isSuccess = jsonResponse.status_message && /successfully processed/i.test(jsonResponse.status_message);
        } catch (e) {
            // Si ce n'est pas du JSON, vérifier le texte brut
            isSuccess = /successfully processed/i.test(responseText);
        }

        if (!isSuccess) {
            throw new Error("Le paiement n'a pas pu être validé.");
        }

        // Générer un ID de transaction pour la base de données
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        return {
            success: true,
            transactionId: transactionId,
            message: 'Paiement effectué avec succès',
            data: {
                amount: paymentData.amount,
                numero: paymentData.mobileNumber,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Erreur lors du traitement du paiement',
        };
    }
};

/**
 * Génère une référence unique pour le paiement
 * @param {string} type - Type de paiement
 * @param {string} userId - ID de l'utilisateur
 * @returns {string} - Référence unique
 */
export const generatePaymentReference = (type, userId) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${type}_${userId}_${timestamp}_${random}`.toUpperCase();
};

/**
 * Valide un numéro de téléphone
 * @param {string} mobileNumber - Numéro à valider
 * @returns {boolean} - True si valide
 */
export const validateMobileNumber = (mobileNumber) => {
    // Format pour les numéros ivoiriens avec 9 chiffres commençant par 074, 077, ou 076
    const phoneRegex = /^(074|077|076)[0-9]{6}$/;
    return phoneRegex.test(mobileNumber.replace(/\s/g, ''));
};

/**
 * Formate un numéro de téléphone pour l'affichage
 * @param {string} mobileNumber - Numéro à formater
 * @returns {string} - Numéro formaté
 */
export const formatMobileNumber = (mobileNumber) => {
    const cleaned = mobileNumber.replace(/\D/g, '');
    if (cleaned.length === 9) {
        return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)}`;
    }
    return mobileNumber;
};

/**
 * Obtient la description du paiement selon le type
 * @param {string} type - Type de paiement
 * @param {Object} additionalData - Données supplémentaires
 * @returns {string} - Description
 */
export const getPaymentDescription = (type, additionalData = {}) => {
    switch (type) {
        case 'creator_activation':
            return 'Activation du profil créateur BENDZA';
        case 'subscription':
            return `Abonnement à ${additionalData.creatorName || 'un créateur'}`;
        case 'content_purchase':
            return `Achat de contenu - ${additionalData.contentTitle || 'Contenu exclusif'}`;
        default:
            return 'Paiement BENDZA';
    }
}; 