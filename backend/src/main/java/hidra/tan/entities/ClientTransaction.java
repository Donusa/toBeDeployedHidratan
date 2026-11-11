package hidra.tan.entities;

import java.math.BigDecimal;
import java.util.Date;

import com.fasterxml.jackson.annotation.JsonIgnore;

import hidra.tan.enums.ClientTransactionType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClientTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private AppClient client;

    private Date date;

    private ClientTransactionType type;

    private BigDecimal amount;

    @ManyToOne
    private Product product;

    private int quantity;

    private BigDecimal debtBefore;

    private BigDecimal debtAfter;

    private String operationId;

    private Long deliveryId;

    @JsonIgnore
    private Boolean hiddenFromHistory;
}
