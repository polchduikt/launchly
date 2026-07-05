package com.launchly.blog.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "blog_articles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogArticle {

    @Id
    private String id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 100)
    private String author;

    @Column(name = "read_time", nullable = false, length = 50)
    private String readTime;

    @Column(name = "date_published", nullable = false, length = 50)
    private String datePublished;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "cover_image")
    private String coverImage;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Column(name = "content_blocks", nullable = false, columnDefinition = "TEXT")
    private String contentBlocks;
}
