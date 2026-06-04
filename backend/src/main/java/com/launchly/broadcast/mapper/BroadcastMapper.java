package com.launchly.broadcast.mapper;

import com.launchly.broadcast.dto.response.CampaignResponse;
import com.launchly.broadcast.dto.response.TagResponse;
import com.launchly.broadcast.entity.BroadcastCampaign;
import com.launchly.broadcast.entity.Tag;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.List;

@Mapper(componentModel = "spring")
public interface BroadcastMapper {

    @Mapping(source = "bot.id", target = "botId")
    TagResponse toTagResponse(Tag tag);

    List<TagResponse> toTagResponseList(List<Tag> tags);

    @Mapping(source = "bot.id", target = "botId")
    CampaignResponse toCampaignResponse(BroadcastCampaign campaign);

    List<CampaignResponse> toCampaignResponseList(List<BroadcastCampaign> campaigns);
}
