FROM php:8.3-fpm

# 必要パッケージ & PHP拡張
RUN apt-get update && apt-get install -y \
    git unzip curl libzip-dev libonig-dev libxml2-dev mariadb-client nodejs npm \
    procps iproute2 net-tools \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath zip

# phpredis 拡張を追加
RUN pecl install redis \
    && docker-php-ext-enable redis

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# FPM listen を全インターフェースに変更
RUN sed -i 's/listen = .*/listen = 0.0.0.0:9000/' /usr/local/etc/php-fpm.d/www.conf

WORKDIR /var/www/html

# php-fpm をフォアグラウンドで起動
CMD ["php-fpm"]
