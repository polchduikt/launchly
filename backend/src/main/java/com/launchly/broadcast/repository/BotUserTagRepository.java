package com.launchly.broadcast.repository;

import com.launchly.broadcast.entity.BotUserTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface BotUserTagRepository extends JpaRepository<BotUserTag, Long> {

    List<BotUserTag> findByBotUserId(Long botUserId);

    boolean existsByBotUserIdAndTagId(Long botUserId, Long tagId);

    @Query("SELECT but.botUser.id FROM BotUserTag but WHERE but.tag.name = :tagName AND but.tag.bot.id = :botId")
    List<Long> findBotUserIdsByTagNameAndBotId(@Param("tagName") String tagName, @Param("botId") Long botId);

    void deleteByTagId(Long tagId);

    void deleteByBotUserId(Long botUserId);

    void deleteByBotUserIdAndTagId(Long botUserId, Long tagId);
}
