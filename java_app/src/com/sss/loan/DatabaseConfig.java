package com.sss.loan;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Handles database connection configuration and pooling.
 * Demonstrates Abstraction by hiding complex connection logic.
 */
public class DatabaseConfig {
    
    // IMPORTANT: The user must replace these with their Supabase PostgreSQL credentials
    private static final String JDBC_URL = "jdbc:postgresql://db.YOUR_PROJECT_ID.supabase.co:5432/postgres";
    private static final String DB_USER = "postgres";
    private static final String DB_PASSWORD = "YOUR_DATABASE_PASSWORD";

    /**
     * Establishes a connection to the PostgreSQL database.
     * Demonstrates Exception Handling by throwing SQLException.
     * 
     * @return Connection object
     * @throws SQLException if a database access error occurs
     */
    public static Connection getConnection() throws SQLException {
        try {
            // Ensure the PostgreSQL driver is loaded
            Class.forName("org.postgresql.Driver");
            return DriverManager.getConnection(JDBC_URL, DB_USER, DB_PASSWORD);
        } catch (ClassNotFoundException e) {
            throw new SQLException("PostgreSQL JDBC Driver not found in classpath.", e);
        }
    }
}
