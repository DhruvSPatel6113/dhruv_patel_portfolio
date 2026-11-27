import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const COOKIE_NAME = 'cms_otp_challenge';
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const TARGET_EMAIL = 'patel.dhruv6113@gmail.com';
const MASKED_EMAIL = 'p••••••••••3@gmail.com';

interface ChallengePayload {
  exp: number;
  nonce: string;
  attempts: number;
  otpHash: string;
}

function getSigningKey(masterPass: string): Buffer {
  const rawSecret = process.env.OTP_SECRET || masterPass;
  return crypto.createHash('sha256').update(rawSecret).digest();
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function hmacHex(key: Buffer, data: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

function signChallengeMetadata(key: Buffer, exp: number, nonce: string, attempts: number, otpHash: string): string {
  const sig = hmacHex(key, `${exp}:${nonce}:${attempts}:${otpHash}`);
  return `${exp}.${nonce}.${attempts}.${otpHash}.${sig}`;
}

function createChallengeToken(key: Buffer, otp: string): string {
  const exp = Date.now() + OTP_TTL_MS;
  const nonce = crypto.randomBytes(16).toString('hex');
  const otpHash = hmacHex(key, `${otp}:${nonce}:${exp}`);
  return signChallengeMetadata(key, exp, nonce, 0, otpHash);
}

function parseChallengeToken(key: Buffer, raw?: string): ChallengePayload | null {
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 5) return null;

  const [expStr, nonce, attemptsStr, otpHash, sig] = parts;
  const exp = Number(expStr);
  const attempts = Number(attemptsStr);
  if (!Number.isFinite(exp) || !Number.isInteger(attempts) || attempts < 0 || !nonce || !otpHash || !sig) {
    return null;
  }

  const expectedSig = hmacHex(key, `${exp}:${nonce}:${attempts}:${otpHash}`);
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
    return null;
  }

  return { exp, nonce, attempts, otpHash };
}

function setChallengeCookie(res: NextResponse, value: string): void {
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/cms',
    maxAge: Math.floor(OTP_TTL_MS / 1000),
  });
}

function clearChallengeCookie(res: NextResponse): void {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/cms',
    maxAge: 0,
  });
}

async function dispatchOtpEmail(otp: string): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return { ok: false, status: 503, error: 'SMTP is not configured for 2FA delivery.' };
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
      subject: `[Dhruv Patel CMS] 2FA Verification Token: ${otp}`,
      text: `Your 2-Step Verification code is: ${otp}. This code expires in 5 minutes.`,
      html: `
        <div style="font-family: monospace; background: #06070a; color: #fff; padding: 24px; border: 1px solid #00f0ff; border-radius: 12px;">
          <h2 style="color: #00f0ff; margin-top: 0;">Security Verification // 2FA Token</h2>
          <p>An administrative login request was initiated for your Studio CMS.</p>
          <div style="background: #11131a; padding: 18px; border-radius: 8px; font-size: 28px; letter-spacing: 8px; color: #00f0ff; text-align: center; font-weight: bold;">
            ${otp}
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 16px;">Valid for 5 minutes. If you did not initiate this, please ignore.</p>
        </div>
      `,
    });
    return { ok: true };
  } catch (emailErr) {
    console.error('[SMTP DISPATCH ERROR]', emailErr);
    return { ok: false, status: 502, error: 'Failed to send 2FA verification email.' };
  }
}

export async function POST(req: Request) {
  try {
    const { action, password, otp } = await req.json();

    const MASTER_PASS = process.env.CMS_PASSWORD;
    if (!MASTER_PASS) {
      return NextResponse.json({ error: 'CMS authentication is not configured.' }, { status: 500 });
    }

    const signingKey = getSigningKey(MASTER_PASS);

    if (action === 'verify_password') {
      if (typeof password !== 'string' || !timingSafeEqualStr(password, MASTER_PASS)) {
        return NextResponse.json({ error: 'Access Denied: Incorrect passcode.' }, { status: 401 });
      }

      const generatedOtp = crypto.randomInt(100000, 1000000).toString();
      const emailResult = await dispatchOtpEmail(generatedOtp);
      if (!emailResult.ok) {
        return NextResponse.json({ error: emailResult.error }, { status: emailResult.status });
      }

      const res = NextResponse.json({
        success: true,
        maskedEmail: MASKED_EMAIL,
        emailSent: true,
      });
      setChallengeCookie(res, createChallengeToken(signingKey, generatedOtp));
      return res;
    }

    if (action === 'resend_otp') {
      const cookieStore = cookies();
      const challenge = parseChallengeToken(signingKey, cookieStore.get(COOKIE_NAME)?.value);

      if (!challenge || Date.now() > challenge.exp) {
        const res = NextResponse.json(
          { error: 'Session expired. Please re-enter your passcode.' },
          { status: 401 }
        );
        clearChallengeCookie(res);
        return res;
      }

      const generatedOtp = crypto.randomInt(100000, 1000000).toString();
      const emailResult = await dispatchOtpEmail(generatedOtp);
      if (!emailResult.ok) {
        return NextResponse.json({ error: emailResult.error }, { status: emailResult.status });
      }

      const res = NextResponse.json({
        success: true,
        maskedEmail: MASKED_EMAIL,
        emailSent: true,
      });
      setChallengeCookie(res, createChallengeToken(signingKey, generatedOtp));
      return res;
    }

    if (action === 'verify_otp') {
      const cookieStore = cookies();
      const challenge = parseChallengeToken(signingKey, cookieStore.get(COOKIE_NAME)?.value);

      if (!challenge || Date.now() > challenge.exp) {
        const res = NextResponse.json(
          { error: 'Verification token has expired. Please request a new code.' },
          { status: 400 }
        );
        clearChallengeCookie(res);
        return res;
      }

      if (challenge.attempts >= MAX_ATTEMPTS) {
        const res = NextResponse.json(
          { error: 'Too many failed attempts. Please sign in again.' },
          { status: 429 }
        );
        clearChallengeCookie(res);
        return res;
      }

      const candidateOtp = typeof otp === 'string' ? otp.trim() : '';
      const candidateHash = hmacHex(signingKey, `${candidateOtp}:${challenge.nonce}:${challenge.exp}`);
      const isMatch =
        candidateHash.length === challenge.otpHash.length &&
        crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(challenge.otpHash, 'hex'));

      if (!isMatch) {
        const nextAttempts = challenge.attempts + 1;
        if (nextAttempts >= MAX_ATTEMPTS) {
          const res = NextResponse.json(
            { error: 'Too many failed attempts. Please sign in again.' },
            { status: 429 }
          );
          clearChallengeCookie(res);
          return res;
        }

        const res = NextResponse.json(
          { error: `Invalid verification token. (${MAX_ATTEMPTS - nextAttempts} attempts remaining)` },
          { status: 401 }
        );
        setChallengeCookie(
          res,
          signChallengeMetadata(signingKey, challenge.exp, challenge.nonce, nextAttempts, challenge.otpHash)
        );
        return res;
      }

      const res = NextResponse.json({ success: true, message: 'Identity confirmed.' });
      clearChallengeCookie(res);
      return res;
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server auth error.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
