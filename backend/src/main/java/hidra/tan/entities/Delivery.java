package hidra.tan.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
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
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JsonBackReference("client-delivery")
    private AppClient client;

    private String deliveryDate;

    @ManyToOne
    @JsonBackReference("user-delivery")
    private AppUser deliveryMan;
    private String status;

    @Column(name = "unique_visit", nullable = true)
    private Boolean uniqueVisit;

    @Override
	public String toString() {
		return "Delivery";
	}


}
