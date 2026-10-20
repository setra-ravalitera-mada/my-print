import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import nodemailer from 'nodemailer';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // MVola API Proxy endpoint to avoid CORS issues in browser
  app.post('/api/mvola/pay', async (req, res) => {
    try {
      const {
        consumerKey,
        consumerSecret,
        merchantPhone,
        partnerName,
        isSandbox,
        customerPhone,
        amount,
        description,
        orderRef,
        environmentUrl,
      } = req.body;

      if (!consumerKey || !consumerSecret) {
        return res.status(400).json({
          success: false,
          message: 'Consumer Key et Consumer Secret requis.',
        });
      }

      const tokenUrl = isSandbox
        ? 'https://pre-api.mvola.mg/token'
        : 'https://api.mvola.mg/token';

      const credentials = Buffer.from(
        `${consumerKey.trim()}:${consumerSecret.trim()}`
      ).toString('base64');

      console.log('Obtention token MVola auprès de:', tokenUrl);

      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials&scope=EXT_INT_MVOLA_SCOPE',
      });

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error('Erreur authentification MVola:', tokenResponse.status, errText);
        return res.status(401).json({
          success: false,
          message: `Erreur authentification MVola (${tokenResponse.status}): ${errText}`,
        });
      }

      const tokenData = await tokenResponse.json();
      const token = tokenData.access_token;

      const defaultPayUrl = isSandbox
        ? 'https://pre-api.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/'
        : 'https://api.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0/';
      const payUrl = (environmentUrl && environmentUrl.trim()) ? environmentUrl.trim() : defaultPayUrl;
      const correlationId = `corr-${Date.now()}-${Math.floor(
        Math.random() * 100000
      )}`;
      const cleanCustomerPhone = (customerPhone || '').replace(/\s+/g, '');
      const cleanMerchantPhone = (merchantPhone || '').replace(/\s+/g, '') || '0340000000';

      const requestBody = {
        amount: String(Math.round(amount)),
        currency: 'Ar',
        descriptionText: description || `Commande My PRINT ${orderRef}`,
        requestingOrganisationTransactionReference: orderRef,
        requestDate: new Date().toISOString(),
        originalTransactionReference: orderRef,
        debitParty: [{ key: 'msisdn', value: cleanCustomerPhone }],
        creditParty: [{ key: 'msisdn', value: cleanMerchantPhone }],
        metadata: [
          { key: 'partnerName', value: partnerName || 'My PRINT' },
          { key: 'orderRef', value: orderRef },
        ],
      };

      console.log('Envoi requête Merchant Pay MVola vers:', payUrl);

      const payResponse = await fetch(payUrl, {
        method: 'POST',
        headers: {
          'Version': '1.0.0',
          'X-CorrelationID': correlationId,
          'UserAccountIdentifier': `msisdn;${cleanMerchantPhone}`,
          'partnerName': partnerName || 'My PRINT',
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const payData = await payResponse.json().catch(() => ({}));

      if (payResponse.ok || payResponse.status === 200 || payResponse.status === 202) {
        return res.json({
          success: true,
          serverCorrelationId: payData.serverCorrelationId || correlationId,
          status: payData.status || 'pending',
          transactionReference: payData.transactionReference || payData.serverCorrelationId,
          transactionRef: payData.transactionReference || `MVOLA-${isSandbox ? 'SBX' : 'LIVE'}-${Math.floor(100000 + Math.random() * 900000)}`,
          message: 'Demande PUSH envoyée avec succès sur le mobile client.',
        });
      } else {
        console.error('Erreur API MVola Pay:', payResponse.status, payData);
        return res.status(payResponse.status).json({
          success: false,
          message: `Erreur API MVola (${payResponse.status}): ${JSON.stringify(payData)}`,
        });
      }
    } catch (err: any) {
      console.error('Erreur proxy MVola:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Erreur serveur proxy MVola',
      });
    }
  });

  // Endpoint de notification de commande par email
  app.post('/api/orders/notify', async (req, res) => {
    try {
      const { order, cc, bcc, type = 'commande' } = req.body;
      if (!order) {
        return res.status(400).json({ success: false, message: 'Détails de la commande manquants.' });
      }

      const emailUser = process.env.VITE_EMAIL_USER || 'grossite.interprint@gmail.com';
      const emailPass = process.env.VITE_EMAIL_PASS;

      // Si le mot de passe est manquant ou est resté sur la valeur d'exemple
      if (!emailPass || emailPass === "votre_mot_de_passe_application_gmail" || emailPass.trim() === "") {
        console.warn('VITE_EMAIL_PASS non configuré ou valeur par défaut. Simulation de l\'envoi vers client.myprint@gmail.com');
        return res.json({ 
          success: true, 
          message: 'Simulation d\'envoi réussie (VITE_EMAIL_PASS manquant ou non configuré).',
          simulated: true 
        });
      }

      // Configuration du transporteur optimisée pour les mots de passe d'application Google
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const isProforma = type === 'proforma';
      const title = isProforma ? 'Demande de Facture Proforma' : 'Nouvelle Commande Reçue';
      const emoji = isProforma ? '📄' : '🔔';

      const itemsHtml = order.items.map((item: any) => `
        <li>
          <strong>${item.productName}</strong> (${item.variantName})<br/>
          Quantité: ${item.quantity} | Prix: ${item.unitPrice.toLocaleString('fr-FR')} Ar<br/>
          Marquage: ${item.customBrandingText}
        </li>
      `).join('');

      const mailOptions = {
        from: `"My PRINT Madagascar" <${emailUser}>`,
        to: 'client.myprint@gmail.com',
        cc: cc, // Chaîne ou tableau d'adresses
        bcc: bcc,
        subject: `${emoji} ${title} : ${order.id}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #00375e; border-bottom: 2px solid #ff9d00; padding-bottom: 10px;">${title}</h2>
            <p>Une nouvelle action a été effectuée sur My PRINT Madagascar.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <p><strong>ID :</strong> ${order.id}</p>
              <p><strong>Client :</strong> ${order.contactEmail || 'Non renseigné'}</p>
              <p><strong>Nom :</strong> ${order.contactName || 'Non renseigné'}</p>
              <p><strong>Tél :</strong> ${order.contactPhone || 'Non renseigné'}</p>
              <p><strong>Note :</strong> ${order.clientNote || 'Aucune'}</p>
              <p><strong>Date :</strong> ${new Date(order.createdAt).toLocaleString('fr-FR')}</p>
            </div>

            <h3 style="color: #00375e;">Détails des articles :</h3>
            <ul>
              ${itemsHtml}
            </ul>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 1.2em; font-weight: bold; color: #ff9d00;">
              Total: ${order.totalAmount.toLocaleString('fr-FR')} Ar
            </div>

            <p style="margin-top: 30px; font-size: 0.8em; color: #888;">
              Ceci est une notification automatique générée par le système My PRINT.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email de notification (${type}) envoyé pour ${order.id}`);
      return res.json({ success: true, message: 'Email envoyé avec succès.' });
    } catch (err: any) {
      console.error('Erreur lors de l\'envoi de la notification email:', err);
      
      let clientMessage = 'Erreur lors de l\'envoi de la notification.';
      if (err.message && err.message.includes('534-5.7.9')) {
        clientMessage = 'Erreur Gmail : Un "Mot de passe d\'application" est requis.';
      }

      return res.status(500).json({ 
        success: false, 
        message: clientMessage, 
        error: err.message 
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Dev server must always listen on port 3000 on 0.0.0.0
  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
