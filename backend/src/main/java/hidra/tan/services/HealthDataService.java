package hidra.tan.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.HealthData;
import hidra.tan.repositories.HealthDataRepository;

@Service
public class HealthDataService {

    @Autowired
    private HealthDataRepository healthDataRepository;

    public HealthData getHealthData() {
        List<HealthData> allData = healthDataRepository.findAll();
        if (allData.isEmpty()) {
            return null;
        }
        // Assuming we only keep one record or want the last one
        return allData.get(allData.size() - 1);
    }

    public HealthData saveHealthData(String data) {
        HealthData healthData = getHealthData();
        if (healthData == null) {
            healthData = new HealthData();
        }
        healthData.setData(data);
        return healthDataRepository.save(healthData);
    }
}
