<?php
/**
 * Test SMTP Connection API Endpoint
 * POST /backend/api/test-smtp-connection.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit();
}

try {
    // Get request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['smtpSettings'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'SMTP settings not provided'
        ]);
        exit();
    }
    
    $smtp = $data['smtpSettings'];
    
    // Validate required fields
    if (empty($smtp['host']) || empty($smtp['port']) || empty($smtp['user']) || empty($smtp['pass'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid SMTP settings. Please provide host, port, username, and password.'
        ]);
        exit();
    }
    
    // Test SMTP connection using fsockopen
    $host = $smtp['host'];
    $port = intval($smtp['port']);
    $timeout = 10;
    
    // Determine if we should use SSL
    $useSSL = ($smtp['encryption'] === 'SSL');
    $prefix = $useSSL ? 'ssl://' : '';
    
    // Try to connect
    $errno = 0;
    $errstr = '';
    $socket = @fsockopen($prefix . $host, $port, $errno, $errstr, $timeout);
    
    if (!$socket) {
        // Connection failed
        $errorMessage = "Connection failed: $errstr ($errno)\n\n";
        $errorMessage .= "Please check:\n";
        $errorMessage .= "• SMTP host is correct: $host\n";
        $errorMessage .= "• Port number is correct: $port\n";
        $errorMessage .= "• Your firewall is not blocking the connection";
        
        echo json_encode([
            'success' => false,
            'message' => $errorMessage
        ]);
        exit();
    }
    
    // Read server response
    $response = fgets($socket, 512);
    
    // Send EHLO command
    fputs($socket, "EHLO localhost\r\n");
    $response = fgets($socket, 512);
    
    // If using TLS, upgrade connection
    if ($smtp['encryption'] === 'TLS') {
        fputs($socket, "STARTTLS\r\n");
        $response = fgets($socket, 512);
        
        if (strpos($response, '220') === 0) {
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            fputs($socket, "EHLO localhost\r\n");
            $response = fgets($socket, 512);
        }
    }
    
    // Try to authenticate
    fputs($socket, "AUTH LOGIN\r\n");
    $response = fgets($socket, 512);
    
    if (strpos($response, '334') === 0) {
        // Send username
        fputs($socket, base64_encode($smtp['user']) . "\r\n");
        $response = fgets($socket, 512);
        
        if (strpos($response, '334') === 0) {
            // Send password
            fputs($socket, base64_encode($smtp['pass']) . "\r\n");
            $response = fgets($socket, 512);
            
            if (strpos($response, '235') === 0) {
                // Authentication successful
                fputs($socket, "QUIT\r\n");
                fclose($socket);
                
                echo json_encode([
                    'success' => true,
                    'message' => "Successfully connected to $host:$port\n\nYour SMTP settings are configured correctly and ready to send emails."
                ]);
                exit();
            } else {
                // Authentication failed
                fclose($socket);
                echo json_encode([
                    'success' => false,
                    'message' => "Authentication failed. Please check your username and password.\n\nFor Gmail, make sure you are using an App Password, not your regular password."
                ]);
                exit();
            }
        }
    }
    
    // Close connection
    fclose($socket);
    
    // If we got here, something went wrong
    echo json_encode([
        'success' => false,
        'message' => "Unable to authenticate with SMTP server.\n\nServer response: $response"
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
