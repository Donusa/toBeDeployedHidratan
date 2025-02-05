package hidra.tan.responses;

import java.math.BigDecimal;
import java.util.List;

import lombok.Data;

@Data
public class HistoryResponse {

	String DeliveryMail;
	String date;
	List<ProductMailResponse> products;
	List<ProductMailResponse> emptyProducts;
	BigDecimal total;
}
