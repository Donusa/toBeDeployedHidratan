package hidra.tan.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import hidra.tan.logging.Log4jImpl;

@Component
public class MailUtils {

    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private Log4jImpl logger = Log4jImpl.getInstance();

    private static final String FROM_EMAIL = "your-email@gmail.com";

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(FROM_EMAIL);
            message.setTo(toEmail);
            message.setSubject("Password Reset Request");
            message.setText("To reset your password, please use this temporary token: " + resetToken + 
                          "\n\nThis token will expire in 15 minutes.");

            mailSender.send(message);
            logger.logInfo("Password reset email sent successfully to: " + toEmail);
        } catch (Exception e) {
            logger.logError("Error sending password reset email to: " + toEmail, e);
            throw new RuntimeException("Error sending password reset email", e);
        }
    }
} 