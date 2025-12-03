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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppClient;
import hidra.tan.entities.AppUser;
import hidra.tan.entities.ClientStock;
import hidra.tan.entities.Delivery;
import hidra.tan.entities.DeliveryManStock;
import hidra.tan.entities.EmptyProduct;
import hidra.tan.enums.ClientTransactionType;
import hidra.tan.logging.Log4jImpl;
import hidra.tan.repositories.ClientStockRepository;
import hidra.tan.repositories.DeliveryManStockRepository;
import hidra.tan.repositories.DeliveryRepository;
import hidra.tan.repositories.UserRepository;
import hidra.tan.responses.DeliveryDto;
import hidra.tan.responses.DeliveryViewResponse;
import hidra.tan.responses.DeliveryReportDTO;
import hidra.tan.responses.MailDailyResponse;
import hidra.tan.responses.ProductMailResponse;
import hidra.tan.utils.MailUtils;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
public class DeliveryService {

	@Autowired
	private MailUtils mailUtils;
	@Autowired
	private DeliveryRepository deliveryRepository;
	@Autowired
	private AppUserService appUserService;
	@Autowired
	private AppClientService clientService;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private DeliveryManStockRepository deliveryManStockRepository;
	@Autowired
    private ClientStockRepository clientStockRepository;
	@Autowired
	private AppClientService appClientService;
	@Autowired
    private Log4jImpl logger;
    @Autowired
    private ClientTransactionService clientTransactionService;
	
	
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

	public Delivery createDelivery(Long clientId, String deliveryDate, String assignedDeliverer, String status) {

		AppUser deliveryMan = appUserService.findByEmail(assignedDeliverer);
		AppClient client = clientService.findById(clientId).get();

		final Delivery delivery = Delivery.builder().client(client).deliveryDate(deliveryDate).deliveryMan(deliveryMan)
				.status(status).build();

		clientService.save(client);
		return save(delivery);
	}


	@Transactional
	public DeliveryDto mapToDTO(Delivery delivery) {
		Hibernate.initialize(delivery.getClient());
		return DeliveryDto.builder().id(delivery.getId())
				.deliveryDate(delivery.getDeliveryDate()).deliveryManEmail(delivery.getDeliveryMan().getEmail())
				.status(delivery.getStatus())
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

	@Transactional
    public void transferProductToClient(String deliveryManEmail, Long clientId, Long productId, int quantity) {
		AppUser deliveryMan = appUserService.findByEmail(deliveryManEmail);
		DeliveryManStock deliveryManStock = deliveryMan.getDeliveryManStock().stream()
				.filter(stock -> stock.getProduct().getId().equals(productId))
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Product not found in deliveryMan stock"));

		AppClient client = appClientService.findById(clientId).orElseThrow(() -> new IllegalArgumentException("Client not found"));

        Optional<ClientStock> clientStockOpt = client.getClientStock().stream()
                .filter(stock -> stock.getProduct().getId().equals(productId))
                .findFirst();

		if (deliveryManStock.getQuantity() >= quantity) {
			deliveryManStock.setQuantity(deliveryManStock.getQuantity() - quantity);

            if (deliveryManStock.getProduct().isReturnable()) {
                ClientStock clientStock;
                if (clientStockOpt.isPresent()) {
                    clientStock = clientStockOpt.get();
                    clientStock.setQuantity(clientStock.getQuantity() + quantity);
                } else {
                    clientStock = new ClientStock();
                    clientStock.setClient(client);
                    clientStock.setProduct(deliveryManStock.getProduct());
                    clientStock.setQuantity(quantity);
                    client.getClientStock().add(clientStock);
                }
                clientStockRepository.save(clientStock);
            }

            deliveryManStockRepository.save(deliveryManStock);
            clientTransactionService.recordProduct(client, deliveryManStock.getProduct(), quantity, client.getDebt(), ClientTransactionType.PRODUCT_DELIVERY);
        } else {
            throw new IllegalArgumentException("Insufficient product quantity in deliveryMan stock");
        }
    }

	public void returnProductToDeliveryMan(Long clientId, String deliveryManEmail, Long productId, int quantity) {
		AppClient client = appClientService.findById(clientId).orElseThrow(() -> new IllegalArgumentException("Client not found"));
		AppUser deliveryMan = appUserService.findByEmail(deliveryManEmail);

        ClientStock clientStock = client.getClientStock().stream()
                .filter(stock -> stock.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Product not found in client stock"));

		if (clientStock.getQuantity() < quantity) {
			throw new IllegalArgumentException("Insufficient product quantity in client stock");
		}

		clientStock.setQuantity(clientStock.getQuantity() - quantity);
		if (clientStock.getQuantity() == 0) {
			client.getClientStock().remove(clientStock);
			clientStockRepository.delete(clientStock);
		} else {
			clientStockRepository.save(clientStock);
		}

        EmptyProduct emptyProduct = EmptyProduct.builder()
                .appUser(deliveryMan)
                .product(clientStock.getProduct())
                .quantity(quantity)
                .build();
        deliveryMan.getEmptyProducts().add(emptyProduct);
        clientTransactionService.recordProduct(client, clientStock.getProduct(), quantity, client.getDebt(), ClientTransactionType.PRODUCT_RETURN);
    }

    public void payDebt(Long clientId, BigDecimal newDebt) {
        AppClient client = appClientService.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found"));
        BigDecimal before = client.getDebt() == null ? BigDecimal.ZERO : client.getDebt();
        BigDecimal amount = before.subtract(newDebt);
        client.setDebt(newDebt);
        appClientService.save(client);
        clientTransactionService.recordMonetary(client, amount, before, newDebt, ClientTransactionType.MONETARY_PAYMENT);
    }

	public Delivery completeDelivery(Long deliveryId) {
		Delivery delivery = deliveryRepository.findById(deliveryId)
				.orElseThrow(() -> new IllegalArgumentException("Delivery not found"));
		delivery.setStatus("COMPLETED");
		return deliveryRepository.save(delivery);
	}


	@Scheduled(cron = "0 0 20 * * *")
	public void resetDailyEarnings() {
		List<MailDailyResponse> mailList = new ArrayList<>();
		List<AppUser> users = userRepository.findAll();
		for (AppUser user : users) {
			
			logger.logInfo("Resetting daily earnings for user: " + user.getEmail());
			logger.logInfo("Total: " + user.getDailyEarnings());
			logger.logInfo("Date: " + new Date().toString());
			logger.logInfo("Products: ");
			for (DeliveryManStock product : user.getDeliveryManStock()) {
				logger.logInfo(product.getProduct().getName() + " " + product.getQuantity());
			}
			logger.logInfo("Empty Products: ");
			for (EmptyProduct product : user.getEmptyProducts()) {
				logger.logInfo(product.getProduct().getName() + " " + product.getQuantity());
			}
			
			MailDailyResponse mailDailyResponse = new MailDailyResponse();
			
			mailDailyResponse.setEmail(user.getEmail());
			mailDailyResponse.setTotal(user.getDailyEarnings());
			mailDailyResponse.setDate(new Date().toString());
			mailDailyResponse.setProducts(new ArrayList<>());
			
			for (DeliveryManStock product : user.getDeliveryManStock()) {
				mailDailyResponse.getProducts().add(
						new ProductMailResponse(product.getProduct().getName(), product.getQuantity()));
			}
			mailDailyResponse.setEmptyProducts(new ArrayList<>());
			for (EmptyProduct product : user.getEmptyProducts()) {
				mailDailyResponse.getEmptyProducts()
						.add(new ProductMailResponse(product.getProduct().getName(), product.getQuantity()));
			}
			
			mailList.add(mailDailyResponse);
		}
		mailUtils.sendTotalHistory(mailList);
		for(AppUser user : users) {
            user.setDailyEarnings(BigDecimal.ZERO);
            user.getEmptyProducts().clear();
            user.getDeliveryManStock().clear();
            userRepository.save(user);
		}
	}

	public void removeProductFromDeliveryMan(String deliveryManEmail, Long productId, int quantity) {
		AppUser deliveryMan = appUserService.findByEmail(deliveryManEmail);
		DeliveryManStock deliveryManStock = deliveryMan.getDeliveryManStock().stream()
				.filter(stock -> stock.getProduct().getId().equals(productId))
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("Product not found in deliveryMan stock"));

		if (deliveryManStock.getQuantity() < quantity) {
			throw new IllegalArgumentException("Insufficient product quantity in deliveryMan stock");
		}

		deliveryManStock.setQuantity(deliveryManStock.getQuantity() - quantity);
		if (deliveryManStock.getQuantity() == 0) {
			deliveryMan.getDeliveryManStock().remove(deliveryManStock);
			deliveryManStockRepository.delete(deliveryManStock);
		} else {
			deliveryManStockRepository.save(deliveryManStock);
		}
	}

	public List<Delivery> getMatchingDeliveries(String email) {
		var list = deliveryRepository.findAll().stream().filter(
					d -> 
					d.getDeliveryMan().getEmail().equals(email)
				)
				.toList();
		return list;
	}

	public List<DeliveryReportDTO> getDeliveriesTodayForReport(String delivererEmail) {
		String today = getTodayAsString().split("T")[0];
		return deliveryRepository.findAll().stream()
				.filter(delivery -> {
					String deliveryDate = delivery.getDeliveryDate().split("T")[0];
					return deliveryDate.equals(today) &&
							delivery.getDeliveryMan().getEmail().equals(delivererEmail);
				})
				.map(delivery -> {
					int totalReturnableProducts = delivery.getClient().getClientStock().stream()
						.filter(stock -> stock.getProduct().isReturnable())
						.mapToInt(stock -> stock.getQuantity())
						.sum();
						
					return new DeliveryReportDTO(
						delivery.getId(),
						delivery.getDeliveryDate(),
						delivery.getStatus(),
						delivery.getClient().getAddress(),
						delivery.getClient().getPhoneNumber(),
						delivery.getClient().getDebt(),
						totalReturnableProducts
					);
				})
				.collect(Collectors.toList());
	}
}
