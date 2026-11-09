CREATE DATABASE IF NOT EXISTS civicfix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS civicfix_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'civicfix'@'%' IDENTIFIED BY 'civicfix';
GRANT ALL PRIVILEGES ON civicfix.* TO 'civicfix'@'%';
GRANT ALL PRIVILEGES ON civicfix_test.* TO 'civicfix'@'%';
FLUSH PRIVILEGES;

