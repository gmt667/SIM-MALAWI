<?php
declare(strict_types=1);

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

namespace SIM\Lib;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Class Database
 * 
 * Implements a secure PDO MySQL Database Connection using the Singleton pattern
 * designed for PHP 8.1+. Features environment-aware error masking, prepared statement
 * utilities, and secure connection options to prevent credential leaks and SQL injection.
 */
class Database 
{
    /**
     * Singleton Instance
     */
    private static ?Database $instance = null;

    /**
     * PDO Database Connection
     */
    private ?PDO $connection = null;

    /**
     * Environment mode ('development' or 'production')
     */
    private string $environment;

    /**
     * Private Constructor to prevent direct instantiation (Singleton Pattern)
     */
    private function __construct() 
    {
        // Load configuration from environment variables (with fallback defaults)
        $host = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
        $port = (int)($_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: 3306);
        $dbName = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'surveyors_institute_malawi';
        $username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'root';
        $password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '';
        $charset = $_ENV['DB_CHARSET'] ?? getenv('DB_CHARSET') ?: 'utf8mb4';
        
        $this->environment = $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production';

        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $host, $port, $dbName, $charset);

        // Secure PDO attributes configuration
        $options = [
            // Always throw PDOExceptions for robust try/catch workflows
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            // Fetch records as associative arrays by default
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Turn off emulated prepared statements to force native MySQL parametrization and secure against SQL injection
            PDO::ATTR_EMULATE_PREPARES   => false,
            // Ensure connection uses modern UTF-8 encoding
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ];

        try {
            $this->connection = new PDO($dsn, $username, $password, $options);
        } catch (PDOException $e) {
            $this->handleConnectionError($e);
        }
    }

    /**
     * Retrieves the singular Database class instance (Singleton Pattern)
     */
    public static function getInstance(): Database 
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Retrieves the direct active PDO Connection
     */
    public function getConnection(): PDO 
    {
        if ($this->connection === null) {
            throw new RuntimeException('Database connection is not initialized.');
        }
        return $this->connection;
    }

    /**
     * Prevent cloning of the Singleton instance
     */
    private function __clone() {}

    /**
     * Prevent unserializing of the Singleton instance
     */
    public function __wakeup() 
    {
        throw new RuntimeException("Cannot unserialize a singleton class.");
    }

    /**
     * Executes a secure prepared query with parameterized arguments
     * 
     * @param string $sql Parameterized SQL query string (e.g. SELECT * FROM users WHERE email = ?)
     * @param array $params Positional or named parameters to bind
     * @return \PDOStatement
     */
    public function query(string $sql, array $params = []): \PDOStatement 
    {
        try {
            $stmt = $this->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->handleQueryError($e, $sql, $params);
        }
    }

    /**
     * Handle Database Connection Exceptions safely depending on application environment
     */
    private function handleConnectionError(PDOException $e): void 
    {
        // Always log the actual sensitive database exception internally
        error_log('SIM Database Connection Error: ' . $e->getMessage() . ' Code: ' . $e->getCode());

        if ($this->environment === 'development') {
            // In development, echo detailed exception to support fast debugging
            throw new RuntimeException(
                sprintf('Database Connection Failed: [%d] %s', (int)$e->getCode(), $e->getMessage()),
                (int)$e->getCode(),
                $e
            );
        }

        // In production, mask credentials and server structures to avoid data leaks
        throw new RuntimeException(
            'We are experiencing a temporary issue connecting to our registry services. Please try again shortly or contact SIM Secretariat support.',
            500
        );
    }

    /**
     * Handle Query Execution Exceptions safely depending on application environment
     */
    private function handleQueryError(PDOException $e, string $sql, array $params): void 
    {
        // Log query details and inputs internally for debugging audits
        $logDetails = sprintf(
            'Query: %s | Params: %s | Error: %s',
            $sql,
            json_encode($params),
            $e->getMessage()
        );
        error_log('SIM Database Query Error: ' . $logDetails);

        if ($this->environment === 'development') {
            throw new RuntimeException(
                sprintf('Database Query Failed: %s. SQL: %s', $e->getMessage(), $sql),
                (int)$e->getCode(),
                $e
            );
        }

        // Mask query details in production
        throw new RuntimeException(
            'An error occurred while processing your database request. The transaction has been logged securely.',
            500
        );
    }
}
