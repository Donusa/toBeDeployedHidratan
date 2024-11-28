package hidra.tan.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import java.io.IOException;

@Service
public class ScheduledTaskService {

    @Autowired
    private ExportService exportService;

    @Autowired
    private EmailService emailService;

    @Scheduled(cron = "0 0 0 ? * MON")
    public void exportAndSendEmail() {
        try {
            String filePath = exportService.exportDataToCSV();
            emailService.sendEmailWithAttachment("facunsua@hotmail.com", "Database Export", "Please find attached the database export.", filePath);
        } catch (IOException | MessagingException e) {
            e.printStackTrace();
        }
    }
}
