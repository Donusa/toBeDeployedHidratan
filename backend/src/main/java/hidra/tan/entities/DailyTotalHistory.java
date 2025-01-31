package hidra.tan.entities;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DailyTotalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Date date;

    @ManyToOne
    private AppUser deliveryMan;

    private BigDecimal total;

    @OneToMany(mappedBy = "dailyTotalHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DailyProductHistory> dailyProductHistories;
    
    @OneToMany(mappedBy = "dailyTotalHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DailyEmptyProductHistory> dailyEmptyProductHistories;
    
    @Override
	public String toString() {
		return "";
	}

}
