package com.launchly.common.utils;

public final class SlugUtils {

    private SlugUtils() {
    }

    public static String generateOrSanitizeSlug(String requestedId, String title) {
        String raw = (requestedId != null && !requestedId.isBlank()) ? requestedId : title;
        if (raw == null || raw.isBlank()) {
            return "post-" + System.currentTimeMillis();
        }
        String transliterated = transliterate(raw.trim().toLowerCase());
        String slug = transliterated.replaceAll("[^a-z0-9\\-]+", "-").replaceAll("^-+|-+$", "");
        return slug.isBlank() ? "post-" + System.currentTimeMillis() : slug;
    }

    public static String transliterate(String text) {
        if (text == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : text.toCharArray()) {
            switch (c) {
                case 'а' -> sb.append("a");
                case 'б' -> sb.append("b");
                case 'в' -> sb.append("v");
                case 'г' -> sb.append("h");
                case 'ґ' -> sb.append("g");
                case 'д' -> sb.append("d");
                case 'е', 'є' -> sb.append("e");
                case 'ж' -> sb.append("zh");
                case 'з' -> sb.append("z");
                case 'и', 'і', 'ї' -> sb.append("i");
                case 'й' -> sb.append("y");
                case 'к' -> sb.append("k");
                case 'л' -> sb.append("l");
                case 'м' -> sb.append("m");
                case 'н' -> sb.append("n");
                case 'о' -> sb.append("o");
                case 'п' -> sb.append("p");
                case 'р' -> sb.append("r");
                case 'с' -> sb.append("s");
                case 'т' -> sb.append("t");
                case 'у' -> sb.append("u");
                case 'ф' -> sb.append("f");
                case 'х' -> sb.append("kh");
                case 'ц' -> sb.append("ts");
                case 'ч' -> sb.append("ch");
                case 'ш' -> sb.append("sh");
                case 'щ' -> sb.append("shch");
                case 'ю' -> sb.append("yu");
                case 'я' -> sb.append("ya");
                case ' ' -> sb.append("-");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }
}
