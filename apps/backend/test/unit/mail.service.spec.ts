/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { MailService } from '../../../src/infrastructure/notifications/mail.service';

describe('MailService (unit)', () => {
  it('should call mailerService.sendMail when sendProfileCreated is called', async () => {
    const sendMailMock = jest.fn().mockResolvedValue({});
    const mockMailer: any = { sendMail: sendMailMock };

    const service = new MailService(mockMailer);

    await service.sendProfileCreated('test@example.com', {
      customer_name: 'Test User',
      activation_link: 'https://example.test/activate',
      support_email: 'soporte@example.test',
      year: 2025,
      temporary_password: 'abcd1234',
    });

    expect(sendMailMock).toHaveBeenCalled();
    const calledWith = sendMailMock.mock.calls[0][0];
    expect(calledWith.to).toBe('test@example.com');
    expect(calledWith.template).toBe('profile-created');
  });

  it('sendSMS should not throw when Twilio not configured (fallback to log)', async () => {
    const sendMailMock = jest.fn().mockResolvedValue({});
    const mockMailer: any = { sendMail: sendMailMock };
    const service = new MailService(mockMailer);

    await expect(
      service.sendSMS('+1234567890', 'Mensaje de prueba'),
    ).resolves.not.toThrow();
  });
});
