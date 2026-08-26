package com.launchly.broadcast.repository;

import com.launchly.broadcast.entity.Tag;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    @EntityGraph(attributePaths = {"bot"})
    List<Tag> findByBotId(Long botId);

    @EntityGraph(attributePaths = {"bot"})
    Optional<Tag> findByBotIdAndName(Long botId, String name);

    @Override
    @EntityGraph(attributePaths = {"bot"})
    Optional<Tag> findById(Long id);
}
