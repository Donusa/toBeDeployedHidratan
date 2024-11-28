package hidra.tan.requests;

import java.util.List;

import hidra.tan.entities.AppClient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryCreationRequest {

	private AppClient client;
	private String deliveryDate;
	private String deliveryMan;
	private String status;
	private List<ProductAdditionRequest> products;
}
