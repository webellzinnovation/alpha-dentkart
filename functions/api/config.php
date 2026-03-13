<?php
// backend/api/config.php

// 1. Database Credentials (UPDATE THESE AFTER UPLOADING TO HOSTINGER)
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_alphadentkart'); // Example Hostinger DB Name
define('DB_USER', 'u123456789_admin');       // Example Hostinger User
define('DB_PASS', 'YourStrongPassword123!');

// 2. Error Reporting (Disable in Production)
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// 3. CORS & Headers (Allow React App to connect)
header("Access-Control-Allow-Origin: *"); // Update with your domain in production
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle Preflight Options Request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 4. Database Connection (PDO)
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // Return standard JSON error, don't leak stack trace
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed. Check config.php']);
    exit();
}
?>