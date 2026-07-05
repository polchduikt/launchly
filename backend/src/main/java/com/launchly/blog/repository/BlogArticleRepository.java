package com.launchly.blog.repository;

import com.launchly.blog.entity.BlogArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlogArticleRepository extends JpaRepository<BlogArticle, String> {
}
