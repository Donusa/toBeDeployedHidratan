package hidra.tan.services;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.AppUser;
import hidra.tan.entities.Delivery;
import hidra.tan.entities.Product;
import hidra.tan.repositories.AppClientRepository;
import hidra.tan.repositories.DeliveryRepository;
import hidra.tan.repositories.ProductRepository;
import hidra.tan.repositories.UserRepository;

@Service
public class ExportService {

    @Autowired
    private DeliveryRepository deliveryRepository;
    
    @Autowired
    private AppClientRepository appClientRepository;
    
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository appUserRepository;

    public String exportDataToCSV() throws IOException {
        String filePath = "database_export.csv";
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(filePath))) {
            // Export Deliveries
            writer.write("Deliveries\n");
            writer.write("ID,Client,Delivery Date,Status\n");
            List<Delivery> deliveries = deliveryRepository.findAll();
            for (Delivery delivery : deliveries) {
                writer.write(delivery.getId() + "," + delivery.getClient().getName() + "," +
                             delivery.getDeliveryDate() + "," + delivery.getStatus() + "\n");
            }
            
            // Export Clients
            writer.write("\nClients\n");
            writer.write("ID,Name,Address,Debt\n");
            List<AppClient> clients = appClientRepository.findAll();
            for (AppClient client : clients) {
                writer.write(client.getId() + "," + client.getName() + "," +
                             client.getAddress() + "," + client.getDebt() + "\n");
            }
            
            // Export Products
            writer.write("\nProducts\n");
            writer.write("ID,Name,Price,Stock\n");
            List<Product> products = productRepository.findAll();
            for (Product product : products) {
                writer.write(product.getId() + "," + product.getName() + "," +
                             product.getPrice() + "," + product.getStock() + "\n");
            }

            // Export Deliverers
            writer.write("\nDeliverers\n");
            writer.write("ID,Name,Email\n");
            List<AppUser> users = appUserRepository.findAll();
            for (AppUser user : users) {
                writer.write(user.getId() + "," + user.getName() + "," + user.getEmail() + "\n");
            }
        }
        return filePath;
    }
}
