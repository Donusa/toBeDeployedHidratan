package hidra.tan.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.Product;
import hidra.tan.logging.Log4jImpl;
import hidra.tan.repositories.ProductRepository;

@Service
public class ProductService {

	@Autowired
    private ProductRepository productRepository;
	@Autowired
	private Log4jImpl logger;

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Product findById(Long id) {
		return productRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public Product save(Product product) {
        return productRepository.save(product);
    }

    public void deleteById(Long id) {
        productRepository.deleteById(id);
    }

	public Product update(Product product) {
		Optional<Product> existingProductOpt = productRepository.findById(product.getId());
		logger.logInfo("ProductService.update");
        if (existingProductOpt.isPresent()) {
            Product existingProduct = existingProductOpt.get();
            existingProduct.setName(product.getName());
            existingProduct.setPrice(product.getPrice());
            existingProduct.setStock(product.getStock());
            logger.logInfo("Product updated: " + existingProduct.toString());
            return productRepository.save(existingProduct);
        } else {
        	logger.logError("Product not found with id: " + product.getId());
            throw new RuntimeException("Product not found with id: " + product.getId());
        }
	}
}
