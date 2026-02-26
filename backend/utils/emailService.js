const nodemailer = require('nodemailer');

// Create Gmail SMTP transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send an OTP verification email
 * @param {string} toEmail - recipient email
 * @param {string} otp      - the 6-digit code
 */
const sendOtpEmail = async (toEmail, otp) => {
    const mailOptions = {
        from: `"OurStuff" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `${otp} is your OurStuff verification code`,
        html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#2563EB,#1D4ED8);padding:32px 40px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">OurStuff</h1>
                      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Rent &amp; Share. Anything.</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:36px 40px;">
                      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1E293B;">Verify your email address</h2>
                      <p style="margin:0 0 28px;font-size:14px;color:#64748B;line-height:1.6;">
                        Use the code below to verify your email for OurStuff. This code expires in <strong>10 minutes</strong>.
                      </p>

                      <!-- OTP Box -->
                      <div style="background:#EFF6FF;border:2px dashed #BFDBFE;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                        <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#2563EB;letter-spacing:1px;text-transform:uppercase;">Your verification code</p>
                        <p style="margin:0;font-size:42px;font-weight:800;color:#1E293B;letter-spacing:10px;">${otp}</p>
                      </div>

                      <p style="margin:0 0 8px;font-size:13px;color:#64748B;line-height:1.6;">
                        If you didn't request this code, you can safely ignore this email. Someone may have typed your email by mistake.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#94A3B8;">
                        &copy; ${new Date().getFullYear()} OurStuff &mdash; Peer-to-peer rental platform
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
