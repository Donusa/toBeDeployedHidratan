package hidra.tan.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.ClientProduct;
import hidra.tan.entities.Product;
import hidra.tan.repositories.AppClientRepository;
import hidra.tan.repositories.ClientProductRepository;
import hidra.tan.repositories.ProductRepository;

@Service
public class ClientProductService {

	@Autowired
    private ClientProductRepository clientProductRepository;
    @Autowired
    private AppClientRepository appClientRepository;
    @Autowired
    private ProductRepository productRepository;
    
    public List<ClientProduct> findAll() {
        return clientProductRepository.findAll();
    }

    public Optional<ClientProduct> findById(Long id) {
        return clientProductRepository.findById(id);
    }

    public ClientProduct save(ClientProduct clientProduct) {
        return clientProductRepository.save(clientProduct);
    }

    public void deleteById(Long id) {
        clientProductRepository.deleteById(id);
    }
    
    public ClientProduct addProductToClient(Long clientId, Long productId, int quantity) {
        AppClient client = appClientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ClientProduct clientProduct = ClientProduct.builder()
                .client(client)
                .product(product)
                .quantity(quantity)
                .build();

        return clientProductRepository.save(clientProduct);
    }
    
    public void removeProductFromClient(Long clientId, Long productId) {
        ClientProduct clientProduct = clientProductRepository
                .findByClientIdAndProductId(clientId, productId)
                .orElseThrow(() -> new RuntimeException("Product not assigned to client"));

        clientProductRepository.delete(clientProduct);
    }
}
