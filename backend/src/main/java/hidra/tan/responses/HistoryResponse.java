package hidra.tan.responses;

import java.math.BigDecimal;
import java.util.List;

import hidra.tan.entities.DailyEmptyProductHistory;
import hidra.tan.entities.DailyProductHistory;
import lombok.Data;

@Data
public class HistoryResponse {

	String DeliveryMail;
	String date;
	List<DailyProductHistory> products;
	List<DailyEmptyProductHistory> emptyProducts;
	BigDecimal total;
}
