package hidra.tan.utils;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import hidra.tan.logging.Log4jImpl;
import hidra.tan.responses.MailDailyResponse;
import hidra.tan.responses.ProductMailResponse;

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
            message.setSubject("Solicitud de reinicio de contraseña");
            message.setText("Para resetear su contraseña use el siguiente token: " + resetToken +
                          "\n\nEste token expirará en 15 minutos.");

            mailSender.send(message);
            logger.logInfo("Password reset email sent successfully to: " + toEmail);
        } catch (Exception e) {
            logger.logError("Error sending password reset email to: " + toEmail, e);
            throw new RuntimeException("Error sending password reset email", e);
        }
    }

        public void sendTotalHistory(List<MailDailyResponse> list){
        try{
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(FROM_EMAIL);
            message.setTo("lucadonofrio097@gmail.com");
            message.setSubject("Historial de Ventas Diarias");
             StringBuilder messageText = new StringBuilder();
             messageText.append("Historial de Ventas Diarias\n\n").append(LocalDate.now()).append("\n\n");

             for(MailDailyResponse history : list){
                 messageText.append("Repartidor: ").append(history.getEmail()).append("\n");
                    messageText.append("Fecha: ").append(history.getDate()).append("\n");
                    messageText.append("Total: ").append(history.getTotal()).append("\n");
                    if(history.getProducts() != null){
                        messageText.append("Productos: ").append("\n");
                        for(ProductMailResponse product : history.getProducts()){
                            messageText.append(product.getName()).append(": "+product.getQuantity()).append("\n");
                        }
                    }
                    if (history.getEmptyProducts() != null){
                        messageText.append("Productos Vacios: ").append("\n\n");
                        for(ProductMailResponse product : history.getProducts()){
                            messageText.append(product.getName()).append(": "+product.getQuantity()).append("\n");
                        }
                    }
             }
                message.setText(messageText.toString());

            mailSender.send(message);
            logger.logInfo("Total history email sent successfully");
        } catch (Exception e) {
            logger.logError("Error sending total history email", e);
            throw new RuntimeException("Error sending total history email", e);
        }
    }
} 