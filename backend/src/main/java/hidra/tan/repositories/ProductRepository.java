package hidra.tan.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import hidra.tan.entities.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>{
}
