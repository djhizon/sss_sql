package com.sss.loan;

import javax.swing.*;
import java.awt.*;
import java.sql.SQLException;
import java.util.List;

/**
 * Main application class driving the JOptionPane menu system.
 */
public class MainMenu {

    private final ApplicationDAO dao;

    public MainMenu() {
        this.dao = new ApplicationDAO();
        UITheme.applySSSTheme();
    }

    public void start() {
        boolean running = true;
        
        while (running) {
            String[] options = {
                "1. Add Application",
                "2. View/Search Applications",
                "3. Update Status",
                "4. Delete Application",
                "5. Generate Report",
                "6. Exit"
            };

            String choice = (String) JOptionPane.showInputDialog(
                null,
                "Welcome to the SSS Housing Loan Application System\n\nSelect a transaction:",
                "SSS Main Menu",
                JOptionPane.PLAIN_MESSAGE,
                null,
                options,
                options[0]
            );

            if (choice == null || choice.equals(options[5])) {
                running = false;
                JOptionPane.showMessageDialog(null, "Thank you for using the SSS System.");
                System.exit(0);
            }

            try {
                char menuCode = choice.charAt(0);
                switch (menuCode) {
                    case '1': addApplication(); break;
                    case '2': viewOrSearch(); break;
                    case '3': updateApplication(); break;
                    case '4': deleteApplication(); break;
                    case '5': generateReport(); break;
                }
            } catch (SQLException e) {
                showError("Database Error: " + e.getMessage());
            } catch (Exception e) {
                showError("An unexpected error occurred: " + e.getMessage());
            }
        }
    }

    private void addApplication() throws SQLException {
        JTextField nameField = new JTextField(20);
        JTextField ssNumberField = new JTextField(12);
        
        String[] genders = {"M", "F"};
        JComboBox<String> genderBox = new JComboBox<>(genders);

        JPanel panel = new JPanel(new GridLayout(0, 1, 5, 5));
        panel.add(new JLabel("Applicant Name:"));
        panel.add(nameField);
        panel.add(new JLabel("SS Number:"));
        panel.add(ssNumberField);
        panel.add(new JLabel("Sex:"));
        panel.add(genderBox);

        int result = JOptionPane.showConfirmDialog(null, panel, "Add New SSS Application", JOptionPane.OK_CANCEL_OPTION, JOptionPane.PLAIN_MESSAGE);
        
        if (result == JOptionPane.OK_OPTION) {
            String name = nameField.getText().trim();
            String ssNum = ssNumberField.getText().trim();
            String sex = (String) genderBox.getSelectedItem();
            
            if (name.isEmpty() || ssNum.isEmpty()) {
                showError("Name and SS Number are required!");
                return;
            }

            Application app = new Application(0, name, ssNum, sex, "pending");
            dao.insert(app);
            
            JOptionPane.showMessageDialog(null, "Application submitted successfully!\nApp Number: " + app.getAppNumber(), "Success", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void viewOrSearch() throws SQLException {
        String input = JOptionPane.showInputDialog(null, "Enter Application Number to search (or leave blank to view all):", "Search", JOptionPane.QUESTION_MESSAGE);
        
        if (input == null) return; // Cancelled
        
        if (input.trim().isEmpty()) {
            generateReport(); // Re-use the generate report for "view all"
        } else {
            try {
                long appNo = Long.parseLong(input.trim());
                Application app = dao.getById(appNo);
                
                if (app != null) {
                    JOptionPane.showMessageDialog(null, "Found Record:\n\n" + app.toString(), "Search Result", JOptionPane.INFORMATION_MESSAGE);
                } else {
                    showError("No application found with number: " + appNo);
                }
            } catch (NumberFormatException e) {
                showError("Invalid Application Number format.");
            }
        }
    }

    private void updateApplication() throws SQLException {
        String input = JOptionPane.showInputDialog(null, "Enter Application Number to update status:", "Update", JOptionPane.QUESTION_MESSAGE);
        if (input == null || input.trim().isEmpty()) return;

        try {
            long appNo = Long.parseLong(input.trim());
            Application app = dao.getById(appNo);
            
            if (app != null) {
                String[] statuses = {"pending", "approved", "rejected"};
                String newStatus = (String) JOptionPane.showInputDialog(null, "Select new status for " + app.getApplicantName(), "Update Status", JOptionPane.QUESTION_MESSAGE, null, statuses, app.getStatus());
                
                if (newStatus != null) {
                    app.setStatus(newStatus);
                    dao.update(app);
                    JOptionPane.showMessageDialog(null, "Status updated successfully!", "Success", JOptionPane.INFORMATION_MESSAGE);
                }
            } else {
                showError("Application not found.");
            }
        } catch (NumberFormatException e) {
            showError("Invalid Application Number.");
        }
    }

    private void deleteApplication() throws SQLException {
        String input = JOptionPane.showInputDialog(null, "Enter Application Number to delete:", "Delete", JOptionPane.WARNING_MESSAGE);
        if (input == null || input.trim().isEmpty()) return;

        try {
            long appNo = Long.parseLong(input.trim());
            Application app = dao.getById(appNo);
            
            if (app != null) {
                int confirm = JOptionPane.showConfirmDialog(null, "Are you sure you want to delete application #" + appNo + " (" + app.getApplicantName() + ")?", "Confirm Delete", JOptionPane.YES_NO_OPTION);
                if (confirm == JOptionPane.YES_OPTION) {
                    dao.delete(appNo);
                    JOptionPane.showMessageDialog(null, "Deleted successfully.", "Success", JOptionPane.INFORMATION_MESSAGE);
                }
            } else {
                showError("Application not found.");
            }
        } catch (NumberFormatException e) {
            showError("Invalid Application Number.");
        }
    }

    private void generateReport() throws SQLException {
        List<Application> apps = dao.getAll();
        
        if (apps.isEmpty()) {
            JOptionPane.showMessageDialog(null, "No applications found in the database.", "Report", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%-10s | %-25s | %-12s | %-6s | %-10s\n", "App #", "Applicant Name", "SS Number", "Sex", "Status"));
        sb.append("-----------------------------------------------------------------------------\n");
        
        for (Application app : apps) {
            sb.append(String.format("%-10d | %-25s | %-12s | %-6s | %-10s\n", 
                app.getAppNumber(), 
                truncate(app.getApplicantName(), 25), 
                app.getSsNumber(), 
                app.getSex(), 
                app.getStatus()));
        }

        JTextArea textArea = new JTextArea(sb.toString());
        textArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        textArea.setEditable(false);
        JScrollPane scrollPane = new JScrollPane(textArea);
        scrollPane.setPreferredSize(new Dimension(600, 400));

        JOptionPane.showMessageDialog(null, scrollPane, "SSS System Report", JOptionPane.PLAIN_MESSAGE);
    }
    
    private String truncate(String str, int length) {
        if (str.length() <= length) return str;
        return str.substring(0, length - 3) + "...";
    }

    private void showError(String message) {
        JOptionPane.showMessageDialog(null, message, "Error", JOptionPane.ERROR_MESSAGE);
    }

    public static void main(String[] args) {
        // Entry point
        new MainMenu().start();
    }
}
