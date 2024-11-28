package hidra.tan.responses;

import hidra.tan.entities.AppClient;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DeliveryViewResponse {
	
	private AppClient client;
	private Long deliverId;
	private String delivererName;
	private String delivererEmail;
	private String status;
	private String deliveryDate;
	
}
