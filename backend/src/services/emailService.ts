import nodemailer, { Transporter } from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  EMAIL_FROM,
} = process.env;

let transporter: Transporter | null = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  transporter.verify().catch((error: unknown) => {
    console.error('Falha ao validar configuração SMTP:', error);
  });
} else {
  console.warn(
    'Configuração SMTP incompleta. E-mails de verificação serão registrados no console em vez de enviados.'
  );
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) => {
  const logPrefix = '[EmailService]';

  if (!transporter) {
    console.info(`${logPrefix} SMTP não configurado. Simulando envio.`);
    console.info(`${logPrefix} Para: ${to}`);
    console.info(`${logPrefix} Assunto: ${subject}`);
    console.info(`${logPrefix} Conteúdo: ${text}`);
    return;
  }

  const from = EMAIL_FROM || SMTP_USER;
  console.log(`${logPrefix} Enviando e-mail para ${to} (assunto: ${subject}).`);

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(`${logPrefix} E-mail enviado com sucesso para ${to}.`);
  } catch (error) {
    console.error(`${logPrefix} Falha ao enviar e-mail para ${to}:`, error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, code: string) => {
  const subject = 'Código de verificação Dultive';
  const text = `Olá!\n\nSeu código de verificação Dultive é: ${code}.\nO código expira em poucos minutos. Se você não solicitou, ignore este e-mail.\n\nEquipe Dultive`;
  const html = `<p>Olá!</p><p>Seu código de verificação Dultive é: <strong>${code}</strong>.</p><p>O código expira em poucos minutos. Se você não solicitou, ignore este e-mail.</p><p>Equipe Dultive</p>`;

  await sendEmail({ to: email, subject, text, html });
};
