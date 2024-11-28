package hidra.tan.responses;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DeliveryDto {
    private Long id;
    private String deliveryDate;
    private String status;
    private String deliveryManEmail;
    private String clientName;
    private String address;
    private List<DeliveryProductDto> deliveryProducts; 
}
