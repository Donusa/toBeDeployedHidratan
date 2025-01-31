package hidra.tan.entities;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import hidra.tan.enums.Roles;
import jakarta.validation.constraints.Email;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
@ToString(exclude = {"deliveryManStock", "emptyProducts", "deliveries"})
public class AppUser implements UserDetails{

	private static final long serialVersionUID = 1L;
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;
    @Email(message = "Email should be valid")
	private String email;
	private String pass;
	private String name;
	@Builder.Default
	private BigDecimal dailyEarnings = BigDecimal.ZERO;
	@OneToMany(fetch = FetchType.EAGER, mappedBy = "deliveryMan", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<DeliveryManStock> deliveryManStock;
	@OneToMany(fetch = FetchType.EAGER, mappedBy = "appUser", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<EmptyProduct> emptyProducts;
	@Builder.Default
	private Boolean active = true;
	@Enumerated(EnumType.STRING)
	private Roles role;
	@OneToMany(fetch= FetchType.EAGER, mappedBy = "deliveryMan", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<Delivery> deliveries;
	@Column(name = "reset_token")
	private String resetToken;
	@Column(name = "reset_token_expiry")
	private LocalDateTime resetTokenExpiry;
	
	
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority(role.name()));
	}
	@Override
	public String getUsername() {
		return this.email;
	}
	
	@Override
	public boolean isAccountNonLocked() {
		return true;
	}
	@Override
	public boolean isAccountNonExpired() {
		return true;
	}
	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}
	@Override
	public String getPassword() {
		return this.pass;
	}

}
