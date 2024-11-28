package hidra.tan.responses;

import hidra.tan.entities.AppUser;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AppUserResponse {

	private String email;
	private String name;
	private String role;
	private Boolean active;
	
	public static AppUserResponse userToResponse(AppUser user) {
		return AppUserResponse.builder()
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .active(user.getActive())
                .build();
	}
}
