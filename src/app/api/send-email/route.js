
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(req) {
  const { fullName, email, phone, message } = await req.json();

  const toEmail = process.env.SENDGRID_TO_EMAIL;
  if (!toEmail) {
    console.error("SENDGRID_TO_EMAIL environment variable is not set.");
    return new Response(JSON.stringify({ error: "Server configuration error." }), { status: 500 });
  }

  const emailBody = `
    You have a new lead from your website contact form:
    
    Name: ${fullName}
    Email: ${email}
    Phone: ${phone || 'Not provided'}
    
    Message:
    ${message}
  `;

  try {
    await sgMail.send({
      to: toEmail,
      from: process.env.SENDGRID_FROM_EMAIL, // This should be a verified sender in your SendGrid account
      replyTo: email, // This allows you to directly reply to the user's email
      subject: `New Contact Form Lead: ${fullName}`,
      text: emailBody,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("SendGrid error:", error);
    if (error.response) {
      console.error(error.response.body)
    }
    return new Response(
      JSON.stringify({ error: "Failed to send email" }),
      { status: 500 }
    );
  }
}
