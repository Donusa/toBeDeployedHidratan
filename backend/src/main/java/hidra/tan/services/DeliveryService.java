package hidra.tan.services;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
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
import hidra.tan.repositories.AppClientRepository;
import hidra.tan.repositories.DeliveryManStockRepository;
import hidra.tan.repositories.DeliveryRepository;
import hidra.tan.repositories.UserRepository;
import hidra.tan.responses.DeliveryDto;
import hidra.tan.responses.DeliveryViewResponse;
import hidra.tan.responses.DeliveryReportDTO;
import hidra.tan.responses.MailDailyResponse;
import hidra.tan.responses.ProductMailResponse;
import hidra.tan.requests.VisitCompletionRequest;
import hidra.tan.requests.VisitCompletionRequest.ProductMovement;
import hidra.tan.services.ClientTransactionService.VisitContext;
import hidra.tan.utils.MailUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.LockModeType;
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
    @Autowired
    private AppClientRepository appClientRepository;

    @PersistenceContext
    private EntityManager entityManager;
	
	
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

    public Optional<Delivery> updateDelivery(Long id, Long clientId, String delivererEmail, String date) {
        return deliveryRepository.findByIdForUpdate(id).map(delivery -> {
            if ("COMPLETED".equals(delivery.getStatus()) || "CANCELLED".equals(delivery.getStatus())) {
                throw new IllegalArgumentException("A finished visit cannot be edited");
            }
            delivery.setClient(appClientService.findById(clientId)
                    .orElseThrow(() -> new IllegalArgumentException("Client not found")));
            delivery.setDeliveryMan(appUserService.findByEmail(delivererEmail));
            delivery.setDeliveryDate(date);
            return deliveryRepository.save(delivery);
        });
    }

    public Optional<Delivery> cancelDelivery(Long id) {
        return deliveryRepository.findByIdForUpdate(id).map(delivery -> {
            if ("COMPLETED".equals(delivery.getStatus())) {
                throw new IllegalArgumentException("A completed visit cannot be cancelled");
            }
            if ("CANCELLED".equals(delivery.getStatus())) return delivery;
            delivery.setStatus("CANCELLED");
            return deliveryRepository.save(delivery);
        });
    }

	public List<Delivery> findByClient(AppClient client) {
		return deliveryRepository.findAll().stream().filter(delivery -> delivery.getClient().equals(client))
				.collect(Collectors.toList());
	}

	public Delivery createDelivery(Long clientId, String deliveryDate, String assignedDeliverer, String status) {
		return createDelivery(clientId, deliveryDate, assignedDeliverer, status, false);
	}

	public Delivery createDelivery(Long clientId, String deliveryDate, String assignedDeliverer, String status, Boolean uniqueVisit) {

		AppUser deliveryMan = appUserService.findByEmail(assignedDeliverer);
		AppClient client = clientService.findById(clientId).get();

		final Delivery delivery = Delivery.builder().client(client).deliveryDate(deliveryDate).deliveryMan(deliveryMan)
				.status(status).uniqueVisit(uniqueVisit).build();

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
				.uniqueVisit(Boolean.TRUE.equals(delivery.getUniqueVisit()))
				.build();
	}

	public List<DeliveryViewResponse> toDeliveryViewResponse() {
		return deliveryRepository.findAll().stream()
				.map(delivery -> DeliveryViewResponse.builder().client(delivery.getClient())
						.delivererName(delivery.getDeliveryMan().getName()).status(delivery.getStatus())
						.deliveryDate(delivery.getDeliveryDate()).deliverId(delivery.getId())
						.delivererEmail(delivery.getDeliveryMan().getEmail())
						.uniqueVisit(Boolean.TRUE.equals(delivery.getUniqueVisit()))
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
        transferProductToClient(deliveryManEmail, clientId, productId, quantity, null);
    }

    private void transferProductToClient(String deliveryManEmail, Long clientId, Long productId, int quantity, VisitContext visit) {
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
            clientTransactionService.recordProduct(client, deliveryManStock.getProduct(), quantity, client.getDebt(), ClientTransactionType.PRODUCT_DELIVERY, visit);
        } else {
            throw new IllegalArgumentException("Insufficient product quantity in deliveryMan stock");
        }
    }

	public void returnProductToDeliveryMan(Long clientId, String deliveryManEmail, Long productId, int quantity) {
        returnProductToDeliveryMan(clientId, deliveryManEmail, productId, quantity, null);
    }

    private void returnProductToDeliveryMan(Long clientId, String deliveryManEmail, Long productId, int quantity, VisitContext visit) {
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
        clientTransactionService.recordProduct(client, clientStock.getProduct(), quantity, client.getDebt(), ClientTransactionType.PRODUCT_RETURN, visit);
    }

    public void payDebt(Long clientId, BigDecimal newDebt) {
        AppClient client = appClientService.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found"));
        BigDecimal before = client.getDebt() == null ? BigDecimal.ZERO : client.getDebt();
        BigDecimal amount = before.subtract(newDebt);
        if (amount.signum() == 0) {
            return;
        }

        client.setDebt(newDebt);
        appClientService.save(client);
        ClientTransactionType type = amount.signum() > 0
                ? ClientTransactionType.MONETARY_PAYMENT
                : ClientTransactionType.MONETARY_DEBT_UPDATE;
        clientTransactionService.recordMonetary(client, amount.abs(), before, newDebt, type);
    }

	public Delivery completeDelivery(Long deliveryId) {
        // Older clients already recorded individual movements and schedule their own next visit.
        Delivery delivery = deliveryRepository.findByIdForUpdate(deliveryId)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found"));
        if ("COMPLETED".equals(delivery.getStatus())) return delivery;
        if ("CANCELLED".equals(delivery.getStatus())) {
            throw new IllegalArgumentException("A cancelled visit cannot be completed");
        }
        delivery.setStatus("COMPLETED");
        return deliveryRepository.save(delivery);
    }

    public Delivery completeDelivery(Long deliveryId, VisitCompletionRequest request) {
        Delivery delivery = deliveryRepository.findByIdForUpdate(deliveryId)
				.orElseThrow(() -> new IllegalArgumentException("Delivery not found"));
        // The row lock serializes retries, including submissions from another browser.
        if ("COMPLETED".equals(delivery.getStatus())) {
            return delivery;
        }
        if ("CANCELLED".equals(delivery.getStatus())) {
            throw new IllegalArgumentException("A cancelled visit cannot be completed");
        }

        AppClient client = lockClient(delivery.getClient().getId());
        AppUser deliverer = delivery.getDeliveryMan();
        entityManager.lock(deliverer, LockModeType.PESSIMISTIC_WRITE);
        entityManager.refresh(deliverer);
        VisitContext visit = new VisitContext(UUID.randomUUID().toString(), deliveryId, new Date());
        processVisit(client, deliverer, request, visit);

        delivery.setStatus("COMPLETED");
        deliveryRepository.save(delivery);
        scheduleNextVisit(delivery);
        return delivery;
    }

    public void registerOffRouteVisit(VisitCompletionRequest request) {
        if (request.getClientId() == null || request.getDeliveryManEmail() == null
                || request.getDeliveryManEmail().isBlank() || request.getOperationId() == null
                || request.getOperationId().isBlank() || request.getOperationId().length() > 64) {
            throw new IllegalArgumentException("Client, deliverer and operation ID are required");
        }
        AppClient client = lockClient(request.getClientId());
        if (clientTransactionService.hasVisitOperation(client.getId(), request.getOperationId())) {
            return;
        }
        AppUser deliverer = appUserService.findByEmail(request.getDeliveryManEmail());
        entityManager.lock(deliverer, LockModeType.PESSIMISTIC_WRITE);
        entityManager.refresh(deliverer);
        processVisit(client, deliverer, request,
                new VisitContext(request.getOperationId(), null, new Date()));
    }

    private AppClient lockClient(Long clientId) {
        AppClient client = appClientRepository.findByIdForUpdate(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found"));
        // Delivery's eager associations may have loaded this client before the lock.
        entityManager.refresh(client);
        return client;
    }

    private void processVisit(AppClient client, AppUser deliverer, VisitCompletionRequest request, VisitContext visit) {
        if (request.getDeliveries() == null || request.getReturns() == null
                || request.getPaymentAmount() == null || request.getPaymentAmount().signum() < 0) {
            throw new IllegalArgumentException("Invalid visit movements or payment");
        }
        BigDecimal productsTotal = BigDecimal.ZERO;
        for (ProductMovement item : request.getDeliveries()) {
            validateMovement(item);
            DeliveryManStock stock = deliverer.getDeliveryManStock().stream()
                    .filter(s -> s.getProduct().getId().equals(item.getProductId()))
                    .findFirst().orElseThrow(() -> new IllegalArgumentException("Product not found in deliveryMan stock"));
            BigDecimal price = stock.getProduct().getPrice();
            if (price == null || price.signum() < 0) {
                throw new IllegalArgumentException("Invalid product price");
            }
            productsTotal = productsTotal.add(price.multiply(BigDecimal.valueOf(item.getQuantity())));
            transferProductToClient(deliverer.getEmail(), client.getId(), item.getProductId(), item.getQuantity(), visit);
        }
        for (ProductMovement item : request.getReturns()) {
            validateMovement(item);
            returnProductToDeliveryMan(client.getId(), deliverer.getEmail(), item.getProductId(), item.getQuantity(), visit);
        }

        BigDecimal before = client.getDebt() == null ? BigDecimal.ZERO : client.getDebt();
        BigDecimal afterProducts = before.add(productsTotal);
        if (productsTotal.signum() > 0) {
            clientTransactionService.recordMonetary(client, productsTotal, before, afterProducts,
                    ClientTransactionType.MONETARY_DEBT_UPDATE, visit);
        }
        BigDecimal afterPayment = afterProducts.subtract(request.getPaymentAmount());
        if (request.getPaymentAmount().signum() > 0) {
            clientTransactionService.recordMonetary(client, request.getPaymentAmount(), afterProducts, afterPayment,
                    ClientTransactionType.MONETARY_PAYMENT, visit);
        }
        client.setDebt(afterPayment);
        appClientService.save(client);
    }

    private void validateMovement(ProductMovement item) {
        if (item == null || item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
            throw new IllegalArgumentException("Product and a positive quantity are required");
        }
    }

    private void scheduleNextVisit(Delivery delivery) {
        Integer frequency = delivery.getClient().getFrecuency();
        if (Boolean.TRUE.equals(delivery.getUniqueVisit()) || frequency == null || frequency <= 0) {
            return;
        }
        DateTimeFormatter format = DateTimeFormatter.ofPattern("dd/MM/uuuu'T'HH:mm");
        LocalDateTime nextDate = LocalDateTime.parse(delivery.getDeliveryDate(), format).plusDays(frequency);
        if (nextDate.getDayOfWeek() == DayOfWeek.SATURDAY) {
            nextDate = nextDate.plusDays(2);
        } else if (nextDate.getDayOfWeek() == DayOfWeek.SUNDAY) {
            nextDate = nextDate.plusDays(1);
        }
        deliveryRepository.save(Delivery.builder()
                .client(delivery.getClient()).deliveryMan(delivery.getDeliveryMan())
                .deliveryDate(nextDate.format(format)).status("PENDING").uniqueVisit(false).build());
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

    public void deleteClientAndRelations(Long clientId) {
        clientTransactionService.deleteByClientId(clientId);

        List<Long> deliveryIds = deliveryRepository.findAll().stream()
                .filter(d -> d.getClient().getId().equals(clientId))
                .map(Delivery::getId)
                .collect(Collectors.toList());

        if (!deliveryIds.isEmpty()) {
            entityManager.createQuery("delete from DeliveryProduct dp where dp.delivery.id in :ids")
                    .setParameter("ids", deliveryIds)
                    .executeUpdate();

            entityManager.createQuery("delete from Delivery d where d.id in :ids")
                    .setParameter("ids", deliveryIds)
                    .executeUpdate();
        }

        appClientService.deleteById(clientId);
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
