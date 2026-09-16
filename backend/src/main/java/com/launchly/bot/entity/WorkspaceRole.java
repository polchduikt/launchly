package com.launchly.bot.entity;

public enum WorkspaceRole {
    OWNER("Owner", 4),
    ADMIN("Admin", 3),
    EDITOR("Editor", 2),
    VIEWER("Viewer", 1);

    private final String value;
    private final int privilege;

    WorkspaceRole(String value, int privilege) {
        this.value = value;
        this.privilege = privilege;
    }

    public String getValue() {
        return value;
    }

    public int getPrivilege() {
        return privilege;
    }

    public static WorkspaceRole from(String role) {
        if (role == null) {
            return VIEWER;
        }
        for (WorkspaceRole r : values()) {
            if (r.value.equalsIgnoreCase(role) || r.name().equalsIgnoreCase(role)) {
                return r;
            }
        }
        return VIEWER;
    }

    public static int resolvePrivilege(String role) {
        if (role == null) {
            return 0;
        }
        for (WorkspaceRole r : values()) {
            if (r.value.equalsIgnoreCase(role) || r.name().equalsIgnoreCase(role)) {
                return r.privilege;
            }
        }
        return 0;
    }
}
