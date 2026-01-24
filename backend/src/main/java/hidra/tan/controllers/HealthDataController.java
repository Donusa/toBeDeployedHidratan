package hidra.tan.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import hidra.tan.entities.HealthData;
import hidra.tan.services.HealthDataService;

@RestController
public class HealthDataController {

    @Autowired
    private HealthDataService healthDataService;

    @GetMapping("/api/public/health-data")
    public ResponseEntity<?> getPublicHealthData() {
        HealthData data = healthDataService.getHealthData();
        return ResponseEntity.ok(data);
    }
}
