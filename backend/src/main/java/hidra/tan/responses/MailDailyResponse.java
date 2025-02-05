package hidra.tan.responses;

import java.math.BigDecimal;
import java.util.List;

import lombok.Data;

@Data
public class MailDailyResponse {

	String email;
	String date;
	BigDecimal total;
	List<ProductMailResponse> products;
	List<ProductMailResponse> emptyProducts;
}
