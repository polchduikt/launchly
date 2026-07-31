package com.launchly.crm.repository;

import com.launchly.crm.entity.CrmLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CrmLabelRepository extends JpaRepository<CrmLabel, Long> {
    List<CrmLabel> findByUserId(Long userId);
    Optional<CrmLabel> findByUserIdAndName(Long userId, String name);
    void deleteByUserIdAndName(Long userId, String name);
}
