package com.launchly.bot.validator;

import com.launchly.common.exception.AppException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FlowSchemaValidatorTest {

    private FlowSchemaValidator validator;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        validator = new FlowSchemaValidator();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("Should validate valid flow schema successfully")
    void validateFlowSchema_ValidSchema_Success() throws Exception {
        String nodesJson = "[{\"id\":\"node_1\",\"type\":\"START\"},{\"id\":\"node_2\",\"type\":\"MESSAGE\"}]";
        String edgesJson = "[{\"source\":\"node_1\",\"target\":\"node_2\"}]";

        JsonNode nodes = objectMapper.readTree(nodesJson);
        JsonNode edges = objectMapper.readTree(edgesJson);

        validator.validateFlowSchema(nodes, edges);
    }

    @Test
    @DisplayName("Should throw BadRequest when nodes or edges is not an array")
    void validateFlowSchema_NonArray_ThrowsBadRequest() throws Exception {
        JsonNode invalidNodes = objectMapper.readTree("{\"id\":\"1\"}");
        JsonNode edges = objectMapper.readTree("[]");

        assertThatThrownBy(() -> validator.validateFlowSchema(invalidNodes, edges))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);

        JsonNode nodes = objectMapper.readTree("[]");
        JsonNode invalidEdges = objectMapper.readTree("{\"source\":\"1\"}");

        assertThatThrownBy(() -> validator.validateFlowSchema(nodes, invalidEdges))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should throw BadRequest when there is no START node or multiple START nodes")
    void validateFlowSchema_InvalidStartCount_ThrowsBadRequest() throws Exception {
        String noStartNodes = "[{\"id\":\"node_1\",\"type\":\"MESSAGE\"}]";
        JsonNode nodes1 = objectMapper.readTree(noStartNodes);
        JsonNode edges1 = objectMapper.readTree("[]");

        assertThatThrownBy(() -> validator.validateFlowSchema(nodes1, edges1))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);

        String multiStartNodes = "[{\"id\":\"node_1\",\"type\":\"START\"},{\"id\":\"node_2\",\"type\":\"START\"}]";
        JsonNode nodes2 = objectMapper.readTree(multiStartNodes);

        assertThatThrownBy(() -> validator.validateFlowSchema(nodes2, edges1))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should throw BadRequest when edge connects to unknown node ID")
    void validateFlowSchema_UnknownEdgeTarget_ThrowsBadRequest() throws Exception {
        String nodesJson = "[{\"id\":\"node_1\",\"type\":\"START\"}]";
        String edgesJson = "[{\"source\":\"node_1\",\"target\":\"non_existent_node\"}]";

        JsonNode nodes = objectMapper.readTree(nodesJson);
        JsonNode edges = objectMapper.readTree(edgesJson);

        assertThatThrownBy(() -> validator.validateFlowSchema(nodes, edges))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.BAD_REQUEST);
    }
}
