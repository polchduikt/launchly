CREATE TABLE blog_articles (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    read_time VARCHAR(50) NOT NULL,
    date_published VARCHAR(50) NOT NULL,
    summary TEXT,
    cover_image VARCHAR(255),
    tags TEXT,
    content_blocks TEXT NOT NULL
);
