package com.launchly;

import com.launchly.auth.entity.Role;
import com.launchly.auth.entity.User;
import com.launchly.auth.repository.UserRepository;
import com.launchly.auth.service.TokenService;
import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.bot.telegram.TelegramBotManager;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Transactional
public abstract class BaseIntegrationTest {

    @ServiceConnection
    public static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        postgres.start();
    }

    @DynamicPropertySource
    public static void configureDynamicProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName);
        registry.add("spring.docker.compose.enabled", () -> "false");
        registry.add("spring.docker.compose.mode", () -> "off");
    }

    protected MockMvc mockMvc;

    @Autowired
    protected WebApplicationContext webApplicationContext;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected BotRepository botRepository;

    @Autowired
    protected TokenService tokenService;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @MockitoBean
    protected TelegramBotManager telegramBotManager;

    @MockitoBean
    protected StringRedisTemplate stringRedisTemplate;

    @MockitoBean
    protected CacheManager cacheManager;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUpBase() {
        this.mockMvc = MockMvcBuilders
                .webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        Mockito.when(cacheManager.getCache(anyString()))
                .thenAnswer(inv -> new ConcurrentMapCache(inv.getArgument(0)));

        ValueOperations<String, String> valueOperations = Mockito.mock(ValueOperations.class);
        Mockito.when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    protected User createTestUser(String emailPrefix, Role role) {
        String uniqueEmail = emailPrefix + "_" + UUID.randomUUID().toString().substring(0, 8) + "@launchly.test";
        User user = User.builder()
                .email(uniqueEmail)
                .name("Test User " + emailPrefix)
                .password(passwordEncoder.encode("Password123!"))
                .role(role)
                .active(true)
                .emailVerified(true)
                .build();
        return userRepository.save(user);
    }

    protected Bot createTestBot(User owner, String name) {
        Bot bot = Bot.builder()
                .name(name)
                .user(owner)
                .telegramToken("123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ123456789")
                .active(false)
                .build();
        return botRepository.save(bot);
    }

    protected String getAuthHeader(User user) {
        return "Bearer " + tokenService.generateAccessToken(user);
    }
}
