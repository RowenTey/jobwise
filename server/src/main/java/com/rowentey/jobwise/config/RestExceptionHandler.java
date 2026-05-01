package com.rowentey.jobwise.config;

import com.rowentey.jobwise.dto.ErrorResponse;
import com.rowentey.jobwise.exceptions.ForbiddenException;
import com.rowentey.jobwise.exceptions.InvalidApiKeyException;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class RestExceptionHandler {
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex) {
        return new ResponseEntity<>(new ErrorResponse("Resource not found - " + ex.getMessage()),
                HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbiddenException(ForbiddenException ex) {
        return new ResponseEntity<>(new ErrorResponse(ex.getMessage()),
                HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(InvalidApiKeyException.class)
    public ResponseEntity<ErrorResponse> handleInvalidApiKeyException(InvalidApiKeyException ex) {
        return new ResponseEntity<>(new ErrorResponse(ex.getMessage()),
                HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            NoResourceFoundException ex) {
        return new ResponseEntity<>(new ErrorResponse("Resource not found - " + ex.getMessage()),
                HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(IllegalArgumentException ex) {
        return new ResponseEntity<>(new ErrorResponse("Bad request - " + ex.getMessage()),
                HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Unhandled exception", ex);
        return new ResponseEntity<>(new ErrorResponse("Error occured - " + ex.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
