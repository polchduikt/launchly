package com.launchly.bot.service;

import com.launchly.bot.dto.request.InviteMemberRequest;
import com.launchly.bot.dto.request.UpdateMemberRequest;
import com.launchly.bot.dto.response.TeamMemberResponse;
import java.util.List;

public interface TeamService {

    List<TeamMemberResponse> getTeamMembers(Long botId, Long currentUserId);

    TeamMemberResponse inviteMember(Long botId, InviteMemberRequest request, Long currentUserId);

    void cancelInvitation(Long botId, Long invitationId, Long currentUserId);

    TeamMemberResponse updateMember(Long botId, Long userId, UpdateMemberRequest request, Long currentUserId);

    void removeMember(Long botId, Long userId, Long currentUserId);

    List<TeamMemberResponse> getMyPendingInvitations(Long currentUserId);

    void acceptInvitation(Long invitationId, Long currentUserId);

    void declineInvitation(Long invitationId, Long currentUserId);

    void transferOwnership(Long botId, Long newOwnerUserId, Long currentUserId);

    void leaveBot(Long botId, Long currentUserId);
}
