package hidra.tan.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppClient;
import hidra.tan.repositories.AppClientRepository;

@Service
public class AppClientService {

	@Autowired
    private AppClientRepository appClientRepository;

    public List<AppClient> findAll() {
        return appClientRepository.findAll();
    }

    public Optional<AppClient> findById(Long id) {
        return appClientRepository.findById(id);
    }

    public AppClient save(AppClient appClient) {
        return appClientRepository.save(appClient);
    }

    public void deleteById(Long id) {
        appClientRepository.deleteById(id);
    }

}
