
package hidra.tan.controllers;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import hidra.tan.entities.ClientProduct;
import hidra.tan.entities.Product;
import hidra.tan.logging.Log4jImpl;
import hidra.tan.requests.NewProductRequest;
import hidra.tan.services.ClientProductService;
import hidra.tan.services.ProductService;

/**
 * Controller for handling product-related endpoints.
 */
@RestController
@RequestMapping("/products")
public class ProductController {

	@Autowired
	private Log4jImpl logger;

	@Autowired
	private ProductService productService;

	@Autowired
	private ClientProductService clientProductService;

	/**
	 * Endpoint to list all products.
	 *
	 * @return a list of products
	 */
	@GetMapping("/list")
	public ResponseEntity<List<Product>> list() {
		logger.logInfo("ProductController.list");
		return ResponseEntity.ok(productService.findAll());
	}

	/**
	 * Endpoint to save a new product.
	 *
	 * @param name  the name of the product
	 * @param price the price of the product
	 * @param stock the stock quantity of the product
	 * @return the saved product
	 */
	@PostMapping("/save")
	public ResponseEntity<Product> save(@RequestParam String name, @RequestParam BigDecimal price,
			@RequestParam int stock) {
		logger.logInfo("ProductController.save");
		return ResponseEntity.ok(productService.save(Product.builder().name(name).price(price).stock(stock).build()));
	}

	/**
	 * Endpoint to add a product to a client.
	 * 
	 * @param clientId
	 * @param productId
	 * @param quantity
	 * @return
	 */
	@PostMapping("/toClient")
	public ResponseEntity<ClientProduct> addProductToClient(
			@RequestBody NewProductRequest newProductRequest) {
		logger.logInfo("ProductController.addProductToClient");
		return ResponseEntity.ok(
				clientProductService.addProductToClient(
						newProductRequest.getClientId(),
						newProductRequest.getProductId(),
						newProductRequest.getQuantity()
						)
				);
	}

	/**
	 * Endpoint to update an existing product.
	 *
	 * @param id    the ID of the product to update
	 * @param name  the updated name of the product
	 * @param price the updated price of the product
	 * @param stock the updated stock quantity of the product
	 * @return the updated product
	 */
	@PutMapping("/update")
	public ResponseEntity<Product> update(@RequestParam Long id, @RequestParam String name,
			@RequestParam BigDecimal price, @RequestParam int stock) {
		logger.logInfo("ProductController.update");
		Product updatedProduct = productService
				.update(Product.builder().id(id).name(name).price(price).stock(stock).build());
		return ResponseEntity.ok(updatedProduct);
	}

	/**
	 * Endpoint to get a product by ID.
	 *
	 * @param id the ID of the product
	 * @return the product
	 */
	@GetMapping("/{id}")
	public ResponseEntity<Product> getProduct(@PathVariable Long id) {
		logger.logInfo("ProductController.getProduct");
		Product product = productService.findById(id);
		return ResponseEntity.ok(product);
	}

	/**
	 * Endpoint to delete a product by ID.
	 *
	 * @param id the ID of the product to delete
	 * @return a response entity with no content
	 */
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
		logger.logInfo("ProductController.deleteProduct");
		productService.deleteById(id);
		return ResponseEntity.noContent().build();
	}
}
