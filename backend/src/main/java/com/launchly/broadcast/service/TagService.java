package com.launchly.broadcast.service;

import com.launchly.broadcast.dto.request.CreateTagRequest;
import com.launchly.broadcast.dto.response.TagResponse;
import com.launchly.broadcast.entity.Tag;
import java.util.List;

public interface TagService {

    Tag getOrCreateTag(Long botId, String name);

    void assignTagToUser(Long botUserId, Long tagId);

    List<TagResponse> getTagsByBot(Long botId, Long userId);

    TagResponse createTag(Long botId, Long userId, CreateTagRequest request);

    TagResponse updateTag(Long tagId, Long userId, CreateTagRequest request);

    void deleteTag(Long tagId, Long userId);
}
