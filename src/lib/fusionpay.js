import { FusionPay } from "fusionpay";

// Configuration FusionPay
const FUSIONPAY_API_URL = "https://www.pay.moneyfusion.net/Bendza/87899217408b030d/pay/";
const RETURN_URL = `${window.location.origin}/payment-callback`;
const WEBHOOK_URL = `${window.location.origin}/api/webhook/fusionpay`;

// Types pour les données de paiement créateur
// (Commentaire TypeScript pour référence)
// interface CreatorPaymentData {
//   userId: string;
//   userEmail: string;
//   userName: string;
//   amount: number;
//   type: 'creator_activation';
// }

class FusionPayService {
  constructor() {
    this.fusionPay = new FusionPay(FUSIONPAY_API_URL);
  }

  /**
   * Initialise un paiement pour l'activation de compte créateur ou l'achat de contenu
   */
  async initiateCreatorPayment(paymentData) {
    try {
      console.log('FusionPay: Initiating payment:', paymentData);

      // Déterminer le type d'article selon le type de paiement
      let articleName = "Activation compte créateur";
      if (paymentData.type === 'content_purchase') {
        articleName = paymentData.contentTitle || "Contenu exclusif";
      }

      // Configuration du paiement
      this.fusionPay
        .totalPrice(paymentData.amount)
        .addArticle(articleName, paymentData.amount)
        .addInfo({
          userId: paymentData.userId,
          userEmail: paymentData.userEmail,
          userName: paymentData.userName,
          type: paymentData.type,
          contentId: paymentData.contentId || null
        })
        .clientName(paymentData.userName)
        .clientNumber(paymentData.userPhone || "00000000") // Numéro par défaut si non fourni
        .returnUrl(RETURN_URL)
        .webhookUrl(WEBHOOK_URL);

      // Effectuer le paiement
      const response = await this.fusionPay.makePayment();
      
      console.log('FusionPay: Payment initiated successfully:', response);
      console.log('FusionPay: Response structure:', {
        url: response?.url,
        token: response?.token,
        message: response?.message,
        fullResponse: response
      });
      
      // Vérifier que l'URL existe
      if (!response?.url) {
        throw new Error('URL de paiement manquante dans la réponse FusionPay');
      }
      
      return {
        success: true,
        paymentUrl: response.url,
        token: response.token,
        message: response.message
      };

    } catch (error) {
      console.error('❌ FusionPay: Payment initiation failed:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'initiation du paiement'
      };
    }
  }

  /**
   * Vérifie le statut d'un paiement
   */
  async checkPaymentStatus(token) {
    try {
      console.log('FusionPay: Checking payment status for token:', token);

      const status = await this.fusionPay.checkPaymentStatus(token);
      
      console.log('FusionPay: Payment status:', status);

      if (status.statut && status.data.statut === "paid") {
        return {
          success: true,
          paid: true,
          data: status.data,
          customData: status.data.personal_Info[0] || {}
        };
      } else if (status.statut && status.data.statut === "pending") {
        return {
          success: true,
          paid: false,
          pending: true,
          data: status.data
        };
      } else {
        return {
          success: true,
          paid: false,
          failed: true,
          data: status.data
        };
      }

    } catch (error) {
      console.error('❌ FusionPay: Status check failed:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la vérification du paiement'
      };
    }
  }

  /**
   * Redirige l'utilisateur vers la page de paiement
   */
  redirectToPayment(paymentUrl) {
    console.log('FusionPay: Redirecting to payment URL:', paymentUrl);
    window.location.href = paymentUrl;
  }

  /**
   * Extrait le token de l'URL de callback
   */
  extractTokenFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('token');
      console.log('FusionPay: Extracted token from URL:', token);
      return token;
    } catch (error) {
      console.error('FusionPay: Error extracting token from URL:', error);
      return null;
    }
  }
}

// Instance singleton
export const fusionPayService = new FusionPayService();

// Export de la classe pour les tests
export { FusionPayService };
