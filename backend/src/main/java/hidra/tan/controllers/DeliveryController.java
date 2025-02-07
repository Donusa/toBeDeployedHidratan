package hidra.tan.controllers;

import java.math.BigDecimal;
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
import hidra.tan.entities.Delivery;
import hidra.tan.responses.DeliveryDto;
import hidra.tan.responses.DeliveryViewResponse;
import hidra.tan.services.AppClientService;
import hidra.tan.services.AppUserService;
import hidra.tan.services.DeliveryService;
import hidra.tan.responses.DeliveryReportDTO;

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
			existingClient.setDebt(appClientDetails.getDebt());
			existingClient.setAddress(appClientDetails.getAddress());
			existingClient.setFrecuency(appClientDetails.getFrecuency());
			existingClient.setPhoneNumber(appClientDetails.getPhoneNumber());
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
	 * @return the updated delivery
	 */
	@PutMapping("/update/{id}")
	public ResponseEntity<Delivery> updateDelivery(@PathVariable Long id, @RequestParam String assignedDeliverer,
												   @RequestParam Long client,
												   @RequestParam String deliveryDate) {
		return deliveryService.findById(id).map(existingDelivery -> {
			existingDelivery.setClient(appClientService.findById(client).orElseThrow(() -> new IllegalArgumentException("Client not found")));
			existingDelivery.setDeliveryMan(appUserService.findByEmail(assignedDeliverer));
			existingDelivery.setDeliveryDate(deliveryDate);
			Delivery updatedDelivery = deliveryService.save(existingDelivery);
			return ResponseEntity.ok(updatedDelivery);
		}).orElse(ResponseEntity.notFound().build());
	}

	@PostMapping("/create")
	public ResponseEntity<DeliveryDto> createDelivery(@RequestParam Long clientId, @RequestParam String deliveryDate,
													  @RequestParam String assignedDeliverer, @RequestParam String status
	) {

		Delivery delivery = deliveryService.createDelivery(clientId, deliveryDate, assignedDeliverer, status);
		DeliveryDto deliveryDto = deliveryService.mapToDTO(delivery);
		return ResponseEntity.ok(deliveryDto);
	}


	@PostMapping("/transferProduct")
	public ResponseEntity<String> transferProductToClient(@RequestParam String deliveryManEmail, @RequestParam Long clientId, @RequestParam Long productId, @RequestParam int quantity) {
		deliveryService.transferProductToClient(deliveryManEmail, clientId, productId, quantity);
		return ResponseEntity.ok("Product transfered successfully");
	}

	@PostMapping("/returnProduct")
	public ResponseEntity<String> returnProduct(@RequestParam Long clientId, @RequestParam String deliveryManEmail, @RequestParam Long productId, @RequestParam int quantity) {
		deliveryService.returnProductToDeliveryMan(clientId, deliveryManEmail, productId, quantity);
		return ResponseEntity.ok("Product returned successfully and added to empty products list");
	}

	@PutMapping("/{id}/complete")
	public ResponseEntity<Delivery> completeDelivery(@PathVariable Long id) {
		Delivery updatedDelivery = deliveryService.completeDelivery(id);
		return ResponseEntity.ok(updatedDelivery);
	}

	/**
	 * Endpoint to cancel a delivery.
	 *
	 * @param id the ID of the delivery to cancel
	 * @return a response indicating the cancellation status
	 */
	@PutMapping("/cancel/{id}")
	public ResponseEntity<Delivery> cancelDelivery(@PathVariable Long id) {
		return deliveryService.findById(id).map(existingDelivery -> {
			existingDelivery.setStatus("CANCELLED");
			Delivery updatedDelivery = deliveryService.save(existingDelivery);
			return ResponseEntity.ok(updatedDelivery);
		}).orElse(ResponseEntity.notFound().build());
	}


	@PostMapping("/pay")
	public ResponseEntity<String> payDebt(@RequestParam Long clientId, @RequestParam BigDecimal newDebt) {
		deliveryService.payDebt(clientId, newDebt);
		return ResponseEntity.ok("Payment processed successfully");
	}

	@GetMapping("/report/{delivererEmail}")
	public ResponseEntity<List<DeliveryReportDTO>> getDeliveriesTodayReport(@PathVariable String delivererEmail) {
		try {
			List<DeliveryReportDTO> deliveries = deliveryService.getDeliveriesTodayForReport(delivererEmail);
			return ResponseEntity.ok(deliveries);
		} catch (Exception e) {
			return ResponseEntity.internalServerError().build();
		}
	}
}


