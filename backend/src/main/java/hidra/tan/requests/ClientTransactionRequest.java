package hidra.tan.requests;

import java.math.BigDecimal;

import hidra.tan.enums.ClientTransactionType;
import lombok.Data;

@Data
public class ClientTransactionRequest {
    private ClientTransactionType type;
    private BigDecimal amount;
    private Long productId;
    private Integer quantity;
    private BigDecimal debtAfter;
}
