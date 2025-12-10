import { NextResponse } from 'next/server';

export async function POST(req) {
  const { fullName, email, phone, message, courseName, positionAppliedFor, cvUrl } = await req.json();

  const toEmail = process.env.BREVO_TO_EMAIL;
  if (!toEmail) {
    console.error("BREVO_TO_EMAIL environment variable is not set.");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL;
  if (!fromEmail) {
    console.error("BREVO_FROM_EMAIL environment variable is not set.");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }
  
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("BREVO_API_KEY environment variable is not set.");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  let emailContent = `Vous avez reçu un nouveau message depuis votre site web :\n\n`;
  emailContent += `Nom: ${fullName}\n`;
  emailContent += `Email: ${email}\n`;
  emailContent += `Téléphone: ${phone || 'Non fourni'}\n`;

  let subject = `Nouveau message de contact de ${fullName}`;

  if (courseName) {
    subject = `Nouvelle demande de renseignements sur le cours : ${courseName}`;
    emailContent += `Cours concerné: ${courseName}\n`;
  }
  if (positionAppliedFor) {
    subject = `Nouvelle candidature pour le poste : ${positionAppliedFor}`;
    emailContent += `Poste concerné: ${positionAppliedFor}\n`;
  }
   if (cvUrl) {
    emailContent += `CV : ${cvUrl}\n`;
  }
  if (message) {
    emailContent += `\nMessage:\n${message}`;
  }


  const emailData = {
    sender: {
      name: fullName,
      email: fromEmail,
    },
    to: [
      {
        email: toEmail,
        name: "IMEDA",
      },
    ],
    replyTo: {
        email: email,
        name: fullName
    },
    subject: subject,
    textContent: emailContent,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Brevo API error response:", errorData);
        throw new Error(`Brevo API responded with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error) {
    console.error("Failed to send email via Brevo API:", error);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }
}
