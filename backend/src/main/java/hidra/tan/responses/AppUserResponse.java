package hidra.tan.responses;

import java.util.List;

import hidra.tan.entities.AppUser;
import hidra.tan.entities.DeliveryManStock;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AppUserResponse {

	private String email;
	private String name;
	private String role;
	private Boolean active;
	private List<DeliveryManStock> products;

	public static AppUserResponse userToResponse(AppUser user) {
		return AppUserResponse.builder()
				.email(user.getEmail())
				.name(user.getName())
				.role(user.getRole().name())
				.active(user.getActive())
				.products(user.getDeliveryManStock())
				.build();
	}
}
