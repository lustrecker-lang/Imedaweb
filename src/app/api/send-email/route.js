import * as Brevo from '@getbrevo/brevo';

const api = new Brevo.TransactionalEmailsApi();

api.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

export async function POST(req) {
  const { fullName, email, phone, message, courseName, positionAppliedFor, cvUrl } = await req.json();

  const toEmail = process.env.BREVO_TO_EMAIL;
  if (!toEmail) {
    console.error("BREVO_TO_EMAIL environment variable is not set.");
    return new Response(JSON.stringify({ error: "Server configuration error." }), { status: 500 });
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL;
  if (!fromEmail) {
    console.error("BREVO_FROM_EMAIL environment variable is not set.");
    return new Response(JSON.stringify({ error: "Server configuration error." }), { status: 500 });
  }

  let emailBody = `
    You have a new lead from your website:
    
    Name: ${fullName}
    Email: ${email}
    Phone: ${phone || 'Not provided'}
  `;

  if (courseName) {
    emailBody += `\nCourse Inquiry: ${courseName}`;
  }
  if (positionAppliedFor) {
    emailBody += `\nPosition Applied For: ${positionAppliedFor}`;
  }
  if (cvUrl) {
    emailBody += `\nCV Link: ${cvUrl}`;
  }

  emailBody += `\n\nMessage:\n${message || 'No message provided.'}`;

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.to = [{ email: toEmail }];
  sendSmtpEmail.sender = { email: fromEmail, name: fullName };
  sendSmtpEmail.replyTo = { email: email, name: fullName };
  sendSmtpEmail.subject = `New Website Lead: ${fullName}`;
  sendSmtpEmail.textContent = emailBody;

  try {
    const data = await api.sendTransacEmail(sendSmtpEmail);
    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (error) {
    console.error("Brevo API error:", error);
    return new Response(JSON.stringify({ error: 'Failed to send email.' }), { status: 500 });
  }
}
