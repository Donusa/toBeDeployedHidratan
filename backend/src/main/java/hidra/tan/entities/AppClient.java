
package hidra.tan.entities;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AppClient {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String address;
	private Integer frecuency;
	private BigDecimal debt;
	private String phoneNumber;
	private String zone;
	private String observations;

	@OneToMany(fetch = FetchType.EAGER, mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
	@JsonManagedReference
	private List<ClientStock> clientStock;

	@Override
		public String toString() {
			return "AppClient";
		}

}
