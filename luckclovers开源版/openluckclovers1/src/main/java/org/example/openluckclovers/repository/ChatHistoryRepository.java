package org.example.openluckclovers.repository;

import org.example.openluckclovers.config.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Long> {
    List<ChatHistory> findByConfigIdAndSessionId(Long configId, String sessionId);
}