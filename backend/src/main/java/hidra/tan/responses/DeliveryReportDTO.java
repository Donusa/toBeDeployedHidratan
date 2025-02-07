package hidra.tan.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DeliveryReportDTO {
    private Long id;
    private String deliveryDate;
    private String status;
    private String address;
    private String phoneNumber;
    private BigDecimal debt;
    private Integer totalReturnableProducts;
}
