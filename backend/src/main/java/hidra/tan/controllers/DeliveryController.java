
package hidra.tan.controllers;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.ClientProduct;
import hidra.tan.entities.Delivery;
import hidra.tan.entities.DeliveryProduct;
import hidra.tan.requests.ProductAdditionRequest;
import hidra.tan.responses.DeliveryDto;
import hidra.tan.responses.DeliveryViewResponse;
import hidra.tan.services.AppClientService;
import hidra.tan.services.AppUserService;
import hidra.tan.services.DeliveryService;

/**
 * Controller for handling delivery-related endpoints.
 */
@RestController
@RequestMapping("/delivery")
public class DeliveryController {

	@Autowired
	private DeliveryService deliveryService;

	@Autowired
	private AppClientService appClientService;

	@Autowired
	private AppUserService appUserService;

	/**
	 * Endpoint to get a view of all deliveries.
	 *
	 * @return a list of delivery view responses
	 */
	@GetMapping("/view")
	public ResponseEntity<List<DeliveryViewResponse>> getDeliveryView() {
		return ResponseEntity.ok(deliveryService.toDeliveryViewResponse());
	}

	/**
	 * Endpoint to get a list of all deliveries.
	 *
	 * @return a list of deliveries
	 */
	@GetMapping("/list/client")
	public ResponseEntity<List<Delivery>> getDeliveryByClient(@RequestParam AppClient client) {
		return ResponseEntity.ok(deliveryService.findByClient(client));
	}

	/**
	 * Endpoint to get a list of all deliveries for today.
	 *
	 * @return a list of deliveries
	 */
	@GetMapping("/today")
	public ResponseEntity<List<DeliveryDto>> getDeliveryToday() {
		return ResponseEntity.ok(deliveryService.findToday());
	}

	@GetMapping("/today/{email}")
	public ResponseEntity<List<DeliveryDto>> getDeliveryTodayByDeliverer(@PathVariable String email) {
		return ResponseEntity.ok(deliveryService.findTodayByDeliverer(email));
	}
	
	/**
	 * Endpoint to get a list of all clients.
	 *
	 * @return a list of clients
	 */
	@GetMapping("/clients")
	public ResponseEntity<List<AppClient>> getClients() {
		List<AppClient> clients = appClientService.findAll();
		return ResponseEntity.ok(clients);
	}

	/**
	 * Endpoint to register a new client.
	 *
	 * @param appClient the client details
	 * @return the registered client
	 */
	@PostMapping("/clients")
	public ResponseEntity<AppClient> registerClient(@RequestBody AppClient appClient) {

		if (appClient.getClientProducts() != null) {
			for (ClientProduct clientProduct : appClient.getClientProducts()) {
				clientProduct.setClient(appClient);
			}
		}
		return ResponseEntity.ok(appClientService.save(appClient));
	}

	/**
	 * Endpoint to update an existing client.
	 *
	 * @param id               the ID of the client to update
	 * @param appClientDetails the updated client details
	 * @return the updated client
	 */
	@PutMapping("/clients/{id}")
	public ResponseEntity<AppClient> updateClient(@PathVariable Long id, @RequestBody AppClient appClientDetails) {

		return appClientService.findById(id).map(existingClient -> {
			existingClient.setName(appClientDetails.getName());
			existingClient.setDebt(appClientDetails.getDebt());
			existingClient.setAddress(appClientDetails.getAddress());
			if (existingClient.getClientProducts() == null) {
				existingClient.setClientProducts(new ArrayList<>());
			}
			existingClient.getClientProducts().clear();
			if (appClientDetails.getClientProducts() != null) {
				existingClient.getClientProducts().addAll(appClientDetails.getClientProducts());
			}
			existingClient.setFrecuency(appClientDetails.getFrecuency());
			AppClient updatedClient = appClientService.save(existingClient);
			return ResponseEntity.ok(updatedClient);
		}).orElse(ResponseEntity.notFound().build());
	}

	/**
	 * Endpoint to update an existing delivery.
	 *
	 * @param id                the ID of the delivery to update
	 * @param assignedDeliverer the name of the assigned deliverer
	 * @param client            the client details
	 * @param status            the status of the delivery
	 * @return the updated delivery
	 */
	@PutMapping("/update/{id}")
	public ResponseEntity<Delivery> updateDelivery(@PathVariable Long id, @RequestParam String assignedDeliverer,
			@RequestParam Long client, 
			@RequestParam String status, 
			@RequestParam String deliveryDate,
			@RequestBody List<ProductAdditionRequest> products) {
		return deliveryService.findById(id).map(existingDelivery -> {
			existingDelivery.setClient(appClientService.findById(client).get());
			existingDelivery.setDeliveryMan(appUserService.findByEmail(assignedDeliverer));
			existingDelivery.setStatus(status);
			existingDelivery.setDeliveryDate(existingDelivery.getDeliveryDate());
			existingDelivery.setDeliveryProducts(existingDelivery.getDeliveryProducts());
			if (existingDelivery.getDeliveryProducts() == null) {
				existingDelivery.setDeliveryProducts(new ArrayList<>());
			}
			List<DeliveryProduct> deliveryProducts = new ArrayList<>();
			for (ProductAdditionRequest product : products) {
				deliveryProducts.add(DeliveryProduct
						.builder()
						.product(product.getProduct())
						.quantity(product.getQuantity())
						.delivery(existingDelivery)
						.build());
			}
			existingDelivery.getDeliveryProducts().clear();
			existingDelivery.getDeliveryProducts().addAll(deliveryProducts);
			existingDelivery.setDeliveryDate(deliveryDate);
			Delivery updatedDelivery = deliveryService.save(existingDelivery);
			System.out.println("delivery date" + updatedDelivery.getDeliveryDate() + "delivery products"
					+ updatedDelivery.getDeliveryProducts() + "client" + updatedDelivery.getClient() + "status"
					+ updatedDelivery.getStatus() + "deliverer" + updatedDelivery.getDeliveryMan());
			return ResponseEntity.ok(updatedDelivery);
		}).orElse(ResponseEntity.notFound().build());
	}

	@PostMapping("/create")
	public ResponseEntity<DeliveryDto> createDelivery(@RequestParam Long clientId, @RequestParam String deliveryDate,
			@RequestParam String assignedDeliverer, @RequestParam String status,
			@RequestBody List<ProductAdditionRequest> products) {

		Delivery delivery = deliveryService.createDelivery(clientId, deliveryDate, assignedDeliverer, status, products);
		DeliveryDto deliveryDto = deliveryService.mapToDTO(delivery);
		return ResponseEntity.ok(deliveryDto);
	}

	/**
	 * Endpoint to complete a delivery.
	 *
	 * @param id the ID of the delivery to complete
	 * @return a success message
	 */
	@PostMapping("/completeDelivery")
	public ResponseEntity<String> completeDelivery(@RequestParam Long id, @RequestParam BigDecimal payment) {
		deliveryService.completeDelivery(id, payment);
		return ResponseEntity.ok("Delivery completed successfully");
	}

	@PostMapping("/cancelDelivery")
	public ResponseEntity<String> cancelDelivery(@RequestParam Long id) {
		deliveryService.cancelDelivery(id);
		return ResponseEntity.ok("Delivery canceled successfully");
	}

}
