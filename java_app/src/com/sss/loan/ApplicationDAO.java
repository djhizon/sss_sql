package com.sss.loan;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Access Object for Applications.
 * Demonstrates Inheritance (extends BaseDAO) and Exception Handling.
 */
public class ApplicationDAO extends BaseDAO<Application> {

    @Override
    public void insert(Application app) throws SQLException {
        // Find a default user_id to satisfy the foreign key constraint
        String userId = getDefaultUserId();
        
        String sql = "INSERT INTO public.applications " +
                     "(user_id, applicant_name, ap_ss_num, ap_sex, ap_dob, ap_civil_status, ap_local_address, ap_mobile_no, " +
                     "ap_employer_num, ap_employer_taxid, ap_typeofemployer, ap_employer_name, ap_occupation, " +
                     "ap_employer_address, ap_employer_tel_no, status) " +
                     "VALUES (?::uuid, ?, ?, ?, '1990-01-01', 'S', 'N/A', '0000000000', '0000000000', '0000000000', 'B', 'N/A', 'N/A', 'N/A', '0000000000', 'pending')";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setString(1, userId);
            stmt.setString(2, app.getApplicantName());
            stmt.setString(3, app.getSsNumber());
            stmt.setString(4, app.getSex());
            
            stmt.executeUpdate();
            
            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    app.setAppNumber(generatedKeys.getLong(1));
                }
            }
        }
    }

    @Override
    public void update(Application app) throws SQLException {
        String sql = "UPDATE public.applications SET applicant_name = ?, ap_ss_num = ?, ap_sex = ?, status = ? WHERE app_number = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, app.getApplicantName());
            stmt.setString(2, app.getSsNumber());
            stmt.setString(3, app.getSex());
            stmt.setString(4, app.getStatus());
            stmt.setLong(5, app.getAppNumber());
            
            stmt.executeUpdate();
        }
    }

    @Override
    public void delete(long id) throws SQLException {
        String sql = "DELETE FROM public.applications WHERE app_number = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.executeUpdate();
        }
    }

    @Override
    public List<Application> getAll() throws SQLException {
        List<Application> list = new ArrayList<>();
        String sql = "SELECT app_number, applicant_name, ap_ss_num, ap_sex, status FROM public.applications ORDER BY app_number DESC LIMIT 50";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            
            while (rs.next()) {
                list.add(new Application(
                    rs.getLong("app_number"),
                    rs.getString("applicant_name"),
                    rs.getString("ap_ss_num"),
                    rs.getString("ap_sex"),
                    rs.getString("status")
                ));
            }
        }
        return list;
    }

    @Override
    public Application getById(long id) throws SQLException {
        String sql = "SELECT app_number, applicant_name, ap_ss_num, ap_sex, status FROM public.applications WHERE app_number = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return new Application(
                        rs.getLong("app_number"),
                        rs.getString("applicant_name"),
                        rs.getString("ap_ss_num"),
                        rs.getString("ap_sex"),
                        rs.getString("status")
                    );
                }
            }
        }
        return null;
    }

    /**
     * Helper to get a valid user ID since the database requires one.
     */
    private String getDefaultUserId() throws SQLException {
        String sql = "SELECT id FROM auth.users LIMIT 1";
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                return rs.getString("id");
            }
        }
        // Fallback dummy uuid
        return "00000000-0000-0000-0000-000000000000";
    }
}
