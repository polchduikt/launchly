package com.launchly.broadcast.repository;

import com.launchly.broadcast.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByBotId(Long botId);

    Optional<Tag> findByBotIdAndName(Long botId, String name);
}
