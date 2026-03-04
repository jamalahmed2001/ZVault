// src/errors.ts

// Base class for custom application errors
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly errorCode: string;

    constructor(message: string, statusCode: number = 500, errorCode: string = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad Request', errorCode: string = 'BAD_REQUEST') {
        super(message, 400, errorCode);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized', errorCode: string = 'UNAUTHORIZED') {
        super(message, 401, errorCode);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Not Found', errorCode: string = 'NOT_FOUND') {
        super(message, 404, errorCode);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Internal Server Error', errorCode: string = 'INTERNAL_ERROR') {
        super(message, 500, errorCode);
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message: string = 'Service Unavailable', errorCode: string = 'SERVICE_UNAVAILABLE') {
        super(message, 503, errorCode);
    }
}

export class UnprocessableEntityError extends AppError {
    constructor(message: string = 'Unprocessable Entity', errorCode: string = 'UNPROCESSABLE_ENTITY') {
        super(message, 422, errorCode);
    }
}
