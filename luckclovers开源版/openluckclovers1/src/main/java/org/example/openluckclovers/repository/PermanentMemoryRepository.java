package org.example.openluckclovers.repository;

import org.example.openluckclovers.config.PermanentMemory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermanentMemoryRepository extends JpaRepository<PermanentMemory, Long> {
    PermanentMemory findByConfigIdAndMemoryKey(Long configId, String memoryKey);
}