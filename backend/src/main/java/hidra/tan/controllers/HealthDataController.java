package hidra.tan.controllers;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import hidra.tan.entities.HealthData;
import hidra.tan.services.HealthDataService;

@RestController
public class HealthDataController {

    @Autowired
    private HealthDataService healthDataService;

    @GetMapping("/api/v1/management/health-data")
    public ResponseEntity<?> getManagementHealthData() {
        HealthData data = healthDataService.getHealthData();
        return ResponseEntity.ok(data);
    }

    @PostMapping("/api/v1/management/health-data")
    public ResponseEntity<?> saveHealthData(@RequestBody Map<String, String> request) {
        String data = request.get("data");
        HealthData saved = healthDataService.saveHealthData(data);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/api/public/health-data")
    public ResponseEntity<?> getPublicHealthData() {
        HealthData data = healthDataService.getHealthData();
        return ResponseEntity.ok(data);
    }
}
