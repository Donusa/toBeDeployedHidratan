package hidra.tan.requests;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class EmailUpdateRequest {

	@Email
	private String email;
	
	@Email
	private String newEmail;
}
