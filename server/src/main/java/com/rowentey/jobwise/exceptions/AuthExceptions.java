package com.rowentey.jobwise.exceptions;

public class AuthExceptions {
    public static class UsernameExistsException extends Exception {
        public UsernameExistsException(String message) {
            super(message);
        }
    }

    public static class EmailExistsException extends Exception {
        public EmailExistsException(String message) {
            super(message);
        }
    }

    public static class InvalidRefreshTokenException extends Exception {
        public InvalidRefreshTokenException(String message) {
            super(message);
        }
    }
}
