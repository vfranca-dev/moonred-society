// config/mailer.js (VERSÃO ATUALIZADA)
const nodemailer = require('nodemailer');

let transporterOptions = {};

// Verifica se um serviço conhecido (Gmail, Hotmail) está especificado
if (process.env.EMAIL_SERVICE && ['gmail', 'hotmail', 'outlook365'].includes(process.env.EMAIL_SERVICE.toLowerCase())) {
    console.log(`[Mailer Config] Usando configuração de serviço: ${process.env.EMAIL_SERVICE}`);
    transporterOptions = {
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Para Gmail/Outlook, use Senha de App se 2FA estiver ativa
        },
    };
} else {
    // Usa configuração SMTP genérica se nenhum serviço for especificado
    console.log('[Mailer Config] Usando configuração SMTP genérica.');
    transporterOptions = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true', // true para porta 465 (SSL), false para outras (STARTTLS)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // Adiciona opções de TLS se não for seguro (para STARTTLS)
        // Pode ser necessário ajustar dependendo do provedor
        tls: {
            // Não falhar em certificados inválidos (use com cuidado)
            // rejectUnauthorized: false
            // Pode ser necessário especificar ciphers para alguns provedores
             // ciphers:'SSLv3'
        }
    };
    // Validação básica para configuração genérica
    if (!transporterOptions.host || !transporterOptions.auth.user || !transporterOptions.auth.pass) {
         console.error('[Mailer Config] Faltando configurações SMTP genéricas (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) no .env');
         // Poderia lançar um erro aqui para impedir a inicialização se preferir
    }
}

let transporter;
try {
    transporter = nodemailer.createTransport(transporterOptions);

    // Verifica a conexão
    transporter.verify((error, success) => {
        if (error) {
            console.error('[Mailer Config] Erro ao verificar conexão do transporter:', error);
             if (process.env.EMAIL_SERVICE === 'gmail') {
                 console.warn('[Mailer Config] Para Gmail, certifique-se de usar uma "Senha de App" se a Verificação em 2 Etapas estiver ativa.');
             } else if (['hotmail', 'outlook365'].includes(process.env.EMAIL_SERVICE?.toLowerCase())) {
                  console.warn('[Mailer Config] Para Outlook/Hotmail, pode ser necessário habilitar SMTP AUTH ou usar uma Senha de App.');
             } else {
                  console.warn('[Mailer Config] Verifique as credenciais SMTP e configurações de segurança do seu provedor de e-mail.');
             }
        } else {
            console.log('[Mailer Config] Servidor de e-mail pronto para enviar mensagens.');
        }
    });

} catch (configError) {
     console.error('[Mailer Config] Falha ao criar transporter nodemailer. Verifique a configuração em .env:', configError);
     // Impede que a aplicação continue sem um transporter funcional (opcional)
     // throw new Error("Falha na configuração do Mailer.");
     // Ou cria um transporter dummy para evitar crashes, mas emails não funcionarão:
     transporter = { sendMail: async () => { console.error("Mailer não configurado corretamente, e-mail não enviado."); return { messageId: 'mailer-not-configured' }; } };
}


// Função para enviar e-mail de reset (sem alterações na lógica interna)
const sendPasswordResetEmail = async (toEmail, token) => {
    if (!process.env.BASE_URL || !process.env.EMAIL_FROM || !toEmail || !token) {
        console.error('[Mailer] Faltando informações essenciais para enviar e-mail (BASE_URL, EMAIL_FROM, toEmail, token).');
        return false;
    }
    // Verifica se o transporter foi criado corretamente
    if (!transporter || typeof transporter.sendMail !== 'function') {
         console.error('[Mailer] Transporter não inicializado corretamente.');
         return false;
    }

    const resetUrl = `${process.env.BASE_URL}/auth/reset/${token}`;
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: toEmail,
        subject: 'Password Reset Request - Moonred Society',
        text: `You requested a password reset for your Moonred Society account.\n\nPlease click on the following link, or paste it into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`,
        html: `<p>You requested a password reset for your Moonred Society account.</p><p>Please click on the following link to complete the process:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire in <strong>1 hour</strong>.</p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('[Mailer] E-mail de reset enviado para', toEmail, 'Info Message ID:', info.messageId);
        return true; // Indica sucesso
    } catch (error) {
        console.error('[Mailer] Erro ao enviar e-mail de reset para', toEmail, ':', error);
        return false; // Indica falha
    }
};

module.exports = { sendPasswordResetEmail };