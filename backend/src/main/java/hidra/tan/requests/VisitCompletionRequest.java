package hidra.tan.requests;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class VisitCompletionRequest {
    @NotNull
    @Valid
    private List<@NotNull ProductMovement> deliveries = new ArrayList<>();

    @NotNull
    @Valid
    private List<@NotNull ProductMovement> returns = new ArrayList<>();

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal paymentAmount = BigDecimal.ZERO;

    // Used only when registering an unscheduled visit.
    private Long clientId;
    private String deliveryManEmail;
    @Size(max = 64)
    private String operationId;

    @Data
    public static class ProductMovement {
        @NotNull
        @Positive
        private Long productId;
        @NotNull
        @Positive
        private Integer quantity;
    }
}
