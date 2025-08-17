import { Hono } from 'hono';
import nodemailer from 'nodemailer';

const app = new Hono();

app.post('/', async (c) => {
  try {
    const { to, subject, html } = await c.req.json();

    if (!to || !subject || !html) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"AI Meeting Summarizer" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    return c.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (process.env.NODE_ENV !== 'production') {
      console.error('Email sending error:', err);
    }
    return c.json({ error: 'Failed to send email', details: message }, 500);
  }
});

export default app;
