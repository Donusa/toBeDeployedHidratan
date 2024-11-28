package hidra.tan.services;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.AppUser;
import hidra.tan.entities.ClientProduct;
import hidra.tan.entities.Delivery;
import hidra.tan.entities.DeliveryProduct;
import hidra.tan.entities.Product;
import hidra.tan.repositories.DeliveryRepository;
import hidra.tan.requests.ProductAdditionRequest;
import hidra.tan.responses.DeliveryDto;
import hidra.tan.responses.DeliveryProductDto;
import hidra.tan.responses.DeliveryViewResponse;
import jakarta.transaction.Transactional;

@Service
@Transactional
public class DeliveryService {

	@Autowired
	private DeliveryRepository deliveryRepository;
	@Autowired
	private AppUserService appUserService;
	@Autowired
	private AppClientService clientService;
	@Autowired
	private ProductService productService;
	
	@Transactional
	public List<Delivery> findAll() {
		List<Delivery> deliveries = deliveryRepository.findAll();
		return deliveries;
	}

	public Delivery save(Delivery delivery) {
		return deliveryRepository.save(delivery);
	}

	public Optional<Delivery> findById(Long id) {
		return deliveryRepository.findById(id);
	}

	public List<Delivery> findByClient(AppClient client) {
		return deliveryRepository.findAll().stream().filter(delivery -> delivery.getClient().equals(client))
				.collect(Collectors.toList());
	}

	public Delivery createDelivery(Long clientId, String deliveryDate, String assignedDeliverer, String status,
			List<ProductAdditionRequest> products) {

		AppUser deliveryMan = appUserService.findByEmail(assignedDeliverer);
		AppClient client = clientService.findById(clientId).get();

		final Delivery delivery = Delivery.builder().client(client).deliveryDate(deliveryDate).deliveryMan(deliveryMan)
				.status(status).build();

		List<DeliveryProduct> deliveryProducts = products.stream().map(product -> DeliveryProduct.builder()
				.delivery(delivery).product(product.getProduct()).quantity(product.getQuantity()).build())
				.collect(Collectors.toList());

		List<ClientProduct> productsInClient = products.stream().map(product -> ClientProduct.builder().client(client)
				.product(product.getProduct()).quantity(product.getQuantity()).build()).collect(Collectors.toList());
		if (delivery.getDeliveryProducts() == null) {
			delivery.setDeliveryProducts(new ArrayList<>());
		}
		delivery.getDeliveryProducts().clear();
		delivery.getDeliveryProducts().addAll(deliveryProducts);

		if (client.getClientProducts() == null) {
			client.setClientProducts(new ArrayList<>());
		}
		client.getClientProducts().clear();
		client.getClientProducts().addAll(productsInClient);
		clientService.save(client);

		discountStock(products);
		
		return save(delivery);
	}

	private void discountStock(List<ProductAdditionRequest> products) {
		for (ProductAdditionRequest product : products) {
			Product p = productService.findById(product.getProduct().getId());
			int quantity = product.getQuantity();
			p.setStock(p.getStock() - quantity);
			productService.save(p);
		}
	}

	@Transactional
	public DeliveryDto mapToDTO(Delivery delivery) {
		Hibernate.initialize(delivery.getClient().getClientProducts());
		return DeliveryDto.builder().id(delivery.getId()).clientName(delivery.getClient().getName())
				.deliveryDate(delivery.getDeliveryDate()).deliveryManEmail(delivery.getDeliveryMan().getEmail())
				.status(delivery.getStatus())
				.deliveryProducts(delivery
						.getDeliveryProducts().stream().map(dp -> DeliveryProductDto.builder()
								.productName(dp.getProduct().getName()).quantity(dp.getQuantity()).build())
						.collect(Collectors.toList()))
				.address(delivery.getClient().getAddress())
				.build();
	}

	public List<DeliveryViewResponse> toDeliveryViewResponse() {
		return deliveryRepository.findAll().stream()
				.map(delivery -> DeliveryViewResponse.builder().client(delivery.getClient())
						.delivererName(delivery.getDeliveryMan().getName()).status(delivery.getStatus())
						.deliveryDate(delivery.getDeliveryDate()).deliverId(delivery.getId())
						.delivererEmail(delivery.getDeliveryMan().getEmail())
						.build())
				.toList();
	}

	public List<DeliveryDto> findToday() {
		String today = getTodayAsString().split("T")[0];
		List<DeliveryDto> deliveries = deliveryRepository.findAll().stream()
			.filter(delivery -> {
				String deliveryDate = delivery.getDeliveryDate().split("T")[0];
				return deliveryDate.equals(today);
			})
			.map(this::mapToDTO)
			.collect(Collectors.toList());
		return deliveries;
	}

	private String getTodayAsString() {
		Date date = new Date();
		SimpleDateFormat formatter = new SimpleDateFormat("dd/MM/yyyy'T'HH:mm");
		return formatter.format(date);
	}

	public void completeDelivery(Long id, BigDecimal payment) {
		Delivery delivery = deliveryRepository.findById(id).get();
		delivery.setStatus("COMPLETED");
		AppClient client = delivery.getClient();
		BigDecimal newDebt = client.getDebt().subtract(payment);
		client.setDebt(newDebt);
		clientService.save(client);
		save(delivery);
	}

	public void cancelDelivery(Long id) {
		Delivery delivery = deliveryRepository.findById(id).get();
		delivery.setStatus("CANCELED");
		List<DeliveryProduct> products = delivery.getDeliveryProducts();
		for (DeliveryProduct product : products) {
			Product p = product.getProduct();
			p.setStock(p.getStock() + product.getQuantity());
			productService.save(p);
		}
		save(delivery);
	}

	public List<DeliveryDto> findTodayByDeliverer(String email) {
		String today = getTodayAsString().split("T")[0];
		return deliveryRepository.findAll().stream()
			.filter(delivery -> {
				String deliveryDate = delivery.getDeliveryDate().split("T")[0];
				return deliveryDate.equals(today) && 
					   delivery.getDeliveryMan().getEmail().equals(email);
			})
			.map(this::mapToDTO)
			.collect(Collectors.toList());
	}

}
