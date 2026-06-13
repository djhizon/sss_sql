# SSS Java Desktop Application

This directory contains the pure Java Object-Oriented Desktop application designed to strictly satisfy your school assignment rubric while retaining the database and styling elements from the web app.

## Features Completed
- **JOptionPane Menu-Driven UI:** Custom styled dialogs matching the SSS Navy Blue theme.
- **Database Integration:** Connects directly to Supabase via JDBC.
- **OOP Principles Demonstrated:**
  - *Encapsulation:* `Application` model class with private fields and getters/setters.
  - *Inheritance & Abstraction:* `BaseDAO` abstract class inherited by `ApplicationDAO`.
  - *Polymorphism:* Overriding methods and overloaded constructors.
  - *Exception Handling:* `try-catch` blocks wrapping SQL logic.
- **CRUD Operations:** Add, View/Search, Update, Delete, and Generate Reports.

## How to Run It

Since you did not provide the database credentials yet, you must update them before compiling!

### 1. Update Credentials
Open `java_app/src/com/sss/loan/DatabaseConfig.java` and replace the placeholder constants with your actual Supabase JDBC Connection URL and Database Password.

### 2. Download the PostgreSQL JDBC Driver
You need the driver to connect Java to your database.
1. Download `postgresql-42.7.3.jar` from the [official PostgreSQL JDBC website](https://jdbc.postgresql.org/download/).
2. Place the `.jar` file inside the `java_app/lib` folder.

### 3. Compile and Run (Terminal)
Open your terminal, navigate to the `java_app` directory, and run the following commands:

**Windows (PowerShell/CMD):**
```bash
# Compile
javac -cp "lib/postgresql-42.7.3.jar" src/com/sss/loan/*.java -d bin

# Run
java -cp "bin;lib/postgresql-42.7.3.jar" com.sss.loan.MainMenu
```

**Mac/Linux:**
```bash
# Compile
javac -cp "lib/postgresql-42.7.3.jar" src/com/sss/loan/*.java -d bin

# Run
java -cp "bin:lib/postgresql-42.7.3.jar" com.sss.loan.MainMenu
```

Alternatively, you can just open the `java_app` folder in an IDE like **IntelliJ IDEA**, **Eclipse**, or **VS Code**, add the `.jar` to your build path, and click "Run" on `MainMenu.java`!
