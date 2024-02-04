import nodemailer from 'nodemailer';

export class EmailService {
  async sendConfirmationEmail(confirmationCode: string, email: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'azi.rosh95@gmail.com', // generated ethereal user
        pass: 'wkfuoxqawsjdgxkv', // generated ethereal password
      },
    });
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `Rosh <azi.rosh95@gmail.com>`, // sender address
      to: email, // list of receivers
      subject: 'Email Confirmation', // Subject line
      html: ` <h1>Thank for your registration</h1>
 <p>To finish registration please follow the link below:
     <a href='https://somesite.com/confirm-email?code=${confirmationCode}'>complete registration</a>
 </p>`, // html body
    });
    return info;
  }

  async sendRecoveryPasswordEmail(recoveryCode: string, email: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'azi.rosh95@gmail.com', // generated ethereal user
        pass: 'wkfuoxqawsjdgxkv', // generated ethereal password
      },
    });
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `Rosh <azi.rosh95@gmail.com>`, // sender address
      to: email, // list of receivers
      subject: 'Password recovery', // Subject line
      html: ` <h1>Password recovery</h1>
 <p>To finish password recovery please follow the link below:
     <a href='https://somesite.com/confirm-email?recoveryCode=${recoveryCode}'>complete registration</a>
 </p>`, // html body
    });
    return info;
  }
}

export class EmailServiceMock implements EmailService {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  async sendConfirmationEmail(
    confirmationCode: string,
    email: string,
  ): Promise<void> {
    console.log(confirmationCode, email);
    await Promise.resolve();
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  async sendRecoveryPasswordEmail(
    recoveryCode: string,
    email: string,
  ): Promise<void> {
    console.log(recoveryCode, email);
    await Promise.resolve();
  }
}
