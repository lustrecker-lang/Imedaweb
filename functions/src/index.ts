import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { Resend } from "resend";

// Define Resend API key as a secret
const resendApiKey = defineSecret("RESEND_API_KEY");

// Recipients for lead notifications
const NOTIFICATION_RECIPIENTS = ["info@imeda.fr", "amel@imeda.fr"];

// Admin panel URL for direct access
const ADMIN_LEADS_URL = "https://imeda.fr/admin/leads";

interface LeadData {
  fullName?: string;
  email?: string;
  phone?: string;
  leadType?: string;
  message?: string;
  courseName?: string;
  createdAt?: { toDate: () => Date } | Date;
}

/**
 * Cloud Function triggered when a new lead is created in Firestore
 * Sends an email notification to the sales team
 */
export const onNewLead = onDocumentCreated(
  {
    document: "leads/{leadId}",
    secrets: [resendApiKey],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const leadData = snapshot.data() as LeadData;
    const leadId = event.params.leadId;

    console.log(`New lead created: ${leadId}`, leadData);

    // Initialize Resend with secret
    const resend = new Resend(resendApiKey.value());

    // Format the creation date
    let createdAtString = "Non spécifié";
    if (leadData.createdAt) {
      const date = typeof leadData.createdAt === "object" && "toDate" in leadData.createdAt
        ? leadData.createdAt.toDate()
        : new Date(leadData.createdAt as unknown as string);
      createdAtString = date.toLocaleString("fr-FR", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: "Europe/Paris",
      });
    }

    // Build email subject
    const leadType = leadData.leadType || "Nouveau Contact";
    const name = leadData.fullName || "Inconnu";
    const subject = `🔔 Nouveau Lead: ${leadType} - ${name}`;

    // Build email HTML body
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0; opacity: 0.9; }
    .content { background: #f8f9fa; padding: 24px; border: 1px solid #e9ecef; }
    .field { margin-bottom: 16px; }
    .field-label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 16px; margin-top: 4px; }
    .message-box { background: white; padding: 16px; border-radius: 8px; border-left: 4px solid #1e3a5f; margin-top: 8px; }
    .cta { background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 16px; }
    .footer { padding: 16px 24px; text-align: center; color: #888; font-size: 12px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Nouveau Lead</h1>
      <p>${leadType}</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">Nom complet</div>
        <div class="field-value">${leadData.fullName || "Non spécifié"}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${leadData.email}">${leadData.email || "Non spécifié"}</a></div>
      </div>
      <div class="field">
        <div class="field-label">Téléphone</div>
        <div class="field-value">${leadData.phone || "Non spécifié"}</div>
      </div>
      ${leadData.courseName ? `
      <div class="field">
        <div class="field-label">Formation</div>
        <div class="field-value">${leadData.courseName}</div>
      </div>
      ` : ""}
      ${leadData.message ? `
      <div class="field">
        <div class="field-label">Message</div>
        <div class="message-box">${leadData.message}</div>
      </div>
      ` : ""}
      <div class="field">
        <div class="field-label">Date de réception</div>
        <div class="field-value">${createdAtString}</div>
      </div>
      <a href="${ADMIN_LEADS_URL}" class="cta">Voir dans l'Admin →</a>
    </div>
    <div class="footer">
      IMEDA International - Système de notification automatique
    </div>
  </div>
</body>
</html>
    `.trim();

    try {
      // 1. Send notification to sales team
      const { data, error } = await resend.emails.send({
        from: "IMEDA Leads <notifications@imeda.fr>",
        to: NOTIFICATION_RECIPIENTS,
        subject: subject,
        html: emailHtml,
      });

      if (error) {
        console.error("Error sending team notification email:", error);
      } else {
        console.log("Team notification email sent successfully:", data?.id);
      }

      // 2. Send confirmation email to the lead (if they provided an email)
      if (leadData.email) {
        const firstName = leadData.fullName?.split(" ")[0] || "";
        const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

        const confirmationHtml = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>Nous avons bien reçu votre demande et nous vous en remercions.</p>
  <p>Un membre de notre équipe vous contactera très prochainement.</p>
  <p style="margin-top: 24px;">Cordialement,</p>
  <p style="margin: 0;"><strong>Amel Rached</strong><br>IMEDA</p>
</div>
                `.trim();

        const { data: confirmData, error: confirmError } = await resend.emails.send({
          from: "Amel Rached - IMEDA <amel@imeda.fr>",
          to: leadData.email,
          subject: "Nous avons bien reçu votre demande",
          html: confirmationHtml,
        });

        if (confirmError) {
          console.error("Error sending confirmation email to lead:", confirmError);
        } else {
          console.log("Confirmation email sent to lead:", confirmData?.id);
        }
      }
    } catch (error) {
      console.error("Failed to send emails:", error);
    }
  }
);
