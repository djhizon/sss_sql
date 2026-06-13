package com.sss.loan;

/**
 * Model class representing an SSS Housing Loan Application.
 * Demonstrates the OOP concept of Encapsulation.
 */
public class Application {
    
    // Private fields to encapsulate data
    private long appNumber;
    private String applicantName;
    private String ssNumber;
    private String sex;
    private String status;

    /**
     * Default constructor
     */
    public Application() {
        this.status = "pending";
    }

    /**
     * Parameterized constructor
     * Demonstrates method overloading / polymorphism
     */
    public Application(long appNumber, String applicantName, String ssNumber, String sex, String status) {
        this.appNumber = appNumber;
        this.applicantName = applicantName;
        this.ssNumber = ssNumber;
        this.sex = sex;
        this.status = status;
    }

    // Public Getters and Setters for encapsulated fields

    public long getAppNumber() {
        return appNumber;
    }

    public void setAppNumber(long appNumber) {
        this.appNumber = appNumber;
    }

    public String getApplicantName() {
        return applicantName;
    }

    public void setApplicantName(String applicantName) {
        this.applicantName = applicantName;
    }

    public String getSsNumber() {
        return ssNumber;
    }

    public void setSsNumber(String ssNumber) {
        this.ssNumber = ssNumber;
    }

    public String getSex() {
        return sex;
    }

    public void setSex(String sex) {
        this.sex = sex;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    /**
     * Overridden toString method
     */
    @Override
    public String toString() {
        return "Application #" + appNumber + " | " + applicantName + " | SS: " + ssNumber + " | Status: " + status;
    }
}
