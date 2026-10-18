package com.cloudguard.alert.repository;

import com.cloudguard.alert.entity.AlertComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AlertCommentRepository extends JpaRepository<AlertComment, UUID> {

    @Query("SELECT c FROM AlertComment c LEFT JOIN FETCH c.author WHERE c.alert.id = :alertId ORDER BY c.createdAt ASC")
    List<AlertComment> findByAlertIdWithAuthor(@Param("alertId") UUID alertId);
}
