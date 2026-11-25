import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing mandatory fields.' }, { status: 400 });
    }

    console.log(`[TRANSMISSION LOG] From: ${name} (${email}) | Subject: ${subject || 'No Subject'}`);
    console.log(`[PAYLOAD]: ${message}`);

    // If SMTP credentials exist in environment variables, dispatch email
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      const transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from: `"Portfolio Uplink" <${user}>`,
        to: 'patel.dhruv6113@gmail.com',
        replyTo: email,
        subject: `[Portfolio Transmission] ${subject || 'New Contact'} from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: monospace; background: #06070a; color: #f3f4f6; padding: 24px; border-radius: 12px; border: 1px solid #00f0ff;">
            <h2 style="color: #00f0ff; margin-top: 0;">⚡ New Portfolio Transmission Received</h2>
            <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <hr style="border: 0; border-top: 1px solid #1f2438; margin: 16px 0;" />
            <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${message}</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Transmission successfully delivered to Dhruv Patel.',
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Transmission delivery failure.';
    console.error('[TRANSMISSION ERROR]', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
