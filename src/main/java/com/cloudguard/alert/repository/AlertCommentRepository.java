package com.cloudguard.alert.repository;
import com.cloudguard.alert.entity.AlertComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
@Repository
public interface AlertCommentRepository extends JpaRepository<AlertComment, UUID> {
    List<AlertComment> findByAlertIdOrderByCreatedAtDesc(UUID alertId);
}
