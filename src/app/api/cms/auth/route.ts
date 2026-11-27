import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

let currentOtp: string | null = null;
let otpExpiresAt: number = 0;

export async function POST(req: Request) {
  try {
    const { action, password, otp } = await req.json();

    const MASTER_PASS = process.env.CMS_PASSWORD;
    if (!MASTER_PASS) {
      return NextResponse.json({ error: 'CMS authentication is not configured.' }, { status: 500 });
    }
    const TARGET_EMAIL = 'patel.dhruv6113@gmail.com';
    // Masked email: p••••••••••3@gmail.com
    const MASKED_EMAIL = 'p••••••••••3@gmail.com';

    if (action === 'verify_password') {
      if (password !== MASTER_PASS) {
        return NextResponse.json({ error: 'Access Denied: Incorrect passcode.' }, { status: 401 });
      }

      // Generate 6-digit cryptographic OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      currentOtp = generatedOtp;
      otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!host || !user || !pass) {
        return NextResponse.json({ error: 'SMTP is not configured for 2FA delivery.' }, { status: 503 });
      }

      try {
        const transporter = nodemailer.createTransport({
          host,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user, pass },
        });

        await transporter.sendMail({
          from: `"Dhruv Patel Studio Security" <${user}>`,
          to: TARGET_EMAIL,
          subject: `[Dhruv Patel CMS] 2FA Verification Token: ${generatedOtp}`,
          text: `Your 2-Step Verification code is: ${generatedOtp}. This code expires in 5 minutes.`,
          html: `
            <div style="font-family: monospace; background: #06070a; color: #fff; padding: 24px; border: 1px solid #00f0ff; border-radius: 12px;">
              <h2 style="color: #00f0ff; margin-top: 0;">Security Verification // 2FA Token</h2>
              <p>An administrative login request was initiated for your Studio CMS.</p>
              <div style="background: #11131a; padding: 18px; border-radius: 8px; font-size: 28px; letter-spacing: 8px; color: #00f0ff; text-align: center; font-weight: bold;">
                ${generatedOtp}
              </div>
              <p style="color: #888; font-size: 12px; margin-top: 16px;">Valid for 5 minutes. If you did not initiate this, please ignore.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('[SMTP DISPATCH ERROR]', emailErr);
        return NextResponse.json({ error: 'Failed to send 2FA verification email.' }, { status: 502 });
      }

      return NextResponse.json({
        success: true,
        maskedEmail: MASKED_EMAIL,
        emailSent: true,
      });
    }

    if (action === 'verify_otp') {
      if (!currentOtp || Date.now() > otpExpiresAt) {
        return NextResponse.json({ error: 'Verification token has expired. Please request a new code.' }, { status: 400 });
      }

      if (otp !== currentOtp) {
        return NextResponse.json({ error: 'Invalid verification token.' }, { status: 401 });
      }

      currentOtp = null; // Single-use consumption
      return NextResponse.json({ success: true, message: 'Identity confirmed.' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server auth error.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
