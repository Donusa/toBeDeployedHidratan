package hidra.tan.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import hidra.tan.entities.AppUser;
import hidra.tan.entities.DailyTotalHistory;
import hidra.tan.repositories.DailyTotalHistoryRepository;
import hidra.tan.responses.HistoryResponse;

@Service
public class DailyTotalHistoryService {

	@Autowired
	private DailyTotalHistoryRepository dailyTotalHistoryRepository;
	@Autowired
	private AppUserService appUserService;
	
	public List<DailyTotalHistory> getDailyTotalHistories() {
		return dailyTotalHistoryRepository.findAll();
	}
	
	public DailyTotalHistory save(DailyTotalHistory dailyTotalHistory) {
		return dailyTotalHistoryRepository.save(dailyTotalHistory);
	}
	
	public DailyTotalHistory findByUserId(Long id) {
		AppUser user = appUserService.findById(id);
		return dailyTotalHistoryRepository.findByDeliveryMan(user);
	}
	
	public HistoryResponse mapToDto(DailyTotalHistory dailyTotalHistory) {
        HistoryResponse historyResponse = new HistoryResponse();
        historyResponse.setTotal(dailyTotalHistory.getTotal());
        historyResponse.setDate(dailyTotalHistory.getDate().toString());
        historyResponse.setDeliveryMail(dailyTotalHistory.getDeliveryMan().getEmail());
        historyResponse.setEmptyProducts(dailyTotalHistory.getDailyEmptyProductHistories());
        historyResponse.setProducts(dailyTotalHistory.getDailyProductHistories());
        return historyResponse;
    }
}
