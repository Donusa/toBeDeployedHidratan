package hidra.tan.requests;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class PasswordUpdateRequest {

	@Email
	private String email;

	private String password;

	private String newPassword;
}
