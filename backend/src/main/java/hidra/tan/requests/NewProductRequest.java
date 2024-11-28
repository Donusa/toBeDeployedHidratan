package hidra.tan.requests;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NewProductRequest {

	private Long clientId;
	private Long productId;
	private Integer quantity;
}
