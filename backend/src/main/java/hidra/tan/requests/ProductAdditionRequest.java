package hidra.tan.requests;

import hidra.tan.entities.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductAdditionRequest {

	private Product product;
	private int quantity;
	
}
