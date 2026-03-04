# ZPay TypeScript API

This is a Node.js API built with TypeScript, Fastify, and PostgreSQL, refactored from an original Python Flask application. It handles Zcash payment processing tasks, including creating payment addresses via Docker containers.

## Prerequisites

*   Node.js (v16 or newer recommended)
*   PNPM (Package manager)
*   Docker (Running and accessible)
*   PostgreSQL (Running and accessible)
*   A database named `ZPAY` (or as configured in `DATABASE_URL`) with the schema defined by the original project (Prisma schema likely).

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd zpay-ts-api
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Configure Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file with your specific configuration:
        *   `DATABASE_URL`: Your PostgreSQL connection string.
        *   `DOCKER_IMAGE_NAME`: The name of the Docker image to use (e.g., `zcash-wallets`).
        *   `SHARED_BASE_DIR`: Path where user-specific files (addresses, transactions) will be stored by Docker containers (defaults to `./shared` in the project root). Ensure the user running the API has write permissions.
        *   `CMC_API_KEY`: (Optional) Your CoinMarketCap API key if needed as a price fallback.
        *   `API_PORT`: Port for the API server (defaults to 5001).
        *   `HOST`: Host to bind the server to (defaults to `0.0.0.0`).
        *   `LOG_LEVEL`: Logging level (e.g., `info`, `debug`).

4.  **Build the TypeScript code:**
    ```bash
    pnpm build
    ```
    This compiles the TypeScript code in `src/` to JavaScript in `dist/`.

## Running the API

*   **Development Mode (with auto-reload):**
    ```bash
    pnpm dev
    ```
    This uses `nodemon` and `ts-node` to run the API directly from TypeScript source and restarts on file changes. Logs will be nicely formatted.

*   **Production Mode:**
    1.  Ensure you have built the code (`pnpm build`).
    2.  Run the compiled JavaScript:
        ```bash
        pnpm start
        ```
        Or using Node directly:
        ```bash
        node dist/index.js
        ```

## API Endpoints

*   **`POST /create`**:
    *   Creates a transaction record, calculates the initial ZEC amount based on GBP cents, and initiates the Docker container creation process asynchronously.
    *   **Request Body (JSON):**
        ```json
        {
          "api_key": "YOUR_API_KEY",
          "user_id": "CLIENT_USER_ID", // e.g., "12345"
          "invoice_id": "INVOICE_ID",   // e.g., "67890"
          "amount": 1000                // Amount in GBP cents (e.g., 1000 = £10.00)
        }
        ```
    *   **Success Response (202 Accepted):**
        ```json
        {
          "status": "processing",
          "message": "Transaction accepted, address generation in progress. Please poll the /address endpoint.",
          "transaction_id": "c...", // The CUID of the created transaction record on your self hosted db
          "zec_amount_initial": 0.12345678 // Calculated initial ZEC amount
        }
        ```
    *   **Error Responses:** 400, 401, 422, 500, 503.

curl -X POST http://localhost:5001/create \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "user_id": "12345",
    "invoice_id": "67890",
    "amount": 1000
  }'

*   **`GET /address`**:
    *   Retrieves the status of the container and the generated payment address (if available). Polling this endpoint is necessary after calling `/create`.
    *   **Query Parameters:**
        *   `api_key`: Your API Key
        *   `user_id`: The client user ID for the transaction.
        *   `invoice_id`: The invoice ID for the transaction.
    *   **Example Request:** `GET /address?api_key=YOUR_API_KEY&user_id=12345&invoice_id=67890`
    *   **Success Response (200 OK):**
        ```json
        {
          "address": "t1...", // The generated transparent address, or "Not Available Yet"
          "container_status": "running", // e.g., "running", "exited", "Not Found / Removed"
          "runtime_minutes": 15.25
        }
        ```
    *   **Error Responses:** 400, 401, 404, 500.

*   **`POST /shared-data`**:
    *   Scans the shared file directory for the user associated with the API key, parses address and transaction files (`*-FINAL.json`), and updates the corresponding records in the database.
    *   **Request Body (JSON):**
        ```json
        {
          "api_key": "YOUR_API_KEY"
        }
        ```
    *   **Success Response (200 OK):**
        ```json
        {
          "status": "completed",
          "directories_scanned": 5,
          "directories_with_data": 3,
          "updated_records": 2,
          "failed_or_skipped_updates": 1 // Includes records not found or errors during processing/DB update
        }
        ```
    *   **Error Responses:** 400, 401, 500.

## Important Notes

*   **Asynchronous Address Generation:** The `/create` endpoint now returns a `202 Accepted` status immediately after initiating the container creation. The client *must* poll the `/address` endpoint to check the container status and retrieve the payment address once it's generated.
*   **Database Schema:** This refactor assumes the PostgreSQL database `ZPAY` already exists and has the necessary tables (`User`, `ApiKey`, `WebhookConfig`, `Transaction`) with the correct columns and types as used in the queries.
*   **Error Handling:** The API includes structured error handling. Check the response body for error codes and messages.
*   **Shared Directory Permissions:** Ensure the user running the Node.js process has read/write permissions to the directory specified by `SHARED_BASE_DIR` and its subdirectories, as both the API and the Docker containers interact with it.
*   **Security:** For production, configure CORS (`origin`) more strictly. Review database access permissions and API key security. Ensure the `.env` file is not committed to version control.
