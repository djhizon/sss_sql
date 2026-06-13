package com.sss.loan;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

/**
 * Abstract base class for Data Access Objects.
 * Demonstrates Abstraction and Inheritance.
 */
public abstract class BaseDAO<T> {
    
    /**
     * Protected method to get connection, accessible only to subclasses.
     */
    protected Connection getConnection() throws SQLException {
        return DatabaseConfig.getConnection();
    }

    // Abstract methods that subclasses must implement (Polymorphism)
    public abstract void insert(T entity) throws SQLException;
    public abstract void update(T entity) throws SQLException;
    public abstract void delete(long id) throws SQLException;
    public abstract List<T> getAll() throws SQLException;
    public abstract T getById(long id) throws SQLException;
}
