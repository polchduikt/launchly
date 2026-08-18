package com.launchly.bot.service.impl;

import com.launchly.auth.entity.User;
import com.launchly.auth.service.UserQueryService;
import com.launchly.bot.dto.request.InviteMemberRequest;
import com.launchly.bot.dto.request.UpdateMemberRequest;
import com.launchly.bot.dto.response.TeamMemberResponse;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.entity.BotInvitation;
import com.launchly.bot.entity.BotMember;
import com.launchly.bot.repository.BotInvitationRepository;
import com.launchly.bot.repository.BotMemberRepository;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.service.TeamService;
import com.launchly.billing.entity.Plan;
import com.launchly.billing.entity.Subscription;
import com.launchly.billing.entity.SubscriptionStatus;
import com.launchly.billing.repository.PlanRepository;
import com.launchly.billing.repository.SubscriptionRepository;
import com.launchly.common.exception.AppException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {

    private final BotRepository botRepository;
    private final UserQueryService userQueryService;
    private final BotMemberRepository botMemberRepository;
    private final BotInvitationRepository botInvitationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembers(Long botId, Long currentUserId) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        boolean isOwner = bot.getUser().getId().equals(currentUserId);
        boolean isMember = botMemberRepository.existsByBotOwnerIdAndUserId(bot.getUser().getId(), currentUserId);

        if (!isOwner && !isMember) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
        }


        List<TeamMemberResponse> responses = new ArrayList<>();

        responses.add(new TeamMemberResponse(
                bot.getUser().getId(),
                bot.getUser().getId(),
                bot.getUser().getEmail(),
                bot.getUser().getName(),
                bot.getUser().getAvatar(),
                "Owner",
                true,
                true,
                false,
                bot.getCreatedAt()
        ));

        List<BotMember> members = botMemberRepository.findByBotOwnerId(bot.getUser().getId());
        Map<Long, BotMember> uniqueMembers = new HashMap<>();
        for (BotMember m : members) {
            Long uid = m.getUser().getId();
            if (!uniqueMembers.containsKey(uid)) {
                uniqueMembers.put(uid, m);
            } else {
                BotMember existing = uniqueMembers.get(uid);
                if (getRolePrivilege(m.getRole()) > getRolePrivilege(existing.getRole())) {
                    uniqueMembers.put(uid, m);
                }
            }
        }

        for (BotMember m : uniqueMembers.values()) {
            responses.add(new TeamMemberResponse(
                    m.getUser().getId(),
                    m.getUser().getId(),
                    m.getUser().getEmail(),
                    m.getUser().getName(),
                    m.getUser().getAvatar(),
                    m.getRole(),
                    m.isInboxSeat(),
                    m.isBillingPermission(),
                    false,
                    m.getCreatedAt()
            ));
        }

        List<BotInvitation> invitations = botInvitationRepository.findByBotOwnerId(bot.getUser().getId());
        Map<String, BotInvitation> uniqueInvitations = new HashMap<>();
        for (BotInvitation invite : invitations) {
            if (!invite.isAccepted()) {
                uniqueInvitations.put(invite.getEmail().toLowerCase(), invite);
            }
        }

        for (BotInvitation invite : uniqueInvitations.values()) {
            responses.add(new TeamMemberResponse(
                    invite.getId() + 1000000000L,
                    null,
                    invite.getEmail(),
                    invite.getEmail(),
                    null,
                    invite.getRole(),
                    invite.isInboxSeat(),
                    invite.isBillingPermission(),
                    true,
                    invite.getCreatedAt()
            ));
        }

        return responses;
    }

    private int getRolePrivilege(String role) {
        if (role == null) return 0;
        return switch (role.toLowerCase()) {
            case "admin" -> 3;
            case "editor" -> 2;
            case "viewer" -> 1;
            default -> 0;
        };
    }

    @Override
    @Transactional
    public TeamMemberResponse inviteMember(Long botId, InviteMemberRequest request, Long currentUserId) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        if (!bot.getUser().getId().equals(currentUserId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
        }

        if (bot.getUser().getEmail().equalsIgnoreCase(request.email())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "team.error.cannot_invite_owner");
        }

        Optional<BotInvitation> existingInvite = botInvitationRepository.findByBotOwnerIdAndEmailIgnoreCase(bot.getUser().getId(), request.email());
        if (existingInvite.isPresent() && !existingInvite.get().isAccepted()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "team.error.invitation_already_pending");
        }

        Optional<User> targetUserOpt = userQueryService.findByEmailIgnoreCase(request.email());
        if (targetUserOpt.isPresent()) {
            User targetUser = targetUserOpt.get();
            if (botMemberRepository.existsByBotOwnerIdAndUserId(bot.getUser().getId(), targetUser.getId())) {
                throw new AppException(HttpStatus.BAD_REQUEST, "team.error.user_already_member");
            }
        }


        BotInvitation invite = existingInvite.orElseGet(() -> BotInvitation.builder()
                .bot(bot)
                .email(request.email().toLowerCase())
                .build());

        invite.setRole(request.role());
        invite.setInboxSeat(request.inboxSeat());
        invite.setBillingPermission(request.billingPermission());
        invite.setAccepted(false);

        invite = botInvitationRepository.save(invite);

        return new TeamMemberResponse(
                invite.getId() + 1000000000L,
                null,
                invite.getEmail(),
                invite.getEmail(),
                null,
                invite.getRole(),
                invite.isInboxSeat(),
                invite.isBillingPermission(),
                true,
                invite.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void cancelInvitation(Long botId, Long invitationId, Long currentUserId) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        if (!bot.getUser().getId().equals(currentUserId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
        }

        Long rawInviteId = invitationId > 1000000000L ? invitationId - 1000000000L : invitationId;
        BotInvitation invite = botInvitationRepository.findById(rawInviteId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "team.error.invitation_not_found"));

        botInvitationRepository.delete(invite);
    }

    @Override
    @Transactional
    public TeamMemberResponse updateMember(Long botId, Long userId, UpdateMemberRequest request, Long currentUserId) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        if (!bot.getUser().getId().equals(currentUserId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
        }

        List<BotMember> members = botMemberRepository.findByBotOwnerIdAndUserId(bot.getUser().getId(), userId);
        if (members.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "team.error.member_not_found");
        }

        BotMember firstUpdated = null;
        for (BotMember member : members) {
            member.setRole(request.role());
            member.setInboxSeat(request.inboxSeat());
            member.setBillingPermission(request.billingPermission());
            BotMember saved = botMemberRepository.save(member);
            if (firstUpdated == null) {
                firstUpdated = saved;
            }
        }

        return new TeamMemberResponse(
                firstUpdated.getId(),
                firstUpdated.getUser().getId(),
                firstUpdated.getUser().getEmail(),
                firstUpdated.getUser().getName(),
                firstUpdated.getUser().getAvatar(),
                firstUpdated.getRole(),
                firstUpdated.isInboxSeat(),
                firstUpdated.isBillingPermission(),
                false,
                firstUpdated.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void removeMember(Long botId, Long userId, Long currentUserId) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        if (!bot.getUser().getId().equals(currentUserId) && !currentUserId.equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
        }

        List<BotMember> members = botMemberRepository.findByBotOwnerIdAndUserId(bot.getUser().getId(), userId);
        if (members.isEmpty()) {
            throw new AppException(HttpStatus.NOT_FOUND, "team.error.member_not_found");
        }


        for (BotMember member : members) {
            botMemberRepository.delete(member);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getMyPendingInvitations(Long currentUserId) {
        User user = userQueryService.getUserOrThrow(currentUserId);

        List<BotInvitation> invites = botInvitationRepository.findByEmailIgnoreCaseAndAccepted(user.getEmail(), false);

        return invites.stream()
                .map(invite -> new TeamMemberResponse(
                        invite.getId(),
                        invite.getBot().getUser().getId(),
                        invite.getBot().getUser().getEmail(),
                        invite.getBot().getUser().getName() != null && !invite.getBot().getUser().getName().isBlank()
                                ? invite.getBot().getUser().getName()
                                : invite.getBot().getUser().getEmail(),
                        invite.getBot().getUser().getAvatar(),
                        invite.getRole(),
                        invite.isInboxSeat(),
                        invite.isBillingPermission(),
                        true,
                        invite.getCreatedAt(),
                        invite.getBot().getId()
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void acceptInvitation(Long invitationId, Long currentUserId) {
        User user = userQueryService.getUserOrThrow(currentUserId);

        BotInvitation invite = botInvitationRepository.findByIdAndEmailIgnoreCase(invitationId, user.getEmail())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "team.error.invitation_not_found"));

        if (invite.isAccepted()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "team.error.invitation_already_accepted");
        }

        invite.setAccepted(true);
        botInvitationRepository.save(invite);

        Optional<BotMember> existingMember = botMemberRepository.findByBotIdAndUserId(invite.getBot().getId(), user.getId());
        if (existingMember.isEmpty()) {
            BotMember member = BotMember.builder()
                    .bot(invite.getBot())
                    .user(user)
                    .role(invite.getRole())
                    .inboxSeat(invite.isInboxSeat())
                    .billingPermission(invite.isBillingPermission())
                    .build();
            botMemberRepository.save(member);
        }
    }

    @Override
    @Transactional
    public void declineInvitation(Long invitationId, Long currentUserId) {
        User user = userQueryService.getUserOrThrow(currentUserId);

        BotInvitation invite = botInvitationRepository.findByIdAndEmailIgnoreCase(invitationId, user.getEmail())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "team.error.invitation_not_found"));

        botInvitationRepository.delete(invite);
    }

    @Override
    @Transactional
    public void transferOwnership(Long botId, Long newOwnerUserId, Long currentUserId) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        if (!bot.getUser().getId().equals(currentUserId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied");
        }
        if (currentUserId.equals(newOwnerUserId)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "team.error.already_owner");
        }

        User oldOwner = bot.getUser();
        User newOwner = userQueryService.getUserOrThrow(newOwnerUserId);

        List<Bot> allOldOwnerBots = botRepository.findAllByUserId(oldOwner.getId());
        if (allOldOwnerBots.isEmpty()) {
            allOldOwnerBots = List.of(bot);
        }

        for (Bot b : allOldOwnerBots) {
            b.setUser(newOwner);
            botRepository.save(b);

            botMemberRepository.findByBotIdAndUserId(b.getId(), newOwnerUserId)
                    .ifPresent(botMemberRepository::delete);
            botMemberRepository.findByBotIdAndUserId(b.getId(), oldOwner.getId())
                    .ifPresent(botMemberRepository::delete);
        }
        Optional<Subscription> oldSubOpt = subscriptionRepository.findByUserId(oldOwner.getId());
        if (oldSubOpt.isPresent()) {
            Subscription oldSub = oldSubOpt.get();
            Plan oldPlan = oldSub.getPlan();

            Optional<Subscription> newOwnerSubOpt = subscriptionRepository.findByUserId(newOwner.getId());
            if (newOwnerSubOpt.isPresent()) {
                Subscription newSub = newOwnerSubOpt.get();
                newSub.setPlan(oldPlan);
                newSub.setStatus(oldSub.getStatus());
                newSub.setStripeSubscriptionId(oldSub.getStripeSubscriptionId());
                newSub.setCancelAtPeriodEnd(oldSub.isCancelAtPeriodEnd());
                newSub.setCurrentPeriodStart(oldSub.getCurrentPeriodStart());
                newSub.setCurrentPeriodEnd(oldSub.getCurrentPeriodEnd());
                subscriptionRepository.save(newSub);
            } else {
                Subscription newSub = Subscription.builder()
                        .user(newOwner)
                        .plan(oldPlan)
                        .status(oldSub.getStatus())
                        .stripeSubscriptionId(oldSub.getStripeSubscriptionId())
                        .cancelAtPeriodEnd(oldSub.isCancelAtPeriodEnd())
                        .currentPeriodStart(oldSub.getCurrentPeriodStart())
                        .currentPeriodEnd(oldSub.getCurrentPeriodEnd())
                        .build();
                subscriptionRepository.save(newSub);
            }

            planRepository.findByName("FREE").ifPresent(freePlan -> {
                Optional<Subscription> oldOwnerRefresh = subscriptionRepository.findByUserId(oldOwner.getId());
                if (oldOwnerRefresh.isPresent()) {
                    Subscription oldOwnerSub = oldOwnerRefresh.get();
                    oldOwnerSub.setPlan(freePlan);
                    oldOwnerSub.setStatus(SubscriptionStatus.ACTIVE);
                    oldOwnerSub.setStripeSubscriptionId(null);
                    oldOwnerSub.setCancelAtPeriodEnd(false);
                    subscriptionRepository.save(oldOwnerSub);
                }
            });
        }
    }

    @Override
    @Transactional
    public void leaveBot(Long botId, Long currentUserId) {
        Bot bot = botRepository.findById(botId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "bot.error.not_found"));

        if (bot.getUser().getId().equals(currentUserId)) {
            List<BotMember> members = botMemberRepository.findByBotOwnerId(currentUserId);
            if (members.isEmpty()) {
                throw new AppException(HttpStatus.BAD_REQUEST, "team.error.sole_member");
            }
            BotMember nextOwnerMember = members.get(0);
            transferOwnership(botId, nextOwnerMember.getUser().getId(), currentUserId);
        } else {
            List<BotMember> members = botMemberRepository.findByBotOwnerIdAndUserId(bot.getUser().getId(), currentUserId);
            for (BotMember member : members) {
                botMemberRepository.delete(member);
            }
        }
    }

}
